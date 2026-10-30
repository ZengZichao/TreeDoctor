import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { AnalysisReport, DashboardData, RuleInfo } from "../types";

/// 调用后端 analyze 命令
export async function analyzeDirectory(
  inputDir: string,
  prefix?: string
): Promise<AnalysisReport> {
  return await invoke<AnalysisReport>("analyze", {
    inputDir,
    prefix: prefix ?? null,
  });
}

/// 调用后端 get_report_text 命令
export async function getReportText(
  report: AnalysisReport,
  format: string
): Promise<string> {
  return await invoke<string>("get_report_text", { report, format });
}

/// 调用后端 get_rules 命令
export async function getRules(): Promise<RuleInfo[]> {
  return await invoke<RuleInfo[]>("get_rules");
}

/// 调用后端 get_dashboard_data 命令
export async function getDashboardData(
  report: AnalysisReport
): Promise<DashboardData> {
  return await invoke<DashboardData>("get_dashboard_data", { report });
}

/// 打开目录选择对话框
export async function openDirectoryDialog(title: string): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title,
  });
  return typeof selected === "string" ? selected : null;
}

/// 导出报告 — 使用 Tauri 原生保存对话框
export async function exportReport(
  report: AnalysisReport,
  format: string,
  saveDialogTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await getReportText(report, format);
    const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
    const defaultName = `${report.prefix}_treedoctor_report.${ext}`;

    const filePath = await save({
      title: saveDialogTitle,
      defaultPath: defaultName,
      filters: [{
        name: format === "json" ? "JSON" : format === "markdown" ? "Markdown" : "Text",
        extensions: [ext],
      }],
    });

    if (!filePath) {
      return { success: false, error: "cancelled" };
    }

    await writeTextFile(filePath, text);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
