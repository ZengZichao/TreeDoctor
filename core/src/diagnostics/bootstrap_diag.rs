use crate::models::*;
use std::collections::HashMap;

/// D6: Bootstrap 收敛性（4条规则）
pub fn evaluate_d6(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d6_r1_correlation(data));
    results.push(d6_r2_lh_cutoff(data));
    results.push(d6_r3_iterations(data));
    results.push(d6_r4_consensus_vs_ml(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D6".to_string(),
        dimension_name: "Bootstrap 收敛性".to_string(),
        grade,
        results,
    }
}

/// D6-R1：Bootstrap 相关系数
fn d6_r1_correlation(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D6-R1".to_string(),
        dimension_id: "D6".to_string(),
        rule_name: "Bootstrap 相关系数".to_string(),
        ..Default::default()
    };

    if let Some(bs) = &data.bootstrap {
        if let Some(corr) = bs.correlation_coefficient {
            metrics.insert("correlation_coefficient".into(), corr);
            let grade = if corr >= 0.99 {
                Grade::A
            } else if corr >= 0.95 {
                Grade::B
            } else if corr >= 0.90 {
                Grade::C
            } else {
                Grade::D
            };

            let summary = format!("Bootstrap 相关系数 = {}", corr);
            let recommendation = if grade == Grade::D {
                format!("Bootstrap 相关系数为 {}，低于 0.90，表明 bootstrap 可能未充分收敛。建议增加 `-bb` 重复次数或使用 `-bnni` 选项。", corr)
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
            result.summary = "无相关系数数据".to_string();
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 bootstrap 信息".to_string();
    }

    result
}

/// D6-R2：似然截止值变化
fn d6_r2_lh_cutoff(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D6-R2".to_string(),
        dimension_id: "D6".to_string(),
        rule_name: "似然截止值变化".to_string(),
        ..Default::default()
    };

    if let Some(bs) = &data.bootstrap {
        if bs.lh_cutoffs.len() >= 2 {
            let first = bs.lh_cutoffs.first().unwrap();
            let last = bs.lh_cutoffs.last().unwrap();
            let change = if first.abs() > 0.0 {
                ((last - first).abs() / first.abs()) * 100.0
            } else {
                0.0
            };

            metrics.insert("first_cutoff".into(), *first);
            metrics.insert("last_cutoff".into(), *last);
            metrics.insert("change_percent".into(), change);

            let grade = if change < 1.0 {
                Grade::A
            } else if change < 5.0 {
                Grade::B
            } else {
                Grade::C
            };

            let summary = format!("似然截止值变化: {:.2}%", change);
            result.grade = Some(grade);
            result.summary = summary;
            result.metrics = metrics;
        } else {
            result.grade = None;
            result.evaluated = false;
            result.summary = "截止值数据不足".to_string();
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 bootstrap 信息".to_string();
    }

    result
}

/// D6-R3：迭代次数充分性
fn d6_r3_iterations(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D6-R3".to_string(),
        dimension_id: "D6".to_string(),
        rule_name: "迭代次数充分性".to_string(),
        ..Default::default()
    };

    if let Some(bs) = &data.bootstrap {
        let n = bs.n_iterations;
        metrics.insert("n_iterations".into(), n as f64);

        let grade = if n >= 100 {
            Grade::A
        } else if n >= 50 {
            Grade::C
        } else {
            Grade::D
        };

        let summary = format!("实际迭代次数: {}", n);
        result.grade = Some(grade);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无 bootstrap 信息".to_string();
    }

    result
}

/// D6-R4：一致性树似然与 ML 树似然比较
fn d6_r4_consensus_vs_ml(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D6-R4".to_string(),
        dimension_id: "D6".to_string(),
        rule_name: "一致性树似然与 ML 树似然比较".to_string(),
        ..Default::default()
    };

    if let (Some(ml_lh), Some(con_lh)) = (
        data.likelihood.as_ref().map(|l| l.log_likelihood),
        data.bootstrap.as_ref().and_then(|b| b.consensus_logl),
    ) {
        // diff = 一致性树似然 - ML树似然
        // ML 树似然应 >= 一致性树似然（ML 树是最优树）
        let diff = con_lh - ml_lh;
        metrics.insert("ml_lh".into(), ml_lh);
        metrics.insert("consensus_lh".into(), con_lh);
        metrics.insert("diff".into(), diff);

        let grade = if ml_lh >= con_lh {
            // ML 树似然 >= 一致性树似然，正常
            Grade::A
        } else if diff.abs() < 1.0 {
            // 差异极小（< 1.0），可接受
            Grade::B
        } else if diff.abs() < 10.0 {
            // 差异较小，轻微警告
            Grade::C
        } else {
            // 一致性树似然显著高于 ML 树，ML 搜索可能未找到全局最优
            Grade::F
        };

        let summary = format!("ML 树似然: {:.4}, 一致性树似然: {:.4}, 差值: {:.4}", ml_lh, con_lh, diff);
        let recommendation = if grade == Grade::F {
            format!("一致性树的对数似然（{:.4}）显著高于 ML 树（{:.4}），差值 {:.4}。这表明 ML 搜索可能未找到全局最优树。建议：1）使用一致性树替代 ML 树；2）重新运行分析增加搜索强度（如 -nump 5 -numc 5）；3）检查是否收到 IQ-TREE 的相关警告。", con_lh, ml_lh, diff)
        } else if grade == Grade::C {
            format!("一致性树似然（{:.4}）略高于 ML 树（{:.4}），差值 {:.4}。建议关注 ML 搜索是否充分。", con_lh, ml_lh, diff)
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
        result.summary = "无似然比较数据".to_string();
    }

    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d6_rules = [
        ("D6-R1", "Bootstrap 相关系数"),
        ("D6-R2", "似然截止值变化"),
        ("D6-R3", "迭代次数充分性"),
        ("D6-R4", "一致性树似然与 ML 树似然比较"),
    ];
    for (id, name) in &d6_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D6".to_string(),
            dimension_name: "Bootstrap 收敛性".to_string(),
            description: String::new(),
        });
    }
}
