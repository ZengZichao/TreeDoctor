import type { AnalysisReport, Grade } from "../types";

/**
 * 最近分析历史：
 * 纯前端 localStorage 实现，仅存储报告摘要（不含大体积 splits/models 数组），
 * 支持「最近分析列表一键重开」与「与当前报告对比」。
 */

const RECENTS_KEY = "treedoctor-recents";
const MAX_RECENTS = 12;

export interface RecentEntry {
  /** 分析源目录路径（重开用） */
  path: string;
  prefix: string;
  timestamp: string;
  overall_grade: Grade;
  /** D1–D8 维度评级 */
  dims: Record<string, Grade>;
  files_found: number;
  files_total: number;
  cross_passed: number;
  cross_total: number;
  /** 记录保存时间（本地 ms） */
  saved_at: number;
}

export function loadRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

export function addRecent(report: AnalysisReport): void {
  if (report.source_dir == null) return;
  try {
    const entry: RecentEntry = {
      path: report.source_dir,
      prefix: report.prefix,
      timestamp: report.timestamp,
      overall_grade: report.overall_grade,
      dims: Object.fromEntries(report.dimensions.map((d) => [d.dimension_id, d.grade])),
      files_found: report.files_found.length,
      files_total: report.files_found.length + report.files_missing.length,
      cross_passed: report.cross_checks.filter((c) => c.passed).length,
      cross_total: report.cross_checks.length,
      saved_at: Date.now(),
    };
    const rest = loadRecents().filter((r) => r.path !== entry.path);
    localStorage.setItem(RECENTS_KEY, JSON.stringify([entry, ...rest].slice(0, MAX_RECENTS)));
  } catch {
    // 存储失败（隐私模式/超额）— 静默降级为无历史
  }
}

export function removeRecent(path: string): void {
  try {
    const rest = loadRecents().filter((r) => r.path !== path);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(rest));
  } catch {
    // ignore
  }
}

export function clearRecents(): void {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch {
    // ignore
  }
}
