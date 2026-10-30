use serde::{Deserialize, Serialize};

/// 完整诊断报告
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AnalysisReport {
    pub prefix: String,
    pub iqtree_version: Option<String>,
    pub analysis_type: Option<String>,
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
    pub dimensions: Vec<crate::models::DimensionSummary>,
    pub cross_checks: Vec<crate::models::CrossCheckResult>,
    pub overall_grade: crate::models::Grade,
    pub timestamp: String,
    pub runtime: Option<crate::models::RuntimeInfo>,
    pub files_found: Vec<String>,
    pub files_missing: Vec<String>,
}

/// 仪表盘数据（用于 GUI）
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DashboardData {
    pub overall_grade: crate::models::Grade,
    pub dimensions: Vec<crate::models::DimensionSummary>,
    pub cross_checks: Vec<crate::models::CrossCheckResult>,
    pub key_findings: Vec<String>,
}
