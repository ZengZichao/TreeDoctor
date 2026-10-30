use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// ModelFinder 结果
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModelFinderResult {
    pub criterion: ModelCriterion,
    pub best_model: String,
    pub best_aic: Option<String>,
    pub best_aicc: Option<String>,
    pub best_bic: Option<String>,
    pub models: Vec<ModelEntry>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModelCriterion {
    Aic,
    Aicc,
    Bic,
}

impl Default for ModelCriterion {
    fn default() -> Self {
        ModelCriterion::Bic
    }
}

impl ModelCriterion {
    pub fn from_str(s: &str) -> Self {
        match s {
            "AIC" => ModelCriterion::Aic,
            "AICc" => ModelCriterion::Aicc,
            "BIC" => ModelCriterion::Bic,
            _ => ModelCriterion::Bic,
        }
    }
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelCriterion::Aic => "AIC",
            ModelCriterion::Aicc => "AICc",
            ModelCriterion::Bic => "BIC",
        }
    }
}

/// 单个模型的评分
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModelEntry {
    pub name: String,
    pub logl: f64,
    pub n_params: usize,
    pub aic: f64,
    pub aic_weight: f64,
    pub aic_in_confidence_set: bool,
    pub aicc: f64,
    pub aicc_weight: f64,
    pub aicc_in_confidence_set: bool,
    pub bic: f64,
    pub bic_weight: f64,
    pub bic_in_confidence_set: bool,
}

/// 替换过程信息
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SubstitutionProcess {
    pub model_name: String,
    pub rate_params: HashMap<String, f64>,
    pub state_frequencies: HashMap<String, f64>,
    pub rate_matrix: Option<Vec<Vec<f64>>>,
    pub rate_heterogeneity: RateHeterogeneity,
    pub pinv: Option<f64>,
    pub alpha: Option<f64>,
    pub rate_categories: Vec<RateCategory>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum RateHeterogeneity {
    None,
    Gamma { n_categories: usize },
    Invariant,
    InvariantGamma { n_categories: usize },
    FreeRate { n_categories: usize },
    Heterotachy { n_categories: usize },
}

impl Default for RateHeterogeneity {
    fn default() -> Self {
        RateHeterogeneity::None
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RateCategory {
    pub index: usize,
    pub relative_rate: f64,
    pub proportion: f64,
}

/// 似然与信息准则
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LikelihoodInfo {
    pub log_likelihood: f64,
    pub se: Option<f64>,
    pub unconstrained_logl: f64,
    pub n_free_parameters: usize,
    pub aic: f64,
    pub aicc: f64,
    pub bic: f64,
}
