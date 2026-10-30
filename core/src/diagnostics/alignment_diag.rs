use crate::models::*;
use std::collections::HashMap;

/// D1: 对齐质量（6条规则）
pub fn evaluate_d1(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d1_r1_composition_chi2(data));
    results.push(d1_r2_gap_ambiguity(data));
    results.push(d1_r3_sequence_count(data));
    results.push(d1_r4_parsimony_sites(data));
    results.push(d1_r5_constant_sites(data));
    results.push(d1_r6_sequence_length(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D1".to_string(),
        dimension_name: "对齐质量".to_string(),
        grade,
        results,
    }
}

/// D1-R1：序列组成卡方检验
fn d1_r1_composition_chi2(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D1-R1".to_string(),
        dimension_id: "D1".to_string(),
        rule_name: "序列组成卡方检验".to_string(),
        ..Default::default()
    };

    if let Some(ct) = &data.composition_test {
        let n_total = ct.n_total();
        let n_failed = ct.n_failed;
        let pct = ct.failed_percentage();

        metrics.insert("n_sequences".into(), n_total as f64);
        metrics.insert("n_failed".into(), n_failed as f64);
        metrics.insert("failed_percentage".into(), pct);
        metrics.insert("significance_level".into(), ct.significance_level);
        metrics.insert("degrees_of_freedom".into(), ct.degrees_of_freedom as f64);

        let grade = if n_failed == 0 {
            Grade::A
        } else if pct < 10.0 {
            Grade::B
        } else if pct <= 30.0 {
            Grade::C
        } else if pct <= 50.0 {
            Grade::D
        } else {
            Grade::F
        };

        let failed_names: Vec<String> = ct.sequences
            .iter()
            .filter(|s| !s.passed)
            .map(|s| s.seq_name.clone())
            .collect();

        let summary = if n_failed == 0 {
            format!("所有 {} 条序列均通过了组成卡方检验（p ≥ 0.05）", n_total)
        } else {
            format!("{} 条序列（{:.1}%）未通过组成卡方检验（p < 0.05）", n_failed, pct)
        };

        let detail = if n_failed == 0 {
            "序列核苷酸组成均衡。".to_string()
        } else {
            format!("失败序列: {}", failed_names.join(", "))
        };

        let recommendation = match grade {
            Grade::A => String::new(),
            Grade::B | Grade::C => format!(
                "建议检查这些序列是否存在测序错误、污染或长程同塑性。可考虑使用复合模型（如 PoMo）或排除问题序列。"
            ),
            _ => format!(
                "超过 {:.1}% 的序列未通过组成检验。强烈建议：1）检查数据质量；2）考虑使用组成异质性模型（如 Lie Markov 模型）；3）排除组成偏差最大的序列。",
                pct
            ),
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.detail = detail;
        result.recommendation = recommendation;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未检测到组成检验数据".to_string();
        result.detail = "日志文件中未找到组成卡方检验表。".to_string();
    }

    result
}

/// D1-R2：Gap/歧义字符比例
fn d1_r2_gap_ambiguity(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D1-R2".to_string(),
        dimension_id: "D1".to_string(),
        rule_name: "Gap/歧义字符比例".to_string(),
        ..Default::default()
    };

    if let Some(ct) = &data.composition_test {
        let max_gap = ct.sequences.iter().map(|s| s.gap_percentage).fold(0.0f64, f64::max);
        let total_gap = ct.total_gap_percentage;
        let high_gap_seqs: Vec<String> = ct.sequences
            .iter()
            .filter(|s| s.gap_percentage >= 5.0)
            .map(|s| s.seq_name.clone())
            .collect();

        metrics.insert("max_gap_percentage".into(), max_gap);
        metrics.insert("total_gap_percentage".into(), total_gap);

        let grade = if max_gap > 50.0 && total_gap > 20.0 {
            Grade::F
        } else if max_gap > 50.0 {
            Grade::D
        } else if max_gap >= 20.0 {
            Grade::C
        } else if max_gap >= 5.0 {
            Grade::B
        } else {
            Grade::A
        };

        let summary = if high_gap_seqs.is_empty() {
            format!("所有序列 gap 比例均在合理范围内（< 5%），总体 gap 比例: {:.2}%", total_gap)
        } else {
            format!("{} 条序列 gap 比例较高（> 5%），总体 gap 比例: {:.2}%", high_gap_seqs.len(), total_gap)
        };

        let detail = if high_gap_seqs.is_empty() {
            String::new()
        } else {
            format!("高 gap 序列: {}", high_gap_seqs.join(", "))
        };

        let recommendation = if grade >= Grade::C && !high_gap_seqs.is_empty() {
            format!("序列 {} 含有较高比例的 gap/歧义字符。大量 gap 可能影响比对质量和建树准确性。", high_gap_seqs.join(", "))
        } else {
            String::new()
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.detail = detail;
        result.recommendation = recommendation;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未检测到 gap 数据".to_string();
    }

    result
}

