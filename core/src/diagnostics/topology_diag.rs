use crate::models::*;
use std::collections::HashMap;

/// D4: 树拓扑与分支长度（6条规则）
pub fn evaluate_d4(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d4_r1_near_zero(data));
    results.push(d4_r2_long_branch(data));
    results.push(d4_r3_tree_length(data));
    results.push(d4_r4_internal_branch(data));
    results.push(d4_r5_negative_branch(data));
    results.push(d4_r6_outlier_seq(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D4".to_string(),
        dimension_name: "树拓扑与分支长度".to_string(),
        grade,
        results,
    }
}

/// D4-R1：近零内部分支
fn d4_r1_near_zero(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D4-R1".to_string(),
        dimension_id: "D4".to_string(),
        rule_name: "近零内部分支".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let n = tree.near_zero_branches.len();
        metrics.insert("near_zero_count".into(), n as f64);

        let grade = if n == 0 {
            Grade::A
        } else if n <= 2 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = if n == 0 {
            "未检测到近零内部分支".to_string()
        } else {
            format!("检测到 {} 个近零长度的内部分支", n)
        };

        let recommendation = if grade >= Grade::C {
            format!("检测到 {} 个近零长度的内部分支。这些分支对应的节点关系不确定，可能代表快速辐射进化或多分叉。", n)
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

/// D4-R2：过长分支
fn d4_r2_long_branch(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D4-R2".to_string(),
        dimension_id: "D4".to_string(),
        rule_name: "过长分支".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let n = tree.long_branches.len();
        metrics.insert("long_branch_count".into(), n as f64);

        let grade = if n == 0 {
            Grade::A
        } else if n <= 2 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = if n == 0 {
            "未检测到异常长分支".to_string()
        } else {
            format!("检测到 {} 个异常长的分支（> 1.0）", n)
        };

        let recommendation = if grade >= Grade::C {
            format!("检测到 {} 个异常长的分支。过长分支可能表明长枝吸引或数据质量问题。建议检查对应序列。", n)
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

/// D4-R3：总树长合理性
fn d4_r3_tree_length(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D4-R3".to_string(),
        dimension_id: "D4".to_string(),
        rule_name: "总树长合理性".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let len = tree.total_tree_length;
        metrics.insert("total_tree_length".into(), len);

        let grade = if len >= 0.1 && len <= 10.0 {
            Grade::A
        } else {
            Grade::C
        };

        let summary = format!("总树长 = {:.4}", len);
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

/// D4-R4：内部分支占比
fn d4_r4_internal_branch(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D4-R4".to_string(),
        dimension_id: "D4".to_string(),
        rule_name: "内部分支占比".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let pct = tree.internal_branch_percentage;
        metrics.insert("internal_branch_percentage".into(), pct);

        let grade = if pct > 30.0 {
            Grade::A
        } else if pct > 15.0 {
            Grade::B
        } else if pct > 5.0 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = format!("内部分支占比 {:.2}%", pct);
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

/// D4-R5：负分支长度检测
fn d4_r5_negative_branch(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D4-R5".to_string(),
        dimension_id: "D4".to_string(),
        rule_name: "负分支长度检测".to_string(),
        ..Default::default()
    };

    if let Some(tree) = &data.ml_tree {
        let has_neg = tree.has_negative_branches;
        metrics.insert("has_negative_branches".into(), if has_neg { 1.0 } else { 0.0 });

        let grade = if has_neg { Grade::F } else { Grade::A };
        let summary = if has_neg {
            "检测到负分支长度".to_string()
        } else {
            "无负分支长度".to_string()
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

/// D4-R6：异常序列距离检测
fn d4_r6_outlier_seq(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D4-R6".to_string(),
        dimension_id: "D4".to_string(),
        rule_name: "异常序列距离检测".to_string(),
        ..Default::default()
    };

    if let Some(dm) = &data.distance_matrix {
        let outliers = dm.detect_outliers();
        let n_out = outliers.len();
        metrics.insert("outlier_count".into(), n_out as f64);

        let outlier_names: Vec<String> = outliers
            .iter()
            .filter_map(|&i| dm.names.get(i).cloned())
            .collect();

        let grade = if n_out == 0 {
            Grade::A
        } else if n_out == 1 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = if n_out == 0 {
            "未检测到离群序列".to_string()
        } else {
            format!("检测到 {} 条离群序列: {}", n_out, outlier_names.join(", "))
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无距离矩阵数据".to_string();
    }

    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d4_rules = [
        ("D4-R1", "近零内部分支"),
        ("D4-R2", "过长分支"),
        ("D4-R3", "总树长合理性"),
        ("D4-R4", "内部分支占比"),
        ("D4-R5", "负分支长度检测"),
        ("D4-R6", "异常序列距离检测"),
    ];
    for (id, name) in &d4_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D4".to_string(),
            dimension_name: "树拓扑与分支长度".to_string(),
            description: String::new(),
        });
    }
}
