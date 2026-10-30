#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use treedoctor_core::{analyze_directory, generate_report, list_diagnostic_rules, ReportFormat};
use treedoctor_core::models::report::AnalysisReport;

/// Tauri 命令：分析 IQ-TREE 输出目录
#[tauri::command]
fn analyze(input_dir: String, prefix: Option<String>) -> Result<AnalysisReport, String> {
    let path = PathBuf::from(&input_dir);
    analyze_directory(&path, prefix.as_deref()).map_err(|e| e.to_string())
}

/// Tauri 命令：生成报告文本
#[tauri::command]
fn get_report_text(report: AnalysisReport, format: String) -> Result<String, String> {
    let fmt = match format.as_str() {
        "json" => ReportFormat::Json,
        "markdown" | "md" => ReportFormat::Markdown,
        _ => ReportFormat::Text,
    };
    generate_report(&report, fmt).map_err(|e| e.to_string())
}

/// Tauri 命令：获取所有诊断规则列表
#[tauri::command]
fn get_rules() -> Vec<treedoctor_core::models::diagnostics::RuleInfo> {
    list_diagnostic_rules()
}

/// Tauri 命令：获取仪表盘数据
#[tauri::command]
fn get_dashboard_data(report: AnalysisReport) -> treedoctor_core::models::report::DashboardData {
    let key_findings: Vec<String> = report
        .dimensions
        .iter()
        .filter(|d| d.grade as u8 <= 2) // C or below
        .flat_map(|d| {
            d.results
                .iter()
                .filter(|r| {
                    r.grade.map(|g| g as u8).unwrap_or(0) <= 2
                })
                .map(|r| format!("[{}] {}", r.rule_id, r.summary))
        })
        .collect();

    treedoctor_core::models::report::DashboardData {
        overall_grade: report.overall_grade,
        dimensions: report.dimensions.clone(),
        cross_checks: report.cross_checks.clone(),
        key_findings,
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            analyze,
            get_report_text,
            get_rules,
            get_dashboard_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running TreeDoctor application");
}