/// D1-R3：序列数量充分性
fn d1_r3_sequence_count(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D1-R3".to_string(),
        dimension_id: "D1".to_string(),
        rule_name: "序列数量充分性".to_string(),
        ..Default::default()
    };

    if let Some(aln) = &data.alignment {
        let n = aln.n_sequences;
        metrics.insert("n_sequences".into(), n as f64);

        let grade = if n >= 50 {
            Grade::A
        } else if n >= 20 {
            Grade::B
        } else if n >= 10 {
            Grade::C
        } else if n >= 4 {
            Grade::D
        } else {
            Grade::F
        };

        let summary = format!("当前数据集包含 {} 条序列", n);
        let recommendation = match grade {
            Grade::C => format!("建议至少使用 20 条以上序列以获得更可靠的拓扑估计。"),
            Grade::D => format!("仅 {} 条序列，系统发育推断的统计功效不足，节点支持值可能偏高。建议增加分类群采样。", n),
            _ => String::new(),
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.recommendation = recommendation;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未检测到对齐信息".to_string();
    }

    result
}

/// D1-R4：信息位点充分性
fn d1_r4_parsimony_sites(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D1-R4".to_string(),
        dimension_id: "D1".to_string(),
        rule_name: "信息位点充分性".to_string(),
        ..Default::default()
    };

    if let Some(aln) = &data.alignment {
        let n_info = aln.n_informative_sites;
        let pct = aln.frac_informative() * 100.0;

        metrics.insert("n_informative_sites".into(), n_info as f64);
        metrics.insert("informative_percentage".into(), pct);

        let grade = if n_info < 10 {
            Grade::F
        } else if pct < 5.0 || n_info < 50 {
            Grade::D
        } else if pct < 15.0 || n_info < 100 {
            Grade::C
        } else if pct < 30.0 || n_info < 500 {
            Grade::B
        } else {
            Grade::A
        };

        let summary = format!("信息位点占比 {:.1}%（{} 个）", pct, n_info);
        let recommendation = match grade {
            Grade::C => format!("信息位点占比 {:.1}%（{} 个），系统发育信号偏弱。建议增加序列长度或补充更多变异位点。", pct, n_info),
            Grade::D | Grade::F => format!("信息位点极少（{} 个，{:.1}%），数据缺乏足够的系统发育信号。建议：1）增加比对长度；2）检查比对是否正确；3）考虑使用更快速的演化区域。", n_info, pct),
            _ => String::new(),
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.recommendation = recommendation;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未检测到对齐信息".to_string();
    }

    result
}

/// D1-R5：恒定位点比例
fn d1_r5_constant_sites(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D1-R5".to_string(),
        dimension_id: "D1".to_string(),
        rule_name: "恒定位点比例".to_string(),
        ..Default::default()
    };

    if let Some(aln) = &data.alignment {
        let pct = aln.frac_constant * 100.0;
        metrics.insert("constant_percentage".into(), pct);

        let grade = if pct > 95.0 {
            Grade::F
        } else if pct > 85.0 {
            Grade::D
        } else if pct > 70.0 {
            Grade::C
        } else if pct > 50.0 {
            Grade::B
        } else {
            Grade::A
        };

        let summary = format!("恒定位点占比 {:.1}%", pct);
        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未检测到对齐信息".to_string();
    }

    result
}

/// D1-R6：序列长度充分性
fn d1_r6_sequence_length(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D1-R6".to_string(),
        dimension_id: "D1".to_string(),
        rule_name: "序列长度充分性".to_string(),
        ..Default::default()
    };

    if let Some(aln) = &data.alignment {
        let len = aln.n_sites;
        metrics.insert("n_sites".into(), len as f64);

        let grade = if len >= 1000 {
            Grade::A
        } else if len >= 500 {
            Grade::B
        } else if len >= 200 {
            Grade::C
        } else if len >= 50 {
            Grade::D
        } else {
            Grade::F
        };

        let summary = format!("序列长度 {} 位点", len);
        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未检测到对齐信息".to_string();
    }

    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d1_rules = [
        ("D1-R1", "序列组成卡方检验"),
        ("D1-R2", "Gap/歧义字符比例"),
        ("D1-R3", "序列数量充分性"),
        ("D1-R4", "信息位点充分性"),
        ("D1-R5", "恒定位点比例"),
        ("D1-R6", "序列长度充分性"),
    ];
    for (id, name) in &d1_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D1".to_string(),
            dimension_name: "对齐质量".to_string(),
            description: String::new(),
        });
    }
}
