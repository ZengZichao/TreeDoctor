use clap::{Parser, Subcommand, ValueEnum};
use std::path::PathBuf;
use treedoctor_core::models::Grade;
use treedoctor_core::ReportFormat;

#[derive(Parser)]
#[command(name = "treedoctor")]
#[command(about = "IQ-TREE 分析质量诊断工具")]
#[command(version = env!("CARGO_PKG_VERSION"))]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// 分析 IQ-TREE 输出并生成诊断报告
    Analyze {
        #[arg(value_name = "INPUT")]
        input: PathBuf,

        #[arg(short = 'p', long)]
        prefix: Option<String>,

        #[arg(short = 'f', long, value_enum, default_value = "text")]
        format: OutputFormat,

        #[arg(short = 'o', long)]
        output: Option<PathBuf>,

        #[arg(short = 'd', long, value_delimiter = ',')]
        dimensions: Option<Vec<String>>,

        #[arg(short = 'g', long, value_enum, ignore_case = true)]
        min_grade: Option<GradeArg>,

        #[arg(short = 'v', long)]
        verbose: bool,

        #[arg(short = 'q', long)]
        quiet: bool,

        #[arg(long)]
        no_color: bool,
    },

    /// 快速检查文件完整性
    Check {
        #[arg(value_name = "INPUT")]
        input: PathBuf,

        #[arg(short = 'p', long)]
        prefix: Option<String>,
    },

    /// 列出所有诊断规则
    Rules {
        #[arg(long)]
        dimension: Option<String>,
    },
}

#[derive(Clone, ValueEnum)]
enum OutputFormat {
    Text,
    Json,
    Markdown,
}

#[derive(Clone, ValueEnum)]
enum GradeArg {
    A,
    B,
    C,
    D,
    F,
}

impl GradeArg {
    fn to_grade(&self) -> Grade {
        match self {
            GradeArg::A => Grade::A,
            GradeArg::B => Grade::B,
            GradeArg::C => Grade::C,
            GradeArg::D => Grade::D,
            GradeArg::F => Grade::F,
        }
    }
}

fn main() {
    let cli = Cli::parse();

    let result = match cli.command {
        Some(Commands::Analyze {
            input,
            prefix,
            format,
            output,
            dimensions,
            min_grade,
            verbose,
            quiet,
            no_color: _,
        }) => run_analyze(input, prefix, format, output, dimensions, min_grade, verbose, quiet),
        Some(Commands::Check { input, prefix }) => run_check(input, prefix),
        Some(Commands::Rules { dimension }) => run_rules(dimension),
        None => {
            // 默认行为：显示帮助
            println!("TreeDoctor - IQ-TREE 分析质量诊断工具");
            println!("使用 `treedoctor --help` 查看可用命令");
            0
        }
    };

    std::process::exit(result);
}

fn run_analyze(
    input: PathBuf,
    prefix: Option<String>,
    format: OutputFormat,
    output: Option<PathBuf>,
    dimensions: Option<Vec<String>>,
    min_grade: Option<GradeArg>,
    verbose: bool,
    quiet: bool,
) -> i32 {
    // 确定输入目录
    let (input_dir, auto_prefix) = if input.is_file() {
        let dir = input.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
        let stem = input.file_stem().map(|s| s.to_string_lossy().to_string());
        (dir, stem)
    } else {
        (input.clone(), None)
    };

    let prefix_ref = prefix.as_deref().or(auto_prefix.as_deref());

    let report = match treedoctor_core::analyze_directory(&input_dir, prefix_ref) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("错误: {}", e);
            return 5;
        }
    };

    // 过滤维度
    let mut report = report;
    
    // 按 --dimensions 过滤
    if let Some(dims) = &dimensions {
        let dim_set: std::collections::HashSet<&str> = dims.iter().map(|s| s.as_str()).collect();
        report.dimensions.retain(|d| dim_set.contains(d.dimension_id.as_str()));
    }
    
    if let Some(min) = &min_grade {
        let min_grade_val = min.to_grade();
        // 过滤掉评级好于 min_grade 的结果
        for d in &mut report.dimensions {
            d.results.retain(|r| r.grade.unwrap_or(Grade::A) >= min_grade_val);
        }
    }

    // 生成报告
    let report_format = match format {
        OutputFormat::Text => ReportFormat::Text,
        OutputFormat::Json => ReportFormat::Json,
        OutputFormat::Markdown => ReportFormat::Markdown,
    };

    let output_text = match treedoctor_core::generate_report(&report, report_format) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("报告生成错误: {}", e);
            return 5;
        }
    };

    if quiet {
        // Quiet 模式：仅输出总体评级和关键发现
        println!(
            "TreeDoctor: {} ({}) - {}",
            report.overall_grade.letter(),
            report.overall_grade.label(),
            report.prefix
        );
        let findings = treedoctor_core::diagnostics::key_findings(&report.dimensions);
        if !findings.is_empty() {
            println!("关键发现:");
            for f in &findings {
                println!("  • {}", f);
            }
        }
    } else if let Some(out_path) = &output {
        match std::fs::write(out_path, &output_text) {
            Ok(_) => {
                println!("报告已写入: {}", out_path.display());
            }
            Err(e) => {
                eprintln!("写入文件失败: {}", e);
                return 5;
            }
        }
    } else {
        println!("{}", output_text);
        if verbose {
            // Verbose 模式：显示数值指标
            for d in &report.dimensions {
                for r in &d.results {
                    if !r.metrics.is_empty() {
                        println!("  [{}] 数值指标:", r.rule_id);
                        for (k, v) in &r.metrics {
                            println!("    {}: {}", k, v);
                        }
                    }
                }
            }
        }
    }

    // 退出码
    match report.overall_grade {
        Grade::A | Grade::B => 0,
        Grade::C => 1,
        Grade::D | Grade::F => 2,
    }
}

