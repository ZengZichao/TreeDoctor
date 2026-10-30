use crate::models::*;

/// 生成 Markdown 报告
pub fn generate_markdown_report(report: &AnalysisReport) -> String {
    let mut out = String::new();

    out.push_str("# TreeDoctor 质量诊断报告\n\n");
    out.push_str(&format!("**文件前缀**: {}\n\n", report.prefix));
    if let Some(v) = &report.iqtree_version {
        out.push_str(&format!("**IQ-TREE 版本**: {}\n\n", v));
    }
    if let Some(a) = &report.analysis_type {
        out.push_str(&format!("**分析类型**: {}\n\n", a));
    }
    if let Some(rt) = &report.runtime {
        out.push_str(&format!("**分析时间**: {}\n\n", rt.completion_date));
    }
    out.push_str(&format!("## 总体评级: {} ({})\n\n", report.overall_grade.letter(), report.overall_grade.label()));

    // 维度汇总表
    out.push_str("| 维度 | 评级 | 关键发现 |\n");
    out.push_str("|------|------|----------|\n");
    for d in &report.dimensions {
        let key_finding = d.results.iter()
            .filter(|r| r.grade.unwrap_or(Grade::A) >= Grade::C)
            .map(|r| r.summary.clone())
            .next()
            .unwrap_or_default();
        out.push_str(&format!("| {} {} | {} | {} |\n", d.dimension_id, d.dimension_name, d.grade.letter(), key_finding));
    }
    out.push_str("\n");

    // 详细诊断
    out.push_str("## 详细诊断结果\n\n");
    for d in &report.dimensions {
        out.push_str(&format!("### {}: {} — 评级: {}\n\n", d.dimension_id, d.dimension_name, d.grade.letter()));

        for r in &d.results {
            out.push_str(&format!("#### {}: {} — 评级: {}\n\n", r.rule_id, r.rule_name, r.grade.unwrap_or(Grade::A).letter()));
            out.push_str(&format!("{}\n\n", r.summary));
            if !r.detail.is_empty() {
                out.push_str(&format!("{}\n\n", r.detail));
            }
            if !r.recommendation.is_empty() {
                out.push_str(&format!("**建议**: {}\n\n", r.recommendation));
            }
        }
    }

    // 交叉验证
    out.push_str("## 交叉验证结果\n\n");
    out.push_str("| 检查项 | 结果 | 说明 |\n");
    out.push_str("|--------|------|------|\n");
    for c in &report.cross_checks {
        let status = if c.passed { "✅ 通过" } else { "❌ 失败" };
        out.push_str(&format!("| {} {} | {} | {} |\n", c.check_id, c.check_name, status, c.message));
    }

    out
}
