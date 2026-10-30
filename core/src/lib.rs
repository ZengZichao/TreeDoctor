pub mod error;
pub mod models;
pub mod parsers;
pub mod diagnostics;
pub mod crosscheck;
pub mod report;

use crate::error::TreeDoctorError;
use crate::models::*;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// 报告输出格式
#[derive(Debug, Clone, Copy)]
pub enum ReportFormat {
    Text,
    Json,
    Markdown,
}

/// 从目录自动发现 IQ-TREE 输出文件并分析
pub fn analyze_directory(
    input_dir: &Path,
    prefix: Option<&str>,
) -> Result<AnalysisReport, TreeDoctorError> {
    let discovered = discover_files(input_dir, prefix)?;

    let report = analyze_files(&discovered)?;
    Ok(report)
}

/// 从指定的文件集合进行分析
pub fn analyze_files(discovered: &DiscoveredFiles) -> Result<AnalysisReport, TreeDoctorError> {
    // 读取并解析所有文件
    let mut parsed_iqtree: Option<ParsedIqtreeReport> = None;
    let mut parsed_log: Option<ParsedLog> = None;
    let mut ml_tree: Option<ParsedTree> = None;
    let mut consensus_tree: Option<ParsedTree> = None;
    let mut splits: Option<SplitsInfo> = None;
    let mut distance_matrix: Option<DistanceMatrix> = None;

    let mut files_found = Vec::new();
    let mut files_missing = Vec::new();

    // 解析 .iqtree 文件
    if let Some(path) = discovered.files.get(&FileType::IqtreeReport) {
        let content = parsers::model_gz::read_text(path)?;
        let report = parsers::iqtree_report::parse_iqtree_report(&content)?;
        // 合并 ML 树
        if parsed_iqtree.as_ref().is_none() {
            parsed_iqtree = Some(report);
        }
        files_found.push("iqtree".to_string());
    } else {
        files_missing.push("iqtree".to_string());
    }

    // 解析 .log 文件
    if let Some(path) = discovered.files.get(&FileType::Log) {
        let content = parsers::model_gz::read_text(path)?;
        let log = parsers::log::parse_log(&content)?;
        parsed_log = Some(log);
        files_found.push("log".to_string());
    } else {
        files_missing.push("log".to_string());
    }

    // 解析 .treefile
    if let Some(path) = discovered.files.get(&FileType::Treefile) {
        let content = parsers::model_gz::read_text(path)?;
        let tree = parsers::newick::parse_newick(&content)?;
        ml_tree = Some(tree);
        files_found.push("treefile".to_string());
    } else {
        files_missing.push("treefile".to_string());
    }

    // 解析 .contree
    if let Some(path) = discovered.files.get(&FileType::Contree) {
        let content = parsers::model_gz::read_text(path)?;
        if let Ok(tree) = parsers::newick::parse_newick(&content) {
            consensus_tree = Some(tree);
        }
        files_found.push("contree".to_string());
    } else {
        files_missing.push("contree".to_string());
    }

    // 解析 .splits.nex
    if let Some(path) = discovered.files.get(&FileType::SplitsNex) {
        let content = parsers::model_gz::read_text(path)?;
        splits = Some(parsers::nexus::parse_nexus(&content)?);
        files_found.push("splits.nex".to_string());
    } else {
        files_missing.push("splits.nex".to_string());
    }

    // 解析 .mldist
    if let Some(path) = discovered.files.get(&FileType::Mldist) {
        let content = parsers::model_gz::read_text(path)?;
        distance_matrix = Some(parsers::mldist::parse_mldist(&content)?);
        files_found.push("mldist".to_string());
    } else {
        files_missing.push("mldist".to_string());
    }

    // 检查可选文件
    for ft in &[FileType::ModelGz, FileType::Bionj, FileType::Checkpoint] {
        let name = match ft {
            FileType::ModelGz => "model.gz",
            FileType::Bionj => "bionj",
            FileType::Checkpoint => "ckp.gz",
            _ => "",
        };
        if discovered.files.contains_key(ft) {
            files_found.push(name.to_string());
        } else {
            files_missing.push(name.to_string());
        }
    }

    // 构建 AnalysisData
    let mut data = AnalysisData::default();

    if let Some(iq) = &parsed_iqtree {
        data.alignment = Some(iq.alignment.clone());
        data.model_finder = iq.model_finder.clone();
        data.substitution = iq.substitution.clone();
        data.likelihood = iq.likelihood.clone();
        data.ml_tree = iq.ml_tree.clone().or_else(|| ml_tree.clone());
        data.consensus_tree = iq.consensus_tree.clone().or_else(|| consensus_tree.clone());
        data.runtime = iq.runtime.clone();
        data.iqtree_version = Some(iq.version.clone());
        data.analysis_type = Some(iq.analysis_type.clone());

        // bootstrap 数据
        if let Some(n_rep) = iq.bootstrap_n_replicates {
            let mut bs = BootstrapInfo {
                enabled: true,
                bootstrap_type: BootstrapType::Ultrafast,
                n_replicates: n_rep,
                ..Default::default()
            };
            bs.consensus_logl = iq.consensus_logl;
            bs.rf_distance = iq.rf_distance;
            data.bootstrap = Some(bs);
        }
    }

    // 合并 .log 数据
    if let Some(log) = &parsed_log {
        // 对齐信息补充
        if data.alignment.is_none() {
            data.alignment = Some(log.alignment.clone());
        } else {
            // 补充 singleton sites
            if let Some(aln) = &mut data.alignment {
                if aln.n_singleton_sites.is_none() {
                    aln.n_singleton_sites = log.alignment.n_singleton_sites;
                }
            }
        }
        data.composition_test = log.composition_test.clone();

        // 合并 bootstrap
        if let Some(log_bs) = &log.bootstrap {
            if let Some(bs) = &mut data.bootstrap {
                bs.correlation_coefficient = log_bs.correlation_coefficient;
                bs.lh_cutoffs = log_bs.lh_cutoffs.clone();
                bs.n_iterations = log_bs.n_iterations;
            } else {
                data.bootstrap = Some(log_bs.clone());
            }
        }

        // 补充 runtime
        if data.runtime.is_some() {
            if let Some(rt) = &mut data.runtime {
                rt.n_threads = log.n_threads;
                rt.n_cpu_cores = log.n_cpu_cores;
                rt.random_seed = log.random_seed;
            }
        } else {
            data.runtime = Some(RuntimeInfo {
                n_threads: log.n_threads,
                n_cpu_cores: log.n_cpu_cores,
                random_seed: log.random_seed,
                ..Default::default()
            });
        }
    }

    // 合并 treefile 的树（优先使用 treefile 解析结果）
    if data.ml_tree.is_none() {
        if let Some(tree) = ml_tree.take() {
            data.ml_tree = Some(tree);
        }
    }

    if data.consensus_tree.is_none() {
        if let Some(tree) = consensus_tree.take() {
            data.consensus_tree = Some(tree);
        }
    }

    if let Some(s) = splits {
        data.splits = Some(s);
    }

    if let Some(dm) = distance_matrix {
        data.distance_matrix = Some(dm);
    }

    // 运行诊断
    let dimensions = diagnostics::run_diagnostics(&data);
    let overall = diagnostics::overall_grade(&dimensions);
    let cross_checks = crosscheck::run_cross_checks(&data);

    let prefix = discovered.prefix.clone();
    let timestamp = chrono_now();

    Ok(AnalysisReport {
        prefix,
        iqtree_version: data.iqtree_version.clone(),
        analysis_type: data.analysis_type.clone(),
        alignment: data.alignment.clone(),
        composition_test: data.composition_test.clone(),
        model_finder: data.model_finder.clone(),
        substitution: data.substitution.clone(),
        likelihood: data.likelihood.clone(),
        ml_tree: data.ml_tree.clone(),
        consensus_tree: data.consensus_tree.clone(),
        bootstrap: data.bootstrap.clone(),
        splits: data.splits.clone(),
        distance_matrix: data.distance_matrix.clone(),
        dimensions,
        cross_checks,
        overall_grade: overall,
        timestamp,
        runtime: data.runtime.clone(),
        files_found,
        files_missing,
    })
}

