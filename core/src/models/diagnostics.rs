use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 质量评级
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum Grade {
    A,
    B,
    C,
    D,
    F,
    N,
}

impl Grade {
    pub fn label(&self) -> &'static str {
        match self {
            Grade::A => "优秀",
            Grade::B => "良好",
            Grade::C => "一般",
            Grade::D => "警告",
            Grade::F => "严重",
            Grade::N => "未评估",
        }
    }

    pub fn color(&self) -> &'static str {
        match self {
            Grade::A => "#28a745",
            Grade::B => "#6ec06e",
            Grade::C => "#ffc107",
            Grade::D => "#fd7e14",
            Grade::F => "#dc3545",
            Grade::N => "#9ca3af",
        }
    }

    pub fn letter(&self) -> &'static str {
        match self {
            Grade::A => "A",
            Grade::B => "B",
            Grade::C => "C",
            Grade::D => "D",
            Grade::F => "F",
            Grade::N => "N",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "A" => Some(Grade::A),
            "B" => Some(Grade::B),
            "C" => Some(Grade::C),
            "D" => Some(Grade::D),
            "F" => Some(Grade::F),
            "N" => Some(Grade::N),
            _ => None,
        }
    }
}

/// 单条诊断结果
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DiagnosticResult {
    pub rule_id: String,
    pub dimension_id: String,
    pub rule_name: String,
    pub grade: Option<Grade>,
    pub summary: String,
    pub detail: String,
    pub recommendation: String,
    pub metrics: HashMap<String, f64>,
    /// evaluated 为 false 时表示因数据缺失而未实际执行检查
    #[serde(default = "default_true")]
    pub evaluated: bool,
}

fn default_true() -> bool {
    true
}

impl Default for Grade {
    fn default() -> Self {
        Grade::A
    }
}

/// 维度诊断汇总
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DimensionSummary {
    pub dimension_id: String,
    pub dimension_name: String,
    pub grade: Grade,
    pub results: Vec<DiagnosticResult>,
}

/// 诊断规则元信息
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RuleInfo {
    pub rule_id: String,
    pub rule_name: String,
    pub dimension_id: String,
    pub dimension_name: String,
    pub description: String,
}

/// 交叉验证严重程度
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CrossCheckSeverity {
    Info,
    Warning,
    Error,
}

/// 交叉验证结果
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CrossCheckResult {
    pub check_id: String,
    pub check_name: String,
    pub passed: bool,
    pub message: String,
    pub severity: String,
    /// evaluated 为 false 时表示因数据缺失而未实际执行检查
    #[serde(default = "default_true")]
    pub evaluated: bool,
}

/// 诊断引擎所需的全部数据集合
#[derive(Debug, Clone, Default)]
pub struct AnalysisData {
    pub alignment: Option<crate::models::AlignmentInfo>,
    pub composition_test: Option<crate::models::CompositionTestSummary>,
    pub model_finder: Option<crate::models::ModelFinderResult>,
    pub substitution: Option<crate::models::SubstitutionProcess>,
    pub likelihood: Option<crate::models::LikelihoodInfo>,
    pub ml_tree: Option<crate::models::ParsedTree>,
    pub consensus_tree: Option<crate::models::ParsedTree>,
    pub bootstrap: Option<crate::models::BootstrapInfo>,
    pub splits: Option<crate::models::SplitsInfo>,
    pub distance_matrix: Option<crate::models::DistanceMatrix>,
    pub runtime: Option<crate::models::RuntimeInfo>,
    pub iqtree_version: Option<String>,
    pub analysis_type: Option<String>,
}

/// 单个文件解析后的结果
#[derive(Debug, Clone)]
pub enum ParsedFile {
    IqtreeReport(Box<ParsedIqtreeReport>),
    Log(Box<ParsedLog>),
    Newick(crate::models::ParsedTree),
    Splits(crate::models::SplitsInfo),
    Mldist(crate::models::DistanceMatrix),
    Other(OtherParsedFile),
}

/// .iqtree 文件解析结果
#[derive(Debug, Clone, Default)]
pub struct ParsedIqtreeReport {
    pub version: String,
    pub input_file: String,
    pub analysis_type: String,
    pub random_seed: u64,
    pub alignment: crate::models::AlignmentInfo,
    pub model_finder: Option<crate::models::ModelFinderResult>,
    pub substitution: Option<crate::models::SubstitutionProcess>,
    pub likelihood: Option<crate::models::LikelihoodInfo>,
    pub ml_tree: Option<crate::models::ParsedTree>,
    pub consensus_tree: Option<crate::models::ParsedTree>,
    pub runtime: Option<crate::models::RuntimeInfo>,
    pub warnings: Vec<String>,
    pub raw_newick_ml: Option<String>,
    pub raw_newick_consensus: Option<String>,
    pub bootstrap_n_replicates: Option<usize>,
    pub rf_distance: Option<usize>,
    pub consensus_logl: Option<f64>,
}

/// .log 文件解析结果
#[derive(Debug, Clone, Default)]
pub struct ParsedLog {
    pub alignment: crate::models::AlignmentInfo,
    pub composition_test: Option<crate::models::CompositionTestSummary>,
    pub bootstrap: Option<crate::models::BootstrapInfo>,
    pub best_score: Option<f64>,
    pub best_aic: Option<String>,
    pub best_aicc: Option<String>,
    pub best_bic: Option<String>,
    pub final_best_model: Option<String>,
    pub n_threads: usize,
    pub n_cpu_cores: usize,
    pub random_seed: u64,
    pub file_format: Option<String>,
}

/// 其他文件解析结果
#[derive(Debug, Clone)]
pub struct OtherParsedFile {
    pub file_type: crate::models::FileType,
    pub raw_content: String,
    pub parse_status: ParseStatus,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ParseStatus {
    Success,
    Skipped,
    Failed(String),
}
