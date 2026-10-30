use crate::error::TreeDoctorError;
use crate::models::*;
use once_cell::sync::Lazy;
use regex::Regex;

/// 解析 .log 日志文件
pub fn parse_log(content: &str) -> Result<ParsedLog, TreeDoctorError> {
    let mut log = ParsedLog::default();

    parse_log_header(content, &mut log);
    parse_alignment_info(content, &mut log);
    parse_composition_test(content, &mut log);
    parse_model_selection(content, &mut log);
    parse_bootstrap_info(content, &mut log);
    parse_best_score(content, &mut log);

    Ok(log)
}

static RE_THREADS: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(\d+) threads \((\d+) CPU cores detected\)").unwrap());
static RE_SEED: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Seed:\s+(\d+)").unwrap());

fn parse_log_header(content: &str, log: &mut ParsedLog) {
    for line in content.lines() {
        if let Some(c) = RE_THREADS.captures(line) {
            log.n_threads = c.get(1).unwrap().as_str().parse().unwrap_or(0);
            log.n_cpu_cores = c.get(2).unwrap().as_str().parse().unwrap_or(0);
        }
        if let Some(c) = RE_SEED.captures(line) {
            log.random_seed = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
    }
}

static RE_FILE_FORMAT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(Phylip|FASTA|Nexus|Clustal|MSF) format detected").unwrap()
});
static RE_SEQ_TYPE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"most likely contains (DNA/RNA|protein)").unwrap()
});
static RE_ALN_INFO: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Alignment has (\d+) sequences with (\d+) columns, (\d+) distinct patterns").unwrap()
});
static RE_PARS_INFO: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(\d+) parsimony-informative, (\d+) singleton sites, (\d+) constant sites").unwrap()
});

fn parse_alignment_info(content: &str, log: &mut ParsedLog) {
    for line in content.lines() {
        if let Some(c) = RE_FILE_FORMAT.captures(line) {
            log.file_format = Some(c.get(1).unwrap().as_str().to_string());
        }
        if let Some(c) = RE_ALN_INFO.captures(line) {
            log.alignment.n_sequences = c.get(1).unwrap().as_str().parse().unwrap_or(0);
            log.alignment.n_sites = c.get(2).unwrap().as_str().parse().unwrap_or(0);
            log.alignment.n_patterns = c.get(3).unwrap().as_str().parse().unwrap_or(0);
        }
        if let Some(c) = RE_PARS_INFO.captures(line) {
            log.alignment.n_informative_sites = c.get(1).unwrap().as_str().parse().unwrap_or(0);
            log.alignment.n_singleton_sites = Some(c.get(2).unwrap().as_str().parse().unwrap_or(0));
            log.alignment.n_constant_sites = c.get(3).unwrap().as_str().parse().unwrap_or(0);
            log.alignment.frac_constant = if log.alignment.n_sites > 0 {
                log.alignment.n_constant_sites as f64 / log.alignment.n_sites as f64
            } else {
                0.0
            };
        }
        if let Some(c) = RE_SEQ_TYPE.captures(line) {
            log.alignment.seq_type = Some(SeqType::from_str(c.get(1).unwrap().as_str()));
        }
    }
}

static RE_COMP_ROW: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^\s*(\d+)\s+(\S+)\s+([\d.]+)%\s+(passed|failed)\s+([\d.]+)%").unwrap()
});
static RE_COMP_TOTAL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"TOTAL\s+([\d.]+)%\s+(\d+) sequences failed composition chi2 test \(p-value<(\d+)%; df=(\d+)\)").unwrap()
});

fn parse_composition_test(content: &str, log: &mut ParsedLog) {
    let mut summary = CompositionTestSummary::default();

    for line in content.lines() {
        if let Some(c) = RE_COMP_ROW.captures(line) {
            let seq = SeqCompositionTest {
                seq_name: c.get(2).unwrap().as_str().to_string(),
                gap_percentage: c.get(3).unwrap().as_str().parse().unwrap_or(0.0),
                passed: c.get(4).unwrap().as_str() == "passed",
                p_value: c.get(5).unwrap().as_str().parse::<f64>().unwrap_or(0.0) / 100.0,
            };
            summary.sequences.push(seq);
        }
        if let Some(c) = RE_COMP_TOTAL.captures(line) {
            summary.total_gap_percentage = c.get(1).unwrap().as_str().parse().unwrap_or(0.0);
            summary.n_failed = c.get(2).unwrap().as_str().parse().unwrap_or(0);
            summary.significance_level =
                c.get(3).unwrap().as_str().parse::<f64>().unwrap_or(5.0) / 100.0;
            summary.degrees_of_freedom = c.get(4).unwrap().as_str().parse().unwrap_or(0);
        }
    }

    // 若未找到总数行但找到序列，则统计 n_failed
    if summary.n_failed == 0 && !summary.sequences.is_empty() {
        summary.n_failed = summary.sequences.iter().filter(|s| !s.passed).count();
    }

    if !summary.sequences.is_empty() || summary.n_failed > 0 {
        log.composition_test = Some(summary);
    }
}