/// 发现文件
pub fn discover_files(
    input_dir: &Path,
    prefix: Option<&str>,
) -> Result<DiscoveredFiles, TreeDoctorError> {
    let prefix = match prefix {
        Some(p) => p.to_string(),
        None => auto_detect_prefix(input_dir)?,
    };

    let mut files: HashMap<FileType, PathBuf> = HashMap::new();
    let mut missing_critical = Vec::new();
    let mut missing_optional = Vec::new();

    let check_file = |_ft: FileType, suffix: &str| -> Option<PathBuf> {
        let path = input_dir.join(format!("{}{}", prefix, suffix));
        if path.exists() {
            Some(path)
        } else {
            None
        }
    };

    // P0 关键文件
    if let Some(p) = check_file(FileType::IqtreeReport, ".iqtree") {
        files.insert(FileType::IqtreeReport, p);
    } else {
        missing_critical.push(FileType::IqtreeReport);
    }
    if let Some(p) = check_file(FileType::Log, ".log") {
        files.insert(FileType::Log, p);
    } else {
        missing_critical.push(FileType::Log);
    }
    if let Some(p) = check_file(FileType::Treefile, ".treefile") {
        files.insert(FileType::Treefile, p);
    } else {
        missing_critical.push(FileType::Treefile);
    }

    // P1
    if let Some(p) = check_file(FileType::Contree, ".contree") {
        files.insert(FileType::Contree, p);
    } else {
        missing_optional.push(FileType::Contree);
    }
    if let Some(p) = check_file(FileType::SplitsNex, ".splits.nex") {
        files.insert(FileType::SplitsNex, p);
    } else {
        missing_optional.push(FileType::SplitsNex);
    }

    // P2
    if let Some(p) = check_file(FileType::Mldist, ".mldist") {
        files.insert(FileType::Mldist, p);
    } else {
        missing_optional.push(FileType::Mldist);
    }
    if let Some(p) = check_file(FileType::ModelGz, ".model.gz") {
        files.insert(FileType::ModelGz, p);
    } else {
        missing_optional.push(FileType::ModelGz);
    }

    // P3
    if let Some(p) = check_file(FileType::Bionj, ".bionj") {
        files.insert(FileType::Bionj, p);
    } else {
        missing_optional.push(FileType::Bionj);
    }
    if let Some(p) = check_file(FileType::Checkpoint, ".ckp.gz") {
        files.insert(FileType::Checkpoint, p);
    } else {
        missing_optional.push(FileType::Checkpoint);
    }

    Ok(DiscoveredFiles {
        prefix,
        files,
        missing_critical,
        missing_optional,
    })
}

