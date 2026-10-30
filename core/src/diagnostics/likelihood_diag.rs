use crate::models::*;
use std::collections::HashMap;

/// D3: 似然与信息准则（4条规则）
pub fn evaluate_d3(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d3_r1_logl(data));
    results.push(d3_r2_likelihood_ratio(data));
    results.push(d3_r3_se(data));
    results.push(d3_r4_info_criterion(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D3".to_string(),
        dimension_name: "似然与信息准则".to_string(),
        grade,
        results,
    }
}

/// D3-R1：对数似然值合理性
fn d3_r1_logl(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D3-R1".to_string(),
        dimension_id: "D3".to_string(),
        rule_name: "对数似然值合理性".to_string(),
        ..Default::default()
    };

    if let Some(lh) = &data.likelihood {
        metrics.insert("log_likelihood".into(), lh.log_likelihood);
        let summary = format!("最终 ML 对数似然值: {:.4}", lh.log_likelihood);
        result.grade = Some(Grade::A);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无似然信息".to_string();
    }

    result
}

/// D3-R2：似然比（约束 vs 无约束）
fn d3_r2_likelihood_ratio(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D3-R2".to_string(),
        dimension_id: "D3".to_string(),
        rule_name: "似然比（约束 vs 无约束）".to_string(),
        ..Default::default()
    };

    if let Some(lh) = &data.likelihood {
        let diff = lh.log_likelihood - lh.unconstrained_logl;
        metrics.insert("likelihood_difference".into(), diff);

        let grade = if diff < -100.0 {
            Grade::A
        } else if diff < -10.0 {
            Grade::B
        } else if diff < -1.0 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = format!(
            "tree_lh - unconstrained_lh = {:.4}",
            diff
        );

        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无似然信息".to_string();
    }

    result
}

/// D3-R3：似然值标准误
fn d3_r3_se(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D3-R3".to_string(),
        dimension_id: "D3".to_string(),
        rule_name: "似然值标准误".to_string(),
        ..Default::default()
    };

    if let Some(lh) = &data.likelihood {
        if let Some(se) = lh.se {
            let ratio = if lh.log_likelihood.abs() > 0.0 {
                (se / lh.log_likelihood.abs()) * 100.0
            } else {
                0.0
            };
            metrics.insert("se".into(), se);
            metrics.insert("se_ratio_percent".into(), ratio);

            let grade = if ratio < 1.0 {
                Grade::A
            } else if ratio < 5.0 {
                Grade::B
            } else {
                Grade::D
            };

            let summary = format!("s.e. = {:.4}，占 |lnL| 的 {:.2}%", se, ratio);
            result.grade = Some(grade);
            result.summary = summary;
            result.metrics = metrics;
        } else {
            result.grade = None;
            result.evaluated = false;
            result.summary = "无标准误数据".to_string();
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无似然信息".to_string();
    }

    result
}

/// D3-R4：信息准则值变化趋势
fn d3_r4_info_criterion(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D3-R4".to_string(),
        dimension_id: "D3".to_string(),
        rule_name: "信息准则值变化趋势".to_string(),
        ..Default::default()
    };

    if let Some(mf) = &data.model_finder {
        // 取最优模型（BIC排序第一个）的 BIC 权重
        if let Some(best) = mf.models.first() {
            let weight = best.bic_weight;
            metrics.insert("best_bic_weight".into(), weight);

            let grade = if weight > 0.9 {
                Grade::A
            } else if weight > 0.5 {
                Grade::B
            } else if weight > 0.1 {
                Grade::C
            } else {
                Grade::D
            };

            let summary = format!("最优模型 BIC 权重 = {}", weight);
            result.grade = Some(grade);
            result.summary = summary;
            result.metrics = metrics;
        } else {
            result.grade = None;
            result.evaluated = false;
            result.summary = "无模型信息".to_string();
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无模型选择信息".to_string();
    }

    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d3_rules = [
        ("D3-R1", "对数似然值合理性"),
        ("D3-R2", "似然比（约束 vs 无约束）"),
        ("D3-R3", "似然值标准误"),
        ("D3-R4", "信息准则值变化趋势"),
    ];
    for (id, name) in &d3_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D3".to_string(),
            dimension_name: "似然与信息准则".to_string(),
            description: String::new(),
        });
    }
}
