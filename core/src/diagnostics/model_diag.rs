use crate::models::*;
use std::collections::HashMap;

/// D2: 模型选择（5条规则）
pub fn evaluate_d2(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d2_r1_modelfinder(data));
    results.push(d2_r2_model_complexity(data));
    results.push(d2_r3_criterion_consistency(data));
    results.push(d2_r4_rate_heterogeneity(data));
    results.push(d2_r5_pinv(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D2".to_string(),
        dimension_name: "模型选择".to_string(),
        grade,
        results,
    }
}

/// D2-R1：ModelFinder 自动选择
fn d2_r1_modelfinder(data: &AnalysisData) -> DiagnosticResult {
    let mut result = DiagnosticResult {
        rule_id: "D2-R1".to_string(),
        dimension_id: "D2".to_string(),
        rule_name: "ModelFinder自动选择".to_string(),
        ..Default::default()
    };

    let used_mf = data.model_finder.is_some();
    let analysis_has_mf = data
        .analysis_type
        .as_ref()
        .map(|s| s.contains("ModelFinder"))
        .unwrap_or(false);

    let grade = if used_mf && analysis_has_mf {
        Grade::A
    } else if !used_mf && analysis_has_mf {
        Grade::B
    } else {
        Grade::D
    };

    let summary = if used_mf {
        format!("使用了 ModelFinder 自动选择最优模型")
    } else {
        format!("未使用 ModelFinder 自动选择")
    };

    let recommendation = if grade == Grade::D {
        "未使用 ModelFinder 自动选择模型。建议使用 `-m MFP` 让 IQ-TREE 自动选择最优模型。".to_string()
    } else {
        String::new()
    };

    result.grade = Some(grade);
    result.summary = summary;
    result.recommendation = recommendation;
    result
}

/// D2-R2：模型复杂性合理性
fn d2_r2_model_complexity(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D2-R2".to_string(),
        dimension_id: "D2".to_string(),
        rule_name: "模型复杂性合理性".to_string(),
        ..Default::default()
    };

    if let Some(lh) = &data.likelihood {
        let k = lh.n_free_parameters as f64;
        metrics.insert("n_free_parameters".into(), k);

        // 使用模式数作为 n
        let n = data.alignment.as_ref().map(|a| a.n_patterns as f64).unwrap_or(k);

        metrics.insert("n_patterns".into(), n);

        let grade = if n > 40.0 * k {
            Grade::A
        } else if n > k {
            Grade::B
        } else {
            Grade::F
        };

        let summary = format!("自由参数 K={}，样本量 n={}（模式数）", k as u64, n as u64);
        let recommendation = if grade == Grade::F {
            format!("自由参数数 K={} 已达到或超过样本量 n={}（K≥n）。模型严重过拟合，参数估计不可靠。建议：1）使用更简单的模型；2）增加序列长度；3）减少序列数。", k as u64, n as u64)
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
        result.summary = "无似然信息".to_string();
    }

    result
}

/// D2-R3：信息准则一致性
fn d2_r3_criterion_consistency(data: &AnalysisData) -> DiagnosticResult {
    let mut result = DiagnosticResult {
        rule_id: "D2-R3".to_string(),
        dimension_id: "D2".to_string(),
        rule_name: "信息准则一致性".to_string(),
        ..Default::default()
    };

    if let Some(mf) = &data.model_finder {
        let aic = mf.best_aic.as_deref().unwrap_or("");
        let aicc = mf.best_aicc.as_deref().unwrap_or("");
        let bic = mf.best_bic.as_deref().unwrap_or("");

        let grade = if aic == bic && aic == aicc {
            Grade::A
        } else if aic == aicc {
            Grade::B
        } else {
            Grade::C
        };

        let summary = format!(
            "AIC: {}, AICc: {}, BIC: {}",
            aic, aicc, bic
        );

        let recommendation = if grade == Grade::C {
            format!("AIC/AICc 推荐模型为 {}，而 BIC 推荐 {}。BIC 对参数数量惩罚更重。若数据量充足，建议使用 AICc 推荐；若数据量有限，建议使用 BIC 推荐以避免过拟合。", aic, bic)
        } else {
            String::new()
        };

        result.grade = Some(grade);
        result.summary = summary;
        result.recommendation = recommendation;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无模型选择信息".to_string();
    }

    result
}

