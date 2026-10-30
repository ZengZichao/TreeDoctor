pub mod alignment_diag;
pub mod model_diag;
pub mod likelihood_diag;
pub mod topology_diag;
pub mod support_diag;
pub mod bootstrap_diag;
pub mod consensus_diag;
pub mod runtime_diag;

use crate::models::*;

/// 运行全部 36 条诊断规则，返回按维度分组的诊断结果
pub fn run_diagnostics(data: &AnalysisData) -> Vec<DimensionSummary> {
    let mut dims = Vec::new();

    dims.push(alignment_diag::evaluate_d1(data));
    dims.push(model_diag::evaluate_d2(data));
    dims.push(likelihood_diag::evaluate_d3(data));
    dims.push(topology_diag::evaluate_d4(data));
    dims.push(support_diag::evaluate_d5(data));
    dims.push(bootstrap_diag::evaluate_d6(data));
    dims.push(consensus_diag::evaluate_d7(data));
    dims.push(runtime_diag::evaluate_d8(data));

    dims
}

/// 计算维度评级：忽略 N（未评估）的规则，取剩余规则中最差的评级
/// 如果全部规则都是 N，则维度评级为 N
pub fn dimension_grade(results: &[DiagnosticResult]) -> Grade {
    let evaluated: Vec<Grade> = results
        .iter()
        .filter(|r| r.evaluated)
        .filter_map(|r| r.grade)
        .collect();
    if evaluated.is_empty() {
        Grade::N
    } else {
        *evaluated.iter().max().unwrap_or(&Grade::A)
    }
}

/// 计算总体评级：忽略 N（未评估）的维度，取剩余维度中最差的评级
/// 如果全部维度都是 N，则总体评级为 N
pub fn overall_grade(dims: &[DimensionSummary]) -> Grade {
    let evaluated: Vec<Grade> = dims
        .iter()
        .filter(|d| d.grade != Grade::N)
        .map(|d| d.grade)
        .collect();
    if evaluated.is_empty() {
        Grade::N
    } else {
        *evaluated.iter().max().unwrap_or(&Grade::A)
    }
}

/// 提取关键发现（评级 ≥ C 的维度中评级最差的规则摘要）
pub fn key_findings(dims: &[DimensionSummary]) -> Vec<String> {
    let mut findings = Vec::new();
    for d in dims {
        if d.grade >= Grade::C && d.grade != Grade::N {
            // 找到该维度中评级最差的规则（Grade::F 最差，Grade::A 最好）
            if let Some(worst) = d.results.iter().filter(|r| r.evaluated).max_by_key(|r| r.grade.unwrap_or(Grade::A)) {
                if worst.grade.unwrap_or(Grade::A) >= Grade::C {
                    findings.push(format!(
                        "{}: {}",
                        d.dimension_id,
                        worst.summary
                    ));
                }
            }
        }
    }
    findings
}

/// 列出所有诊断规则
pub fn list_rules() -> Vec<RuleInfo> {
    let mut rules = Vec::new();
    alignment_diag::list_rules(&mut rules);
    model_diag::list_rules(&mut rules);
    likelihood_diag::list_rules(&mut rules);
    topology_diag::list_rules(&mut rules);
    support_diag::list_rules(&mut rules);
    bootstrap_diag::list_rules(&mut rules);
    consensus_diag::list_rules(&mut rules);
    runtime_diag::list_rules(&mut rules);
    rules
}
