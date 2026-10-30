use crate::models::*;
use std::collections::HashMap;

/// D7: 一致性树与 ML 树一致性（3条规则）
pub fn evaluate_d7(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d7_r1_rf_distance(data));
    results.push(d7_r2_consensus_threshold(data));
    results.push(d7_r3_low_support_splits(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D7".to_string(),
        dimension_name: "一致性树一致性".to_string(),
        grade,
        results,
    }
}

/// D7-R1：Robinson-Foulds 距离
fn d7_r1_rf_distance(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D7-R1".to_string(),
        dimension_id: "D7".to_string(),
        rule_name: "Robinson-Foulds 距离".to_string(),
        ..Default::default()
    };

    if let Some(bs) = &data.bootstrap {
        if let Some(rf) = bs.rf_distance {
            metrics.insert("rf_distance".into(), rf as f64);

            let grade = if rf == 0 {
                Grade::A
            } else if rf <= 2 {
                Grade::B
            } else if rf <= 5 {
                Grade::C
            } else {
                Grade::D
            };

            let summary = format!("ML 树与一致性树 RF 距离 = {}", rf);
            let recommendation = if grade == Grade::D {
                format!("ML 树与一致性树的 RF 距离为 {}，表示两棵树存在较多拓扑差异。建议关注低支持节点。", rf)
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
            result.summary = "无 RF 距离数据".to_string();
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 bootstrap 信息".to_string();
    }

    result
}

/// D7-R2：一致性树分支保留阈值
fn d7_r2_consensus_threshold(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics: HashMap<String, f64> = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D7-R2".to_string(),
        dimension_id: "D7".to_string(),
        rule_name: "一致性树分支保留阈值".to_string(),
        ..Default::default()
    };

    // 检查一致性树中的最低支持值来判断阈值类型
    if let Some(tree) = &data.consensus_tree {
        let supports = tree.collect_supports();
        if supports.is_empty() {
            // 无内部分支，无法判断
            result.grade = Some(Grade::A);
            result.summary = "一致性树无内部分支".to_string();
        } else {
            let min_support = supports.iter().map(|(s, _)| *s).fold(f64::MAX, f64::min);
            let max_support = supports.iter().map(|(s, _)| *s).fold(f64::MIN, f64::max);
            metrics.insert("min_support".into(), min_support);
            metrics.insert("max_support".into(), max_support);

            // 如果最低支持值 >= 50，说明使用了严格多数规则一致性树
            // 如果最低支持值 > 0 但 < 50，说明使用了扩展一致性树
            let grade = if min_support >= 50.0 {
                Grade::A
            } else if min_support > 0.0 {
                Grade::B
            } else {
                Grade::C
            };

            let threshold_desc = if min_support >= 50.0 {
                "严格多数规则一致性树（阈值 ≥ 50%）"
            } else if min_support > 0.0 {
                "扩展一致性树（阈值 > 0%）"
            } else {
                "完全扩展一致性树（阈值 = 0%）"
            };

            result.grade = Some(grade);
            result.summary = format!("{}，最低支持值: {:.1}%", threshold_desc, min_support);
        }
    } else if data.bootstrap.is_some() {
        // 有 bootstrap 但无一致性树数据
        result.grade = None;
        result.evaluated = false;
        result.summary = "有一致性树数据但未解析".to_string();
    } else {
        // 无 bootstrap，非 bootstrap 分析
        result.grade = None;
        result.evaluated = false;
        result.summary = "非 bootstrap 分析，无一致性树".to_string();
    }

    result
}

/// D7-R3：分裂网络中低支持分裂比例
fn d7_r3_low_support_splits(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D7-R3".to_string(),
        dimension_id: "D7".to_string(),
        rule_name: "低支持分裂比例".to_string(),
        ..Default::default()
    };

    if let Some(splits) = &data.splits {
        let ratio = splits.low_support_ratio() * 100.0;
        metrics.insert("low_support_ratio".into(), ratio);

        let grade = if ratio < 10.0 {
            Grade::A
        } else if ratio < 30.0 {
            Grade::B
        } else if ratio < 50.0 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = format!("低支持分裂比例: {:.1}%", ratio);
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

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d7_rules = [
        ("D7-R1", "Robinson-Foulds 距离"),
        ("D7-R2", "一致性树分支保留阈值"),
        ("D7-R3", "低支持分裂比例"),
    ];
    for (id, name) in &d7_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D7".to_string(),
            dimension_name: "一致性树一致性".to_string(),
            description: String::new(),
        });
    }
}
