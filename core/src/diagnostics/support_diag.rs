use crate::models::*;
use std::collections::HashMap;

/// D5: 分支支持值（5条规则）
pub fn evaluate_d5(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d5_r1_low_support(data));
    results.push(d5_r2_no_support(data));
    results.push(d5_r3_consistency(data));
    results.push(d5_r4_distribution(data));
    results.push(d5_r5_replicates(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D5".to_string(),
        dimension_name: "分支支持值".to_string(),
        grade,
        results,
    }
}

/// D5-R1：低支持值节点数
fn d5_r1_low_support(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D5-R1".to_string(),
        dimension_id: "D5".to_string(),
        rule_name: "低支持值节点数".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let supports = tree.collect_supports();
        let n_internal = supports.len();

        // UFBoot < 95% 为低支持
        let low_support: Vec<&(f64, Option<f64>)> = supports
            .iter()
            .filter(|(_, uf)| uf.map(|v| v < 95.0).unwrap_or(false))
            .collect();

        let n_low = low_support.len();
        let pct = if n_internal > 0 {
            n_low as f64 / n_internal as f64 * 100.0
        } else {
            0.0
        };

        metrics.insert("n_internal_branches".into(), n_internal as f64);
        metrics.insert("n_low_support".into(), n_low as f64);
        metrics.insert("low_support_percentage".into(), pct);

        let grade = if n_low == 0 || pct == 0.0 {
            Grade::A
        } else if pct <= 10.0 {
            Grade::B
        } else if pct <= 30.0 {
            Grade::C
        } else if pct <= 50.0 {
            Grade::D
        } else {
            Grade::F
        };

        let summary = if n_low == 0 {
            format!("所有 {} 个内部分支 UFBoot ≥ 95%", n_internal)
        } else {
            format!("共有 {} 个内部分支的 UFBoot 支持值 < 95%（占 {:.1}%）", n_low, pct)
        };

        let recommendation = if grade >= Grade::C {
            format!("共有 {} 个内部分支的 UFBoot 支持值 < 95%。这些节点的拓扑关系不可靠。建议：1）增加 bootstrap 重复次数；2）增加序列数据；3）对这些节点使用保守的解读。", n_low)
        } else {
            String::new()
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.recommendation = recommendation;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 ML 树数据".to_string();
    }

    result
}

/// D5-R2：完全无支持节点
fn d5_r2_no_support(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D5-R2".to_string(),
        dimension_id: "D5".to_string(),
        rule_name: "完全无支持节点".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let supports = tree.collect_supports();
        let n_very_low = supports
            .iter()
            .filter(|(_, uf)| uf.map(|v| v < 50.0).unwrap_or(false))
            .count();

        metrics.insert("n_very_low_support".into(), n_very_low as f64);

        let grade = if n_very_low == 0 {
            Grade::A
        } else if n_very_low <= 2 {
            Grade::C
        } else {
            Grade::F
        };

        let summary = if n_very_low == 0 {
            "无 UFBoot < 50% 的分支".to_string()
        } else {
            format!("存在 {} 个 UFBoot < 50% 的分支", n_very_low)
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 ML 树数据".to_string();
    }

    result
}

/// D5-R3：SH-aLRT 与 UFBoot 一致性
fn d5_r3_consistency(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D5-R3".to_string(),
        dimension_id: "D5".to_string(),
        rule_name: "SH-aLRT 与 UFBoot 一致性".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let supports = tree.collect_supports();
        let n_discordant = supports
            .iter()
            .filter(|(sh, uf)| {
                let sh_high = *sh >= 80.0;
                let uf_low = uf.map(|v| v < 95.0).unwrap_or(false);
                let sh_low = *sh < 80.0;
                let uf_high = uf.map(|v| v >= 95.0).unwrap_or(false);
                (sh_high && uf_low) || (sh_low && uf_high)
            })
            .count();

        metrics.insert("n_discordant".into(), n_discordant as f64);

        let grade = if n_discordant == 0 { Grade::A } else { Grade::C };
        let summary = if n_discordant == 0 {
            "SH-aLRT 与 UFBoot 一致".to_string()
        } else {
            format!("存在 {} 个分歧节点（SH-aLRT 和 UFBoot 不一致）", n_discordant)
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 ML 树数据".to_string();
    }

    result
}

/// D5-R4：支持值分布
fn d5_r4_distribution(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D5-R4".to_string(),
        dimension_id: "D5".to_string(),
        rule_name: "支持值分布".to_string(),
        ..Default::default()
    };

    if let Some(splits) = &data.splits {
        let dist = splits.support_distribution();
        metrics.insert("support_0_25".into(), dist[0] as f64);
        metrics.insert("support_25_50".into(), dist[1] as f64);
        metrics.insert("support_50_75".into(), dist[2] as f64);
        metrics.insert("support_75_100".into(), dist[3] as f64);

        let total = splits.n_splits as f64;
        let _high_ratio = if total > 0.0 {
            dist[3] as f64 / total
        } else {
            0.0
        };
        let low_ratio = if total > 0.0 {
            (dist[0] + dist[1]) as f64 / total
        } else {
            0.0
        };

        let grade = if low_ratio < 0.1 {
            Grade::A
        } else if low_ratio < 0.3 {
            Grade::B
        } else {
            Grade::D
        };

        let summary = format!(
            "支持值分布: 0-25%: {}, 25-50%: {}, 50-75%: {}, 75-100%: {}",
            dist[0], dist[1], dist[2], dist[3]
        );

        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无分裂网络数据".to_string();
    }

    result
}

/// D5-R5：bootstrap 重复次数
fn d5_r5_replicates(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D5-R5".to_string(),
        dimension_id: "D5".to_string(),
        rule_name: "Bootstrap 重复次数".to_string(),
        ..Default::default()
    };

    if let Some(bs) = &data.bootstrap {
        let n = bs.n_replicates;
        metrics.insert("n_replicates".into(), n as f64);

        let grade = if n >= 1000 {
            Grade::A
        } else if n >= 500 {
            Grade::B
        } else if n >= 100 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = format!("UFBoot 重复次数: {}", n);
        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "未使用 bootstrap".to_string();
    }

    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d5_rules = [
        ("D5-R1", "低支持值节点数"),
        ("D5-R2", "完全无支持节点"),
        ("D5-R3", "SH-aLRT 与 UFBoot 一致性"),
        ("D5-R4", "支持值分布"),
        ("D5-R5", "Bootstrap 重复次数"),
    ];
    for (id, name) in &d5_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D5".to_string(),
            dimension_name: "分支支持值".to_string(),
            description: String::new(),
        });
    }
}
