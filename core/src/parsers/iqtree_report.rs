use crate::error::TreeDoctorError;
use crate::models::*;
use crate::parsers::newick::parse_newick;
use once_cell::sync::Lazy;
use regex::Regex;

/// 解析 .iqtree 主报告文件
pub fn parse_iqtree_report(content: &str) -> Result<ParsedIqtreeReport, TreeDoctorError> {
    let mut report = ParsedIqtreeReport::default();

    // 文件头
    parse_header(content, &mut report);

    // SEQUENCE ALIGNMENT 节
    parse_alignment_section(content, &mut report);

    // ModelFinder 节
    parse_modelfinder_section(content, &mut report);

    // SUBSTITUTION PROCESS 节
    parse_substitution_section(content, &mut report);

    // MAXIMUM LIKELIHOOD TREE 节
    parse_ml_tree_section(content, &mut report);

    // CONSENSUS TREE 节
    parse_consensus_tree_section(content, &mut report);

    // TIME STAMP 节
    parse_time_stamp_section(content, &mut report);

    // 警告信息
    parse_warnings(content, &mut report);

    Ok(report)
}

static RE_VERSION: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^IQ-TREE (\d+\.\d+\.\d+)").unwrap());
static RE_INPUT_FILE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^Input file name: (.+)$").unwrap());
static RE_ANALYSIS_TYPE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^Type of analysis: (.+)$").unwrap());
static RE_RANDOM_SEED: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^Random seed number: (\d+)").unwrap());

fn parse_header(content: &str, report: &mut ParsedIqtreeReport) {
    for line in content.lines() {
        if let Some(c) = RE_VERSION.captures(line) {
            report.version = c.get(1).unwrap().as_str().to_string();
        }
        if let Some(c) = RE_INPUT_FILE.captures(line) {
            report.input_file = c.get(1).unwrap().as_str().to_string();
        }
        if let Some(c) = RE_ANALYSIS_TYPE.captures(line) {
            report.analysis_type = c.get(1).unwrap().as_str().to_string();
        }
        if let Some(c) = RE_RANDOM_SEED.captures(line) {
            report.random_seed = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
    }
}

static RE_N_SEQ_N_SITES: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Input data: (\d+) (?:sequences|taxa)(?: with \d+ partitions)? with (\d+) (\w+) sites").unwrap()
});
static RE_CONSTANT: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Number of constant sites: (\d+) \(= ([\d.]+)%").unwrap());
static RE_INVARIANT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Number of invariant.*sites: (\d+)").unwrap()
});
static RE_INFORMATIVE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Number of parsimony informative sites: (\d+)").unwrap()
});
static RE_PATTERNS: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Number of distinct site patterns: (\d+)").unwrap());

fn parse_alignment_section(content: &str, report: &mut ParsedIqtreeReport) {
    let section = extract_section(content, "SEQUENCE ALIGNMENT", "ModelFinder");
    let aln = &mut report.alignment;

    if let Some(c) = RE_N_SEQ_N_SITES.captures(&section) {
        aln.n_sequences = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        aln.n_sites = c.get(2).unwrap().as_str().parse().unwrap_or(0);
        aln.seq_type = Some(SeqType::from_str(c.get(3).unwrap().as_str()));
    }
    if let Some(c) = RE_CONSTANT.captures(&section) {
        aln.n_constant_sites = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        aln.frac_constant = c.get(2).unwrap().as_str().parse().unwrap_or(0.0) / 100.0;
    }
    if let Some(c) = RE_INVARIANT.captures(&section) {
        aln.n_invariant_sites = c.get(1).unwrap().as_str().parse().unwrap_or(0);
    }
    if let Some(c) = RE_INFORMATIVE.captures(&section) {
        aln.n_informative_sites = c.get(1).unwrap().as_str().parse().unwrap_or(0);
    }
    if let Some(c) = RE_PATTERNS.captures(&section) {
        aln.n_patterns = c.get(1).unwrap().as_str().parse().unwrap_or(0);
    }
}

static RE_BEST_MODEL: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Best-fit model according to (\w+): (\S+)").unwrap());
static RE_MODEL_ROW: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(\S+)\s+(-?[\d.]+)\s+([\d.]+)\s+([+-])\s+([\d.e-]+)\s+([\d.]+)\s+([+-])\s+([\d.e-]+)\s+([\d.]+)\s+([+-])\s+([\d.e-]+)").unwrap()
});