/// 自动检测文件前缀
fn auto_detect_prefix(dir: &Path) -> Result<String, TreeDoctorError> {
    let entries: Vec<_> = std::fs::read_dir(dir).map_err(|_| TreeDoctorError::FileNotFound {
        path: dir.to_string_lossy().to_string(),
    })?.filter_map(|e| e.ok()).collect();

    let mut prefixes = Vec::new();
    for entry in &entries {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if let Some(idx) = name.rfind(".iqtree") {
            prefixes.push(name[..idx].to_string());
        }
    }

    if prefixes.is_empty() {
        // 尝试找 .treefile
        for entry in &entries {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if let Some(idx) = name.rfind(".treefile") {
                prefixes.push(name[..idx].to_string());
            }
        }
    }

    if prefixes.is_empty() {
        return Err(TreeDoctorError::FileNotFound {
            path: format!("在目录 {} 中未找到 IQ-TREE 输出文件", dir.display()),
        });
    }

    Ok(prefixes[0].clone())
}

/// 生成报告
pub fn generate_report(
    report: &AnalysisReport,
    format: ReportFormat,
) -> Result<String, TreeDoctorError> {
    match format {
        ReportFormat::Text => Ok(report::text::generate_text_report(report)),
        ReportFormat::Json => Ok(serde_json::to_string_pretty(&report::json::generate_json_report(report))?),
        ReportFormat::Markdown => Ok(report::markdown::generate_markdown_report(report)),
    }
}

/// 列出所有诊断规则
pub fn list_diagnostic_rules() -> Vec<RuleInfo> {
    diagnostics::list_rules()
}

/// 获取诊断规则数量
pub fn count_rules() -> usize {
    list_diagnostic_rules().len()
}

fn chrono_now() -> String {
    // 返回可读的 UTC 时间戳（ISO 8601 格式）
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now();
    let secs = now.duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);

    // 简单的 Unix 时间戳转 UTC 日期时间
    let days = secs / 86400;
    let remainder = secs % 86400;
    let hour = remainder / 3600;
    let minute = (remainder % 3600) / 60;
    let second = remainder % 60;

    // 计算年月日（从 1970-01-01 开始）
    let (year, month, day) = days_to_ymd(days as i64);

    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, hour, minute, second)
}

/// 将自 1970-01-01 以来的天数转换为年月日
fn days_to_ymd(days: i64) -> (i64, u32, u32) {
    let mut remaining = days;
    let mut year = 1970i64;

    loop {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if remaining < days_in_year {
            break;
        }
        remaining -= days_in_year;
        year += 1;
    }

    let days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut month = 1u32;
    let mut day = remaining as u32 + 1;

    for (i, &dim) in days_in_month.iter().enumerate() {
        let dim = if i == 1 && is_leap_year(year) { 29 } else { dim };
        if day > dim {
            day -= dim;
            month += 1;
        } else {
            break;
        }
    }

    (year, month, day)
}

fn is_leap_year(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}
