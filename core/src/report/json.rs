use crate::models::*;
use serde_json::{json, Value};

/// 生成 JSON 报告
pub fn generate_json_report(report: &AnalysisReport) -> Value {
    let mut diagnostics = Vec::new();
    for d in &report.dimensions {
        for r in &d.results {
            let mut metrics = json!({});
            for (k, v) in &r.metrics {
                metrics[k] = json!(v);
            }
            diagnostics.push(json!({
                "rule_id": r.rule_id,
                "dimension_id": r.dimension_id,
                "dimension_name": d.dimension_name,
                "rule_name": r.rule_name,
                "grade": r.grade.unwrap_or(Grade::A).letter(),
                "summary": r.summary,
                "detail": r.detail,
                "recommendation": r.recommendation,
                "metrics": metrics,
            }));
        }
    }

    let mut dimensions = Vec::new();
    for d in &report.dimensions {
        dimensions.push(json!({
            "dimension_id": d.dimension_id,
            "dimension_name": d.dimension_name,
            "grade": d.grade.letter(),
        }));
    }

    let mut cross_checks = Vec::new();
    for c in &report.cross_checks {
        cross_checks.push(json!({
            "check_id": c.check_id,
            "check_name": c.check_name,
            "passed": c.passed,
            "message": c.message,
        }));
    }

    let mut input = json!({
        "prefix": report.prefix,
    });
    if !report.files_found.is_empty() {
        input["files_found"] = json!(report.files_found);
    }
    if !report.files_missing.is_empty() {
        input["files_missing"] = json!(report.files_missing);
    }

    let mut analysis_info = json!({});
    if let Some(v) = &report.iqtree_version {
        analysis_info["iqtree_version"] = json!(v);
    }
    if let Some(a) = &report.analysis_type {
        analysis_info["analysis_type"] = json!(a);
    }
    if let Some(rt) = &report.runtime {
        analysis_info["completion_time"] = json!(rt.completion_date);
    }

    let mut root = json!({
        "tool": "TreeDoctor",
        "version": "1.0.0",
        "timestamp": report.timestamp,
        "input": input,
    });
    if !analysis_info.as_object().unwrap().is_empty() {
        root["analysis_info"] = analysis_info;
    }
    root["overall_grade"] = json!(report.overall_grade.letter());

    if let Some(aln) = &report.alignment {
        root["alignment"] = json!({
            "n_sequences": aln.n_sequences,
            "n_sites": aln.n_sites,
            "seq_type": aln.seq_type.as_ref().map(|t| t.as_str()).unwrap_or("Unknown"),
            "n_constant_sites": aln.n_constant_sites,
            "frac_constant": aln.frac_constant,
            "n_informative_sites": aln.n_informative_sites,
            "frac_informative": aln.frac_informative(),
            "n_patterns": aln.n_patterns,
        });
    }

    if let Some(ct) = &report.composition_test {
        root["composition_test"] = json!({
            "n_total": ct.n_total(),
            "n_failed": ct.n_failed,
            "failed_percentage": ct.failed_percentage(),
            "failed_sequences": ct.failed_seq_names(),
            "total_gap_percentage": ct.total_gap_percentage,
            "significance_level": ct.significance_level,
            "degrees_of_freedom": ct.degrees_of_freedom,
        });
    }

    if let Some(mf) = &report.model_finder {
        root["model"] = json!({
            "best_model": mf.best_model,
            "criterion": mf.criterion.as_str(),
            "best_aic": mf.best_aic,
            "best_aicc": mf.best_aicc,
            "best_bic": mf.best_bic,
        });
    }

    if let Some(lh) = &report.likelihood {
        root["likelihood"] = json!({
            "log_likelihood": lh.log_likelihood,
            "se": lh.se,
            "unconstrained_logl": lh.unconstrained_logl,
            "aic": lh.aic,
            "aicc": lh.aicc,
            "bic": lh.bic,
            "n_free_parameters": lh.n_free_parameters,
        });
    }

    if let Some(tree) = &report.ml_tree {
        root["tree"] = json!({
            "n_taxa": tree.n_taxa,
            "total_tree_length": tree.total_tree_length,
            "internal_branch_length": tree.internal_branch_length,
            "internal_branch_percentage": tree.internal_branch_percentage,
            "has_negative_branches": tree.has_negative_branches,
            "near_zero_branches": tree.near_zero_branches.len(),
            "long_branches": tree.long_branches.len(),
            "support_type": tree.support_type.as_str(),
        });
    }

    if let Some(bs) = &report.bootstrap {
        root["bootstrap"] = json!({
            "type": bs.bootstrap_type.as_str(),
            "n_replicates": bs.n_replicates,
            "correlation_coefficient": bs.correlation_coefficient,
            "n_iterations": bs.n_iterations,
            "consensus_logl": bs.consensus_logl,
            "rf_distance": bs.rf_distance,
        });
    }

    root["diagnostics"] = json!(diagnostics);
    root["dimensions"] = json!(dimensions);
    root["cross_checks"] = json!(cross_checks);

    root
}