fn parse_modelfinder_section(content: &str, report: &mut ParsedIqtreeReport) {
    let section = extract_section(content, "ModelFinder", "SUBSTITUTION PROCESS");
    if section.is_empty() {
        return;
    }

    let mut mf = ModelFinderResult::default();

    if let Some(c) = RE_BEST_MODEL.captures(&section) {
        let crit = c.get(1).unwrap().as_str();
        mf.criterion = ModelCriterion::from_str(crit);
        mf.best_model = c.get(2).unwrap().as_str().to_string();
    }

    for line in section.lines() {
        if let Some(c) = RE_MODEL_ROW.captures(line) {
            let entry = ModelEntry {
                name: c.get(1).unwrap().as_str().to_string(),
                logl: c.get(2).unwrap().as_str().parse().unwrap_or(0.0),
                aic: c.get(3).unwrap().as_str().parse().unwrap_or(0.0),
                aic_in_confidence_set: c.get(4).unwrap().as_str() == "+",
                aic_weight: parse_f64_sci(c.get(5).unwrap().as_str()),
                aicc: c.get(6).unwrap().as_str().parse().unwrap_or(0.0),
                aicc_in_confidence_set: c.get(7).unwrap().as_str() == "+",
                aicc_weight: parse_f64_sci(c.get(8).unwrap().as_str()),
                bic: c.get(9).unwrap().as_str().parse().unwrap_or(0.0),
                bic_in_confidence_set: c.get(10).unwrap().as_str() == "+",
                bic_weight: parse_f64_sci(c.get(11).unwrap().as_str()),
                ..Default::default()
            };
            mf.models.push(entry);
        }
    }

    // 确定各准则最优模型
    if !mf.models.is_empty() {
        // 按各准则排序找出最小值
        let mut sorted = mf.models.clone();
        sorted.sort_by(|a, b| a.aic.partial_cmp(&b.aic).unwrap());
        mf.best_aic = Some(sorted[0].name.clone());
        sorted.sort_by(|a, b| a.aicc.partial_cmp(&b.aicc).unwrap());
        mf.best_aicc = Some(sorted[0].name.clone());
        sorted.sort_by(|a, b| a.bic.partial_cmp(&b.bic).unwrap());
        mf.best_bic = Some(sorted[0].name.clone());
    }

    report.model_finder = Some(mf);
}

static RE_SUB_MODEL: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Model of substitution: (\S+)").unwrap());
static RE_RATE_PARAM: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^\s+([A-Z]-[A-Z]):\s+([\d.]+)").unwrap()
});
static RE_STATE_FREQ: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"pi\(([A-Z])\)\s*=\s*([\d.]+)").unwrap());
static RE_RATE_HET: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Model of rate heterogeneity: (.+)").unwrap());
static RE_PINV: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Proportion of invariable sites: ([\d.]+)").unwrap());
static RE_ALPHA: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Gamma shape alpha: ([\d.]+)").unwrap());
static RE_RATE_CAT: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^\s+(\d+)\s+([\d.e-]+)\s+([\d.]+)").unwrap());

fn parse_substitution_section(content: &str, report: &mut ParsedIqtreeReport) {
    let section = extract_section(content, "SUBSTITUTION PROCESS", "MAXIMUM LIKELIHOOD TREE");
    if section.is_empty() {
        return;
    }

    let mut sp = SubstitutionProcess::default();

    if let Some(c) = RE_SUB_MODEL.captures(&section) {
        sp.model_name = c.get(1).unwrap().as_str().to_string();
    }

    for line in section.lines() {
        if let Some(c) = RE_RATE_PARAM.captures(line) {
            let key = c.get(1).unwrap().as_str().to_string();
            let val: f64 = c.get(2).unwrap().as_str().parse().unwrap_or(0.0);
            sp.rate_params.insert(key, val);
        }
        for c in RE_STATE_FREQ.captures_iter(line) {
            let key = c.get(1).unwrap().as_str().to_string();
            let val: f64 = c.get(2).unwrap().as_str().parse().unwrap_or(0.0);
            sp.state_frequencies.insert(key, val);
        }
        if let Some(c) = RE_RATE_HET.captures(line) {
            let s = c.get(1).unwrap().as_str();
            sp.rate_heterogeneity = parse_rate_heterogeneity(s);
        }
        if let Some(c) = RE_PINV.captures(line) {
            sp.pinv = Some(c.get(1).unwrap().as_str().parse().unwrap_or(0.0));
        }
        if let Some(c) = RE_ALPHA.captures(line) {
            sp.alpha = Some(c.get(1).unwrap().as_str().parse().unwrap_or(0.0));
        }
        if let Some(c) = RE_RATE_CAT.captures(line) {
            let idx: usize = c.get(1).unwrap().as_str().parse().unwrap_or(0);
            let rate: f64 = c.get(2).unwrap().as_str().parse().unwrap_or(0.0);
            let prop: f64 = c.get(3).unwrap().as_str().parse().unwrap_or(0.0);
            sp.rate_categories.push(RateCategory {
                index: idx,
                relative_rate: rate,
                proportion: prop,
            });
        }
    }

    report.substitution = Some(sp);
}