static RE_AIC_MODEL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Akaike Information Criterion:\s+(\S+)").unwrap()
});
static RE_AICC_MODEL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Corrected Akaike Information Criterion:\s+(\S+)").unwrap()
});
static RE_BIC_MODEL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Bayesian Information Criterion:\s+(\S+)").unwrap()
});
static RE_BEST_MODEL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Best-fit model: (\S+) chosen according to (\w+)").unwrap()
});

fn parse_model_selection(content: &str, log: &mut ParsedLog) {
    for line in content.lines() {
        if let Some(c) = RE_AIC_MODEL.captures(line) {
            log.best_aic = Some(c.get(1).unwrap().as_str().to_string());
        }
        if let Some(c) = RE_AICC_MODEL.captures(line) {
            log.best_aicc = Some(c.get(1).unwrap().as_str().to_string());
        }
        if let Some(c) = RE_BIC_MODEL.captures(line) {
            log.best_bic = Some(c.get(1).unwrap().as_str().to_string());
        }
        if let Some(c) = RE_BEST_MODEL.captures(line) {
            log.final_best_model = Some(c.get(1).unwrap().as_str().to_string());
        }
    }
}

static RE_N_REP: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Generating (\d+) samples for ultrafast bootstrap").unwrap()
});
static RE_CORR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Bootstrap correlation coefficient.*: ([\d.]+)").unwrap()
});
static RE_LH_CUTOFF: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Log-likelihood cutoff on original alignment: (-?[\d.]+)").unwrap()
});
static RE_N_ITER: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"COMPLETED AFTER (\d+) ITERATIONS").unwrap()
});
static RE_TOTAL_ITER: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Total number of iterations: (\d+)").unwrap()
});

fn parse_bootstrap_info(content: &str, log: &mut ParsedLog) {
    let mut bs = BootstrapInfo {
        enabled: false,
        bootstrap_type: BootstrapType::None,
        ..Default::default()
    };

    for line in content.lines() {
        if let Some(c) = RE_N_REP.captures(line) {
            bs.enabled = true;
            bs.bootstrap_type = BootstrapType::Ultrafast;
            bs.n_replicates = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
        if let Some(c) = RE_CORR.captures(line) {
            bs.correlation_coefficient =
                Some(c.get(1).unwrap().as_str().parse().unwrap_or(0.0));
        }
        if let Some(c) = RE_LH_CUTOFF.captures(line) {
            bs.lh_cutoffs
                .push(c.get(1).unwrap().as_str().parse().unwrap_or(0.0));
        }
        if let Some(c) = RE_N_ITER.captures(line) {
            bs.n_iterations = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
        if let Some(c) = RE_TOTAL_ITER.captures(line) {
            bs.n_iterations = c.get(1).unwrap().as_str().parse().unwrap_or(0);
        }
    }

    if bs.enabled {
        log.bootstrap = Some(bs);
    }
}

static RE_BEST_SCORE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"BEST SCORE FOUND : (-?[\d.]+)").unwrap()
});

fn parse_best_score(content: &str, log: &mut ParsedLog) {
    for line in content.lines() {
        if let Some(c) = RE_BEST_SCORE.captures(line) {
            log.best_score = Some(c.get(1).unwrap().as_str().parse().unwrap_or(0.0));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_composition() {
        let content = "           Gap/Ambiguity  Composition  p-value\nAnalyzing sequences: done in 5.93e-005 secs\n   1  LngfishAu    0.15%    passed      6.20%\n   2  LngfishSA    0.00%    failed      0.62%\n****  TOTAL        0.11%  8 sequences failed composition chi2 test (p-value<5%; df=3)\n";
        let mut log = ParsedLog::default();
        parse_composition_test(content, &mut log);
        let ct = log.composition_test.unwrap();
        assert_eq!(ct.sequences.len(), 2);
        assert_eq!(ct.sequences[0].seq_name, "LngfishAu");
        assert!(ct.sequences[0].passed);
        assert!((ct.sequences[0].p_value - 0.0620).abs() < 0.001);
        assert_eq!(ct.sequences[1].seq_name, "LngfishSA");
        assert!(!ct.sequences[1].passed);
        assert_eq!(ct.n_failed, 8);
        assert_eq!(ct.significance_level, 0.05);
        assert_eq!(ct.degrees_of_freedom, 3);
    }

    #[test]
    fn test_parse_threads() {
        let content = "Kernel:  AVX+FMA - 1 threads (16 CPU cores detected)\n";
        let mut log = ParsedLog::default();
        parse_log_header(content, &mut log);
        assert_eq!(log.n_threads, 1);
        assert_eq!(log.n_cpu_cores, 16);
    }
}
