use crate::models::*;
use std::collections::HashMap;

/// D8: 运行参数与效率（3条规则）
pub fn evaluate_d8(data: &AnalysisData) -> DimensionSummary {
    let mut results = Vec::new();

    results.push(d8_r1_threads(data));
    results.push(d8_r2_runtime(data));
    results.push(d8_r3_partition(data));

    let grade = crate::diagnostics::dimension_grade(&results);

    DimensionSummary {
        dimension_id: "D8".to_string(),
        dimension_name: "运行参数与效率".to_string(),
        grade,
        results,
    }
}

/// D8-R1：线程使用合理性
fn d8_r1_threads(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D8-R1".to_string(),
        dimension_id: "D8".to_string(),
        rule_name: "线程使用合理性".to_string(),
        ..Default::default()
    };

    if let Some(rt) = &data.runtime {
        let threads = rt.n_threads;
        let cores = rt.n_cpu_cores;
        metrics.insert("n_threads".into(), threads as f64);
        metrics.insert("n_cpu_cores".into(), cores as f64);

        let grade = if threads > 1 && threads <= cores {
            Grade::A
        } else if threads == 1 && cores > 1 {
            Grade::B
        } else if threads > cores {
            Grade::C
        } else {
            Grade::A
        };

        let summary = format!("使用 {} 线程（检测到 {} 核）", threads, cores);
        let recommendation = if grade == Grade::B {
            format!("当前使用单线程运行，但系统有 {} 个 CPU 核心。建议使用 `-T AUTO` 或 `-T {}` 选项以加速分析。", cores, cores)
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
        result.summary = "无运行参数数据".to_string();
    }

    result
}

/// D8-R2：运行时间合理性
fn d8_r2_runtime(data: &AnalysisData) -> DiagnosticResult {
    let mut metrics = HashMap::new();
    let mut result = DiagnosticResult {
        rule_id: "D8-R2".to_string(),
        dimension_id: "D8".to_string(),
        rule_name: "运行时间合理性".to_string(),
        ..Default::default()
    };

    if let Some(rt) = &data.runtime {
        metrics.insert("cpu_time".into(), rt.cpu_time);
        metrics.insert("wall_clock_time".into(), rt.wall_clock_time);

        let summary = format!("CPU 时间: {:.2} 秒，Wall-clock 时间: {:.2} 秒", rt.cpu_time, rt.wall_clock_time);
        result.grade = Some(Grade::A);
        result.summary = summary;
        result.metrics = metrics;
    } else {
        result.grade = None;
        result.evaluated = false;
        result.summary = "无运行时间数据".to_string();
    }

    result
}

/// D8-R3：分区分析配置
fn d8_r3_partition(_data: &AnalysisData) -> DiagnosticResult {
    let mut result = DiagnosticResult {
        rule_id: "D8-R3".to_string(),
        dimension_id: "D8".to_string(),
        rule_name: "分区分析配置".to_string(),
        ..Default::default()
    };

    // 非分区分析时跳过
    result.grade = None;
    result.evaluated = false;
    result.summary = "非分区分析".to_string();
    result
}

pub fn list_rules(rules: &mut Vec<RuleInfo>) {
    let d8_rules = [
        ("D8-R1", "线程使用合理性"),
        ("D8-R2", "运行时间合理性"),
        ("D8-R3", "分区分析配置"),
    ];
    for (id, name) in &d8_rules {
        rules.push(RuleInfo {
            rule_id: id.to_string(),
            rule_name: name.to_string(),
            dimension_id: "D8".to_string(),
            dimension_name: "运行参数与效率".to_string(),
            description: String::new(),
        });
    }
}