fn parse_rate_heterogeneity(s: &str) -> RateHeterogeneity {
    let s = s.trim();
    if s.starts_with("Invar+Gamma") {
        let n = extract_n_categories(s, 4);
        RateHeterogeneity::InvariantGamma { n_categories: n }
    } else if s.starts_with("Gamma") {
        let n = extract_n_categories(s, 4);
        RateHeterogeneity::Gamma { n_categories: n }
    } else if s.starts_with("Invariant") {
        RateHeterogeneity::Invariant
    } else if s.starts_with("FreeRate") {
        let n = extract_n_categories(s, 4);
        RateHeterogeneity::FreeRate { n_categories: n }
    } else if s.starts_with("Heterotachy") {
        let n = extract_n_categories(s, 4);
        RateHeterogeneity::Heterotachy { n_categories: n }
    } else {
        RateHeterogeneity::None
    }
}

fn extract_n_categories(s: &str, default: usize) -> usize {
    // 尝试从 "with 4 categories" 中提取数字
    if let Some(pos) = s.find("with ") {
        let rest = &s[pos + 5..];
        let num: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
        if let Ok(n) = num.parse::<usize>() {
            return n;
        }
    }
    default
}

static RE_LOGL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Log-likelihood of the tree: (-?[\d.]+)(?:\s*\(s\.e\. ([\d.]+)\))?").unwrap()
});
static RE_UNCONSTRAINED: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Unconstrained log-likelihood.*: (-?[\d.]+)").unwrap()
});
static RE_N_FREE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Number of free parameters.*: (\d+)").unwrap()
});
static RE_AIC: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Akaike information criterion \(AIC\) score: ([\d.]+)").unwrap());
static RE_AICC: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Corrected Akaike.*\(AICc\) score: ([\d.]+)").unwrap()
});
static RE_BIC_SCORE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Bayesian information criterion \(BIC\) score: ([\d.]+)").unwrap()
});
static RE_TREE_LEN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Total tree length.*: ([\d.]+)").unwrap()
});
static RE_INTERNAL_BRANCH: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Sum of internal branch lengths: ([\d.]+)").unwrap()
});
static RE_INTERNAL_PCT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\(([\d.]+)% of tree length\)").unwrap()
});
static RE_NEWICK: Lazy<Regex> = Lazy::new(|| Regex::new(r"Tree in newick format:\s*\n\s*\n(.+);").unwrap());

fn parse_ml_tree_section(content: &str, report: &mut ParsedIqtreeReport) {
    let section = extract_section(content, "MAXIMUM LIKELIHOOD TREE", "CONSENSUS TREE");
    if section.is_empty() {
        return;
    }

    let mut lh = LikelihoodInfo::default();

    if let Some(c) = RE_LOGL.captures(&section) {
        lh.log_likelihood = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
        if let Some(se) = c.get(2) {
            lh.se = Some(se.as_str().parse().unwrap_or(0.0));
        }
    }
    if let Some(c) = RE_UNCONSTRAINED.captures(&section) {
        lh.unconstrained_logl = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
    }
    if let Some(c) = RE_N_FREE.captures(&section) {
        lh.n_free_parameters = c.get(1).unwrap().as_str().parse().unwrap_or(0);
    }
    if let Some(c) = RE_AIC.captures(&section) {
        lh.aic = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
    }
    if let Some(c) = RE_AICC.captures(&section) {
        lh.aicc = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
    }
    if let Some(c) = RE_BIC_SCORE.captures(&section) {
        lh.bic = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
    }

    report.likelihood = Some(lh);

    // 解析 Newick
    if let Some(c) = RE_NEWICK.captures(&section) {
        let nw = c.get(1).unwrap().as_str().trim();
        report.raw_newick_ml = Some(nw.to_string());
        if let Ok(tree) = parse_newick(nw) {
            // 用 .iqtree 报告中的总树长和内部分支覆盖（更精确）
            let mut tree = tree;
            if let Some(c) = RE_TREE_LEN.captures(&section) {
                tree.total_tree_length = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
            }
            if let Some(c) = RE_INTERNAL_BRANCH.captures(&section) {
                tree.internal_branch_length = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
            }
            if let Some(c) = RE_INTERNAL_PCT.captures(&section) {
                tree.internal_branch_percentage = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
            }
            report.ml_tree = Some(tree);
        }
    }
}

static RE_CONS_N_REP: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"constructed from (\d+) bootstrap trees").unwrap()
});
static RE_CONS_LOGL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Log-likelihood of consensus tree: (-?[\d.]+)").unwrap()
});
static RE_RF: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Robinson-Foulds distance.*: (\d+)").unwrap()
});
static RE_CONS_NEWICK: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Consensus tree in newick format:\s*\n\s*\n(.+);").unwrap()
});

