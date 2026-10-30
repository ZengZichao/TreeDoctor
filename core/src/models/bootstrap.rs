use serde::{Deserialize, Serialize};

/// Bootstrap 类型
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BootstrapType {
    Ultrafast,
    Standard,
    None,
}

impl Default for BootstrapType {
    fn default() -> Self {
        BootstrapType::None
    }
}

impl BootstrapType {
    pub fn as_str(&self) -> &'static str {
        match self {
            BootstrapType::Ultrafast => "ultrafast",
            BootstrapType::Standard => "standard",
            BootstrapType::None => "none",
        }
    }
}

/// Bootstrap 信息
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BootstrapInfo {
    pub enabled: bool,
    pub bootstrap_type: BootstrapType,
    pub n_replicates: usize,
    pub consensus_logl: Option<f64>,
    pub rf_distance: Option<usize>,
    pub correlation_coefficient: Option<f64>,
    pub lh_cutoffs: Vec<f64>,
    pub n_iterations: usize,
}

/// 分裂信息（来自 .splits.nex）
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SplitsInfo {
    pub n_taxa: usize,
    pub n_splits: usize,
    pub splits: Vec<Split>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Split {
    pub support: f64,
    pub taxon_ids: Vec<usize>,
}

impl SplitsInfo {
    /// 支持值 < 50% 的分裂数
    pub fn n_low_support(&self) -> usize {
        self.splits.iter().filter(|s| s.support < 50.0).count()
    }

    /// 支持值 > 0 的分裂数
    pub fn n_positive_support(&self) -> usize {
        self.splits.iter().filter(|s| s.support > 0.0).count()
    }

    /// 低支持分裂比例
    pub fn low_support_ratio(&self) -> f64 {
        if self.n_splits > 0 {
            self.n_low_support() as f64 / self.n_splits as f64
        } else {
            0.0
        }
    }

    /// 支持值分布（各区间数量）
    pub fn support_distribution(&self) -> [usize; 4] {
        // [0-25%, 25-50%, 50-75%, 75-100%]
        let mut dist = [0usize; 4];
        for s in &self.splits {
            if s.support < 25.0 {
                dist[0] += 1;
            } else if s.support < 50.0 {
                dist[1] += 1;
            } else if s.support < 75.0 {
                dist[2] += 1;
            } else {
                dist[3] += 1;
            }
        }
        dist
    }
}
