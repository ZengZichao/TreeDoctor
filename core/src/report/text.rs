use crate::models::*;

/// 生成纯文本报告
pub fn generate_text_report(report: &AnalysisReport) -> String {
    let mut out = String::new();

    // 标题
    out.push_str("╔══════════════════════════════════════════════════════════════════╗\n");
    out.push_str("║                     TreeDoctor 质量诊断报告                       ║\n");
    out.push_str("╠══════════════════════════════════════════════════════════════════╣\n");

    if let Some(v) = &report.iqtree_version {
        out.push_str(&format!("║  IQ-TREE 版本: {}                                              ║\n", v));
    }
    out.push_str(&format!("║  输入文件前缀: {}                                                ║\n", report.prefix));
    if let Some(a) = &report.analysis_type {
        out.push_str(&format!("║  分析类型: {}                                                    ║\n", short_analysis_type(a)));
    }
    if let Some(rt) = &report.runtime {
        out.push_str(&format!("║  分析时间: {}                        ║\n", rt.completion_date));
    }
    out.push_str("╠══════════════════════════════════════════════════════════════════╣\n");
    out.push_str(&format!("║                                                                  ║\n"));
    out.push_str(&format!("║  总体评级: {}  {}                                               ║\n", report.overall_grade.letter(), report.overall_grade.label()));
    out.push_str("║                                                                  ║\n");

    // 维度汇总表
    out.push_str("║  ┌──────────────────────────┬──────┬─────────────────────────┐  ║\n");
    out.push_str("║  │ 诊断维度                 │ 评级 │ 关键发现                 │  ║\n");
    out.push_str("║  ├──────────────────────────┼──────┼─────────────────────────┤  ║\n");
    for d in &report.dimensions {
        let key_finding = d.results.iter()
            .filter(|r| r.grade.unwrap_or(Grade::A) >= Grade::C)
            .map(|r| r.summary.clone())
            .next()
            .unwrap_or_default();
        out.push_str(&format!(
            "║  │ {} {:<20} │  {}   │ {:<22} │  ║\n",
            d.dimension_id, d.dimension_name, d.grade.letter(), truncate(&key_finding, 22)
        ));
    }
    out.push_str("║  └──────────────────────────┴──────┴─────────────────────────┘  ║\n");
    out.push_str("╠══════════════════════════════════════════════════════════════════╣\n");
    out.push_str("║  详细诊断结果                                                    ║\n");
    out.push_str("╠══════════════════════════════════════════════════════════════════╣\n\n");

    // 各维度详细
    for d in &report.dimensions {
        out.push_str(&format!("── {}: {} ", d.dimension_id, d.dimension_name));
        let dash_count = 50usize.saturating_sub(d.dimension_name.chars().count() + d.dimension_id.chars().count() + 4);
        out.push_str(&"─".repeat(dash_count));
        out.push_str(&format!(" 评级: {} ──\n\n", d.grade.letter()));

        for r in &d.results {
            out.push_str(&format!("  [{}] {:<30}  {}\n", r.rule_id, r.rule_name, r.grade.unwrap_or(Grade::A).letter()));
            out.push_str(&format!("  {}\n", r.summary));
            if !r.detail.is_empty() {
                out.push_str(&format!("  {}\n", r.detail));
            }
            if !r.recommendation.is_empty() {
                out.push_str(&format!("  建议: {}\n", r.recommendation));
            }
            out.push_str("\n");
        }
    }

    // 交叉验证
    out.push_str("── 交叉验证结果 ─────────────────────────────────────────────────\n\n");
    for c in &report.cross_checks {
        let icon = if c.passed { "✅" } else { "❌" };
        out.push_str(&format!("  {} [{}] {}: {}\n", icon, c.check_id, c.check_name, c.message));
    }
    out.push_str("\n╚══════════════════════════════════════════════════════════════════╝\n");

    out
}

fn short_analysis_type(s: &str) -> &str {
    if s.contains("ultrafast bootstrap") {
        "ModelFinder + 建树 + UFBoot"
    } else if s.contains("bootstrap") {
        "ModelFinder + 建树 + Bootstrap"
    } else {
        "ModelFinder + 建树"
    }
}

fn truncate(s: &str, n: usize) -> String {
    if s.chars().count() <= n {
        s.to_string()
    } else {
        let mut result: String = s.chars().take(n - 3).collect();
        result.push_str("...");
        result
    }
}