fn parse_consensus_tree_section(content: &str, report: &mut ParsedIqtreeReport) {
    let section = extract_section(content, "CONSENSUS TREE", "ALISIM COMMAND");
    if section.is_empty() {
        return;
    }

    if let Some(c) = RE_CONS_N_REP.captures(&section) {
        report.bootstrap_n_replicates = Some(c.get(1).unwrap().as_str().parse().unwrap_or(0));
    }
    if let Some(c) = RE_CONS_LOGL.captures(&section) {
        report.consensus_logl = Some(c.get(1).unwrap().as_str().parse().unwrap_or(0.0));
    }
    if let Some(c) = RE_RF.captures(&section) {
        report.rf_distance = Some(c.get(1).unwrap().as_str().parse().unwrap_or(0));
    }
    if let Some(c) = RE_CONS_NEWICK.captures(&section) {
        let nw = c.get(1).unwrap().as_str().trim();
        report.raw_newick_consensus = Some(nw.to_string());
        if let Ok(tree) = parse_newick(nw) {
            report.consensus_tree = Some(tree);
        }
    }
}

static RE_DATE: Lazy<Regex> = Lazy::new(|| Regex::new(r"Date and time: (.+)").unwrap());
static RE_CPU_TIME: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Total CPU time used: ([\d.]+) seconds").unwrap()
});
static RE_WALL_TIME: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Total wall-clock time used: ([\d.]+) seconds").unwrap()
});

fn parse_time_stamp_section(content: &str, report: &mut ParsedIqtreeReport) {
    let section = extract_section(content, "TIME STAMP", "");
    if section.is_empty() {
        return;
    }
    let mut rt = RuntimeInfo::default();
    if let Some(c) = RE_DATE.captures(&section) {
        rt.completion_date = c.get(1).unwrap().as_str().to_string();
    }
    if let Some(c) = RE_CPU_TIME.captures(&section) {
        rt.cpu_time = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
    }
    if let Some(c) = RE_WALL_TIME.captures(&section) {
        rt.wall_clock_time = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
    }
    rt.random_seed = report.random_seed;
    report.runtime = Some(rt);
}

fn parse_warnings(content: &str, report: &mut ParsedIqtreeReport) {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("WARNING:") {
            report.warnings.push(line.to_string());
        }
        if line.starts_with("**NOTE**: Consensus tree has higher likelihood") {
            report.warnings.push(line.to_string());
        }
    }
}

/// 提取两个标题之间的内容
fn extract_section(content: &str, start_marker: &str, end_marker: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let mut start = None;
    let mut end = lines.len();

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed == start_marker {
            start = Some(i);
            break;
        }
    }

    let start = match start {
        Some(s) => s,
        None => return String::new(),
    };

    if !end_marker.is_empty() {
        for (i, line) in lines.iter().enumerate().skip(start + 1) {
            let trimmed = line.trim();
            if trimmed == end_marker {
                end = i;
                break;
            }
        }
    }

    lines[start..end].join("\n")
}

/// 解析可能含科学计数法的浮点数
fn parse_f64_sci(s: &str) -> f64 {
    s.trim().parse().unwrap_or(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_header() {
        let content = "IQ-TREE 2.4.0 built Feb  7 2025\n\nInput file name: example.phy\nType of analysis: ModelFinder + tree reconstruction + ultrafast bootstrap (1000 replicates)\nRandom seed number: 496837\n";
        let mut report = ParsedIqtreeReport::default();
        parse_header(content, &mut report);
        assert_eq!(report.version, "2.4.0");
        assert_eq!(report.input_file, "example.phy");
        assert!(report.analysis_type.contains("ultrafast bootstrap"));
        assert_eq!(report.random_seed, 496837);
    }

    #[test]
    fn test_parse_alignment() {
        let content = "SEQUENCE ALIGNMENT\n------------------\n\nInput data: 17 sequences with 1998 nucleotide sites\nNumber of constant sites: 686 (= 34.3343% of all sites)\nNumber of invariant (constant or ambiguous constant) sites: 686 (= 34.3343% of all sites)\nNumber of parsimony informative sites: 1009\nNumber of distinct site patterns: 1152\n\nModelFinder";
        let mut report = ParsedIqtreeReport::default();
        parse_alignment_section(content, &mut report);
        assert_eq!(report.alignment.n_sequences, 17);
        assert_eq!(report.alignment.n_sites, 1998);
        assert_eq!(report.alignment.n_constant_sites, 686);
        assert!((report.alignment.frac_constant - 0.343343).abs() < 0.001);
        assert_eq!(report.alignment.n_informative_sites, 1009);
        assert_eq!(report.alignment.n_patterns, 1152);
    }
}