fn run_check(input: PathBuf, prefix: Option<String>) -> i32 {
    let (input_dir, auto_prefix) = if input.is_file() {
        let dir = input.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
        let stem = input.file_stem().map(|s| s.to_string_lossy().to_string());
        (dir, stem)
    } else {
        (input.clone(), None)
    };

    let prefix_ref = prefix.as_deref().or(auto_prefix.as_deref());

    let discovered = match treedoctor_core::discover_files(&input_dir, prefix_ref) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("错误: {}", e);
            return 4;
        }
    };

    println!("TreeDoctor 文件检查: {}", discovered.prefix);
    println!();
    println!("找到的文件:");

    let file_types = [
        (treedoctor_core::models::FileType::IqtreeReport, ".iqtree", "主报告"),
        (treedoctor_core::models::FileType::Log, ".log", "运行日志"),
        (treedoctor_core::models::FileType::Treefile, ".treefile", "ML树"),
        (treedoctor_core::models::FileType::Contree, ".contree", "一致性树"),
        (treedoctor_core::models::FileType::SplitsNex, ".splits.nex", "分裂网络"),
        (treedoctor_core::models::FileType::Mldist, ".mldist", "距离矩阵"),
        (treedoctor_core::models::FileType::ModelGz, ".model.gz", "模型详情"),
        (treedoctor_core::models::FileType::Bionj, ".bionj", "BIONJ树"),
        (treedoctor_core::models::FileType::Checkpoint, ".ckp.gz", "检查点"),
    ];

    for (ft, suffix, desc) in &file_types {
        let found = discovered.files.contains_key(ft);
        let icon = if found { "✅" } else { "❌" };
        let priority = ft.priority();
        println!("  {} {}{} ({}) [{}]", icon, discovered.prefix, suffix, desc, priority);
    }

    // 如果有关键文件，尝试解析基本统计
    if !discovered.files.is_empty() {
        println!();
        println!("基本统计:");
        if let Ok(report) = treedoctor_core::analyze_directory(&input_dir, prefix_ref) {
            if let Some(v) = &report.iqtree_version {
                println!("  IQ-TREE 版本: {}", v);
            }
            if let Some(aln) = &report.alignment {
                println!("  序列数: {}", aln.n_sequences);
                println!("  位点数: {}", aln.n_sites);
            }
            if let Some(mf) = &report.model_finder {
                println!("  最优模型: {}", mf.best_model);
            }
            if let Some(lh) = &report.likelihood {
                println!("  对数似然: {:.4}", lh.log_likelihood);
            }
            if let Some(bs) = &report.bootstrap {
                println!("  Bootstrap: UFBoot {}次", bs.n_replicates);
            }
            if let Some(rt) = &report.runtime {
                println!("  运行时间: {:.1}秒", rt.wall_clock_time);
            }
        }
    }

    println!();
    let all_critical = discovered.missing_critical.is_empty();
    println!("文件完整性: {}", if all_critical { "通过" } else { "部分缺失" });

    if all_critical { 0 } else { 4 }
}

fn run_rules(dimension: Option<String>) -> i32 {
    let all_rules = treedoctor_core::list_diagnostic_rules();
    let rules: Vec<_> = match &dimension {
        Some(d) => all_rules.iter().filter(|r| &r.dimension_id == d).collect(),
        None => all_rules.iter().collect(),
    };

    println!("TreeDoctor 诊断规则列表 (共{}条)", rules.len());
    println!();

    // 按维度分组
    let mut current_dim = String::new();
    for r in &rules {
        if r.dimension_id != current_dim {
            current_dim = r.dimension_id.clone();
            let dim_rules: Vec<_> = rules.iter().filter(|r| r.dimension_id == current_dim).collect();
            println!("{}: {} ({}条)", r.dimension_id, r.dimension_name, dim_rules.len());
        }
        println!("  {}  {}", r.rule_id, r.rule_name);
    }

    0
}