/// D2-R4：速率异质性模型评估
fn d2_r4_rate_heterogeneity(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D2-R4".to_string(),
        dimension_id: "D2".to_string(),
        rule_name: "速率异质性评估".to_string(),
        ..Default::default()
    };

    if let Some(sp) = &data.substitution {
        match &sp.rate_heterogeneity {
            RateHeterogeneity::None => {
                result.grade = Some(Grade::C);
                result.summary = "未使用速率异质性模型".to_string();
            }
            _ => {
                if let Some(alpha) = sp.alpha {
                    metrics.insert("alpha".into(), alpha);
                    let grade = if alpha > 0.5 {
                        Grade::A
                    } else if alpha > 0.1 {
                        Grade::B
                    } else {
                        Grade::D
                    };

                    let summary = format!("Gamma shape alpha = {}", alpha);
                    let recommendation = if grade == Grade::D {
                        format!("Gamma shape alpha = {}，非常低。速率异质性极高，少数位点以极高速率变化。建议检查数据质量或考虑去除高变区。", alpha)
                    } else {
                        String::new()
                    };

                    result.grade = Some(grade);
                    result.summary = summary;
                    result.recommendation = recommendation;
                } else {
                    result.grade = Some(Grade::B);
                    result.summary = "使用了速率异质性模型".to_string();
                }
            }
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无替换过程信息".to_string();
    }

    result.metrics = metrics;
    result
}

/// D2-R5：不变位点比例评估
fn d2_r5_pinv(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D2-R5".to_string(),
        dimension_id: "D2".to_string(),
        rule_name: "不变位点比例评估".to_string(),
        ..Default::default()
    };

    if let Some(sp) = &data.substitution {
        if let Some(pinv) = sp.pinv {
            metrics.insert("pinv".into(), pinv);
            let const_pct = data.alignment.as_ref().map(|a| a.frac_constant).unwrap_or(0.0);
            metrics.insert("constant_fraction".into(), const_pct);

            // pinv 不应超过恒定位点比例（不变位点是恒定位点的子集）
            let grade = if pinv > 0.95 {
                Grade::F
            } else if pinv > const_pct + 0.05 {
                // pinv 显著高于恒定位点比例，模型可能有问题
                Grade::C
            } else if (pinv - const_pct).abs() < 0.05 {
                // pinv 与恒定位点比例接近，模型估计合理
                Grade::A
            } else if pinv < const_pct {
                // pinv 低于恒定位点比例是正常的（不变位点可以包含一些歧义位点）
                Grade::A
            } else {
                Grade::B
            };

            let summary = format!("Proportion of invariable sites (pinv) = {:.4}，恒定位点比例 = {:.4}", pinv, const_pct);
            let recommendation = if grade == Grade::F {
                format!("pinv = {} 过高（> 95%），模型可能不合理。建议检查模型选择。", pinv)
            } else if grade == Grade::C {
                format!("pinv ({}) 显著高于恒定位点比例 ({})，模型估计可能不准确。建议检查模型选择。", pinv, const_pct)
            } else {
                String::new()
            };

            result.grade = Some(grade);
            result.summary = summary;
            result.recommendation = recommendation;
            result.metrics = metrics;
        } else {
            result.grade = Some(Grade::B);
            result.summary = "未使用 +I 模型".to_string();
        }
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无替换过程信息".to_string();
    }

    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d2_rules = [
        ("D2-R1", "ModelFinder自动选择"),
        ("D2-R2", "模型复杂性合理性"),
        ("D2-R3", "信息准则一致性"),
        ("D2-R4", "速率异质性评估"),
        ("D2-R5", "不变位点比例评估"),
    ];
    for (id, name) in &d2_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D2".to_string(),
            dimension_name: "模型选择".to_string(),
            description: String::new(),
        });
    }
}
