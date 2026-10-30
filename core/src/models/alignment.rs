use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// IQ-TREE 输出文件类型
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum FileType {
    IqtreeReport,
    Log,
    Treefile,
    Contree,
    SplitsNex,
    Mldist,
    ModelGz,
    Bionj,
    Checkpoint,
    PartTrees,
    Unknown,
}

impl FileType {
    pub fn label(&self) -> &'static str {
        match self {
            FileType::IqtreeReport => "主报告",
            FileType::Log => "运行日志",
            FileType::Treefile => "ML树",
            FileType::Contree => "一致性树",
            FileType::SplitsNex => "分裂网络",
            FileType::Mldist => "距离矩阵",
            FileType::ModelGz => "模型详情",
            FileType::Bionj => "BIONJ树",
            FileType::Checkpoint => "检查点",
            FileType::PartTrees => "分区树",
            FileType::Unknown => "未知",
        }
    }

    pub fn priority(&self) -> &'static str {
        match self {
            FileType::IqtreeReport | FileType::Log | FileType::Treefile => "P0",
            FileType::Contree | FileType::SplitsNex => "P1",
            FileType::Mldist | FileType::ModelGz => "P2",
            FileType::Bionj | FileType::Checkpoint | FileType::PartTrees => "P3",
            FileType::Unknown => "",
        }
    }
}

/// 文件发现结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredFiles {
    pub prefix: String,
    pub files: HashMap<FileType, PathBuf>,
    pub missing_critical: Vec<FileType>,
    pub missing_optional: Vec<FileType>,
}

/// 序列类型
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SeqType {
    Dna,
    Rna,
    Protein,
    Codon,
    Binary,
    Morphological,
    Pomo,
    Unknown,
}

impl SeqType {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "nucleotide" | "dna" | "dna/rna" => SeqType::Dna,
            "rna" => SeqType::Rna,
            "amino-acid" | "protein" => SeqType::Protein,
            "codon" => SeqType::Codon,
            "binary" => SeqType::Binary,
            "morphological" => SeqType::Morphological,
            "pomo" => SeqType::Pomo,
            _ => SeqType::Unknown,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            SeqType::Dna => "DNA",
            SeqType::Rna => "RNA",
            SeqType::Protein => "Protein",
            SeqType::Codon => "Codon",
            SeqType::Binary => "Binary",
            SeqType::Morphological => "Morphological",
            SeqType::Pomo => "PoMo",
            SeqType::Unknown => "Unknown",
        }
    }
}

/// 对齐质量信息
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AlignmentInfo {
    pub n_sequences: usize,
    pub n_sites: usize,
    pub seq_type: Option<SeqType>,
    pub n_constant_sites: usize,
    pub frac_constant: f64,
    pub n_invariant_sites: usize,
    pub n_informative_sites: usize,
    pub n_patterns: usize,
    pub n_singleton_sites: Option<usize>,
}

impl AlignmentInfo {
    pub fn frac_informative(&self) -> f64 {
        if self.n_sites > 0 {
            self.n_informative_sites as f64 / self.n_sites as f64
        } else {
            0.0
        }
    }
}

/// 单条序列的组成检验结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeqCompositionTest {
    pub seq_name: String,
    pub gap_percentage: f64,
    pub passed: bool,
    pub p_value: f64,
}

/// 组成检验汇总
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CompositionTestSummary {
    pub sequences: Vec<SeqCompositionTest>,
    pub total_gap_percentage: f64,
    pub n_failed: usize,
    pub significance_level: f64,
    pub degrees_of_freedom: usize,
}

impl CompositionTestSummary {
    pub fn n_total(&self) -> usize {
        self.sequences.len()
    }
    pub fn failed_percentage(&self) -> f64 {
        let n = self.n_total();
        if n > 0 {
            self.n_failed as f64 / n as f64 * 100.0
        } else {
            0.0
        }
    }
    pub fn failed_seq_names(&self) -> Vec<&str> {
        self.sequences
            .iter()
            .filter(|s| !s.passed)
            .map(|s| s.seq_name.as_str())
            .collect()
    }
}

/// 运行时间信息
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RuntimeInfo {
    pub cpu_time: f64,
    pub wall_clock_time: f64,
    pub n_threads: usize,
    pub n_cpu_cores: usize,
    pub random_seed: u64,
    pub completion_date: String,
}

/// 距离矩阵
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DistanceMatrix {
    pub names: Vec<String>,
    pub matrix: Vec<Vec<f64>>,
}
