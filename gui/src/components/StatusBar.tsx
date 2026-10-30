import { useEffect, useState } from "react";
import { useStore, useTranslation } from "../stores/useStore";
import { FolderOpen, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { GRADE_BG_COLORS, GRADE_TEXT_COLORS, GRADE_BORDER_COLORS } from "../types";
import type { Grade } from "../types";

/**
 * 底部状态栏：
 * 左：数据源路径 · 中：分析状态（含计时） · 右：文件计数 + 总评级
 */
export function StatusBar() {
  const report = useStore((s) => s.report);
  const analysisStatus = useStore((s) => s.analysisStatus);
  const startedAt = useStore((s) => s.analysisStartedAt);
  const t = useTranslation();

  // 分析计时
  const [elapsed, setElapsed] = useState<number | null>(null);
  useEffect(() => {
    if (analysisStatus !== "analyzing" || startedAt == null) {
      setElapsed(null);
      return;
    }
    const tick = () => setElapsed((Date.now() - startedAt) / 1000);
    tick();
    const timer = setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [analysisStatus, startedAt]);

  // 首页且无报告时不显示状态栏（避免空壳）
  if (!report && analysisStatus !== "analyzing" && analysisStatus !== "error") {
    return null;
  }

  const grade: Grade | null = report?.overall_grade ?? null;

  return (
    <footer
      className="flex h-7 flex-shrink-0 items-center justify-between gap-4 border-t px-3 text-td-xs"
      style={{
        borderColor: "var(--td-border)",
        backgroundColor: "var(--td-bg-container)",
        color: "var(--td-text-tertiary)",
      }}
      role="status"
      aria-label="status bar"
    >
      {/* Left: source path */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {report?.source_dir || report ? (
          <>
            <FolderOpen className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
 <span className="td-text-ellipsis font-mono text-td-text-quaternary" title={report?.source_dir || report?.prefix}>
              {report?.source_dir || report?.prefix}
            </span>
          </>
        ) : (
 <span className="td-text-ellipsis text-td-text-quaternary" >TreeDoctor</span>
        )}
      </div>

      {/* Center: analysis status */}
      <div className="flex flex-shrink-0 items-center gap-1.5" aria-live="polite">
        {analysisStatus === "analyzing" && (
          <>
 <Loader2 className="h-3 w-3 animate-spin text-td-info" aria-hidden="true" />
            <span>
              {t.home.analyzing}
              {elapsed != null && <span className="td-num ml-1">{elapsed.toFixed(1)}s</span>}
            </span>
          </>
        )}
        {analysisStatus === "error" && (
          <>
 <AlertCircle className="h-3 w-3 text-td-error" aria-hidden="true" />
            <span className="text-td-error">Error</span>
          </>
        )}
        {analysisStatus === "complete" && report && (
          <>
 <CheckCircle2 className="h-3 w-3 text-td-success" aria-hidden="true" />
            <span>
              {t.overview.evaluatedRules} {report.dimensions.flatMap((d) => d.results).filter((r) => r.grade !== null && r.grade !== "N").length}
            </span>
          </>
        )}
      </div>

      {/* Right: files + overall grade */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        {report && (
 <span className="td-num font-mono text-td-text-quaternary" >
            {report.files_found.length}/{report.files_found.length + report.files_missing.length}
          </span>
        )}
        {grade && (
          <span className="flex items-center gap-1.5">
            <span
              className="flex items-center justify-center rounded-td-sm border text-td-xs font-bold leading-none"
              style={{
                height: 18,
                width: 18,
                backgroundColor: GRADE_BG_COLORS[grade],
                color: GRADE_TEXT_COLORS[grade],
                borderColor: GRADE_BORDER_COLORS[grade],
              }}
              aria-label={`${t.sidebar.overallGrade}: ${grade}`}
            >
              {grade === "N" ? "—" : grade}
            </span>
            <span className="text-td-text-tertiary">{t.grades[grade]}</span>
          </span>
        )}
      </div>
    </footer>
  );
}
