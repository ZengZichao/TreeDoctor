import { useState, useCallback, useEffect, useRef } from "react";
import {
  FolderOpen, Loader2, AlertCircle, FileCheck, FlaskConical, Upload,
  FolderCog, ChevronRight, CheckCircle2, Circle, XCircle, History, Copy, X,
} from "lucide-react";
import { useStore, useTranslation } from "../stores/useStore";
import { BrandLogo } from "../components/BrandLogo";
import { useNavigate } from "react-router-dom";
import { analyzeDirectory, openDirectoryDialog } from "../lib/tauri";
import { readDir } from "@tauri-apps/plugin-fs";
import { EXAMPLE_REPORT } from "../lib/exampleData";
import { addRecent, loadRecents, removeRecent, type RecentEntry } from "../lib/recent";
import { toast } from "../components/Toast";
import { cn } from "../lib/utils";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { GRADE_BG_COLORS, GRADE_TEXT_COLORS, GRADE_BORDER_COLORS } from "../types";
import type { Grade } from "../types";

/** 分析阶段定义 */
type StageKey = "read" | "parse" | "cross" | "grade";
const STAGE_ORDER: StageKey[] = ["read", "parse", "cross", "grade"];

export function HomePage() {
  const {
    setReport, setAnalysisStatus, setError, analysisStatus, error, setIsExampleData,
    stages, setStage, setAllStages, setAnalysisStartedAt, analysisCancelled, setAnalysisCancelled,
    announce, openDirTick,
  } = useStore();
  const t = useTranslation();
  const navigate = useNavigate();
  const [selectedDir, setSelectedDir] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [validation, setValidation] = useState<{ state: "idle" | "checking" | "ok" | "empty" | "missing"; count?: number }>({ state: "idle" });
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadRecents());
  const cancelledRef = useRef(false);

  // Ctrl/Cmd + O → 打开目录选择对话框
  useEffect(() => {
    if (openDirTick > 0) {
      handleBrowse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDirTick]);

  // Tauri 2 native drag-and-drop via onDragDropEvent（浏览器开发环境跳过）
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      return; // 非 Tauri 环境 — 使用下方 DOM fallback
    }
    let unlisten: (() => void) | undefined;
    let mounted = true;
    let cancelled = false;
    try {
      getCurrentWebview().onDragDropEvent((event) => {
        if (!mounted) return;
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsDragging(true);
        } else if (event.payload.type === "leave") {
          setIsDragging(false);
        } else if (event.payload.type === "drop") {
          setIsDragging(false);
          const paths = event.payload.paths;
          if (paths && paths.length > 0) {
            const path = paths[0];
            setSelectedDir(path);
            // Auto-analyze on drop
            handleAnalyze(path);
          }
        }
      }).then((fn) => {
        if (cancelled) {
          fn();
          return;
        }
        unlisten = fn;
      }).catch(() => {
        // Tauri 事件监听不可用 — DOM handlers below serve as fallback
      });
    } catch {
      return; // 同步抛错（老版本 Tauri API 缺失）— 静默降级
    }
    return () => {
      mounted = false;
      cancelled = true;
      if (unlisten) unlisten();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 目录即时校验：列出检测到的文件数
  useEffect(() => {
    if (!selectedDir.trim()) {
      setValidation({ state: "idle" });
      return;
    }
    // 非浏览器环境无原生 fs API — 静默跳过校验
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      setValidation({ state: "idle" });
      return;
    }
    let cancelled = false;
    setValidation({ state: "checking" });
    const timer = setTimeout(async () => {
      try {
        const entries = await readDir(selectedDir.trim());
        if (!cancelled) {
          setValidation({ state: entries.length > 0 ? "ok" : "empty", count: entries.length });
        }
      } catch {
        if (!cancelled) setValidation({ state: "missing" });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedDir]);

  const handleBrowse = async () => {
    try {
      const dir = await openDirectoryDialog(t.home.selectDirLabel);
      if (dir) {
        setSelectedDir(dir);
      }
    } catch (err) {
      console.warn("Directory dialog not available:", err);
    }
  };

  const handleAnalyze = async (dir?: string) => {
    const targetDir = dir ?? selectedDir;
    if (!targetDir || analysisStatus === "analyzing") return;

    cancelledRef.current = false;
    setAnalysisCancelled(false);
    setAnalysisStatus("analyzing");
    setError(null);
    setIsExampleData(false);
    setAllStages("pending");
    setStage("read", "active");
    setAnalysisStartedAt(Date.now());
    // 读取文件阶段在前端已具备确定性（校验给出文件数）
    setTimeout(() => {
      setStage("read", "done");
      setStage("parse", "active");
    }, 250);

    try {
      const report = await analyzeDirectory(targetDir);
      if (cancelledRef.current) return; // 用户已取消 — 忽略在途结果
      // Preserve source directory in report
      report.source_dir = targetDir;
      setAllStages("done");
      setReport(report);
      setAnalysisStatus("complete");
      addRecent(report);
      setRecents(loadRecents());
      const pending = report.dimensions.flatMap((d) => d.results).filter((r) => r.grade === "C" || r.grade === "D" || r.grade === "F").length;
      announce(`${report.prefix}：${t.sidebar.overallGrade} ${report.overall_grade}，${t.overview.findCount.replace("{n}", String(pending))}`);
      navigate("/overview");
    } catch (err) {
      if (cancelledRef.current) return;
      setAllStages("pending");
      setError(String(err));
      setAnalysisStatus("error");
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    setAnalysisCancelled(true);
    setAnalysisStatus("idle");
    setAllStages("pending");
    setAnalysisStartedAt(null);
  };

  const handleLoadExample = () => {
    setError(null);
    setIsExampleData(true);
    setReport(EXAMPLE_REPORT);
    setAnalysisStatus("complete");
    navigate("/overview");
  };

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(error ?? "");
      toast.success(t.rawData.copied);
    } catch {
      // ignore
    }
  };

  const handleReopen = (path: string) => {
    setSelectedDir(path);
    handleAnalyze(path);
  };

  // Fallback DOM drag-and-drop handlers (for browser dev mode)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const path = (file as any).path || (file as any).webkitRelativePath || file.name;
      if (path) {
        setSelectedDir(path);
        handleAnalyze(path);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDir]);

  const isAnalyzing = analysisStatus === "analyzing";

  return (
    <div
      className="flex h-full items-center justify-center overflow-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background decoration — subtle gradient mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "radial-gradient(circle, var(--td-brand) 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-xl px-6 py-8">
        {/* Logo */}
        <div className="mb-8 text-center td-fade-in-down">
          <div className="mb-4 flex justify-center">
            <BrandLogo size="lg" />
          </div>
 <h1 className="text-td-h1 font-semibold tracking-tight td-display text-td-text" >
            {t.appName}
          </h1>
 <p className="mt-1.5 text-td-sm text-td-text-secondary" >
            {t.appTagline}
          </p>
        </div>

        {/* Drop zone / File selection card */}
        <div
          className={cn(
            "td-card relative overflow-hidden p-6 td-fade-in-up td-stagger-1",
            isDragging && "ring-2"
          )}
          style={isDragging ? ({
            boxShadow: "0 0 0 2px var(--td-primary-text), var(--td-shadow-lg)",
          }) : undefined}
        >
          {isDragging && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm rounded-td-lg"
              style={{ backgroundColor: "color-mix(in srgb, var(--td-brand) 6%, transparent)" }}
            >
              <div className="flex flex-col items-center gap-2">
 <Upload className="h-8 w-8 text-td-primary-text" aria-hidden="true" />
 <span className="text-td-sm font-medium text-td-primary-text" >
                  {t.home.dragHint}
                </span>
              </div>
            </div>
          )}

          {/* Directory input — editable, not readOnly */}
          <div className="mb-4">
 <label className="mb-2 block text-td-sm font-medium text-td-text" htmlFor="dir-input">
              {t.home.selectDirLabel}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
 <FolderCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-td-text-tertiary" aria-hidden="true" />
                <input
                  id="dir-input"
                  type="text"
                  value={selectedDir}
                  onChange={(e) => setSelectedDir(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAnalyze(); }}
                  placeholder={t.home.inputPlaceholder}
                  aria-invalid={validation.state === "missing"}
                  aria-describedby="dir-validation"
                  className="w-full rounded-td border py-2 pl-9 pr-3 text-td-sm focus:outline-none focus:ring-2 td-transition td-focus-ring font-mono"
                  style={{
                    borderColor: validation.state === "missing" ? "color-mix(in srgb, var(--td-error) 50%, transparent)" : "var(--td-border)",
                    backgroundColor: "var(--td-canvas)",
                    color: "var(--td-text)",
                  }}
                />
              </div>
              <button
                onClick={handleBrowse}
                className="flex items-center gap-1.5 rounded-td border px-3.5 py-2 text-td-sm font-medium td-transition-fast td-focus-ring hover:border-td-text-tertiary hover:text-td-text"
                style={{
                  borderColor: "var(--td-border)",
                  backgroundColor: "var(--td-canvas)",
                  color: "var(--td-text-secondary)",
                }}
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                {t.home.browse}
              </button>
            </div>
            {/* Validation feedback */}
            <div id="dir-validation" className="mt-1.5 flex min-h-[18px] items-center gap-1 text-td-xs" aria-live="polite">
              {validation.state === "checking" && (
                <span className="text-td-text-quaternary">{t.home.validating}</span>
              )}
              {validation.state === "ok" && (
 <span className="flex items-center gap-1 text-td-success" >
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  {t.home.filesDetected.replace("{n}", String(validation.count ?? 0))}
                </span>
              )}
              {validation.state === "empty" && (
 <span className="flex items-center gap-1 text-td-warning" >
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {t.home.noFilesDetected}
                </span>
              )}
              {validation.state === "missing" && (
 <span className="flex items-center gap-1 text-td-error" >
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                  {t.home.dirNotFound}
                </span>
              )}
            </div>
          </div>

          {/* Analyze button + Cancel */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAnalyze()}
              disabled={!selectedDir || isAnalyzing}
              className="flex flex-1 items-center justify-center gap-2 rounded-td px-4 py-2.5 text-td-sm font-medium text-white td-transition td-pressable td-focus-ring disabled:cursor-not-allowed disabled:opacity-40 hover:bg-td-primary-hover"
              style={{
                backgroundColor: "var(--td-primary)",
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t.home.analyzing}
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" aria-hidden="true" />
                  {t.home.startAnalysis}
                </>
              )}
            </button>
            {isAnalyzing && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-td border px-4 py-2.5 text-td-sm font-medium td-transition td-focus-ring hover:bg-td-fill"
                style={{
                  borderColor: "var(--td-border)",
                  color: "var(--td-text-secondary)",
                }}
                aria-label={t.home.cancel}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                {t.home.cancel}
              </button>
            )}
          </div>

          {/* Stage list */}
          {isAnalyzing && (
            <div
              className="mt-4 rounded-td border p-3 td-fade-in"
              style={{ borderColor: "var(--td-border)", backgroundColor: "var(--td-canvas-soft)" }}
              role="status"
              aria-label={t.home.analyzing}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {STAGE_ORDER.map((key, i) => {
                  const st = stages[key];
                  const labels: Record<StageKey, string> = {
                    read: t.home.stageRead,
                    parse: t.home.stageParse,
                    cross: t.home.stageCross,
                    grade: t.home.stageGrade,
                  };
                  const isDone = st === "done";
                  const isActive = st === "active";
                  return (
                    <div key={key} className="flex items-center gap-1.5 text-td-xs">
                      {isDone ? (
 <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-td-success" aria-label="done" />
                      ) : isActive ? (
 <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-td-info" aria-label="in progress" />
                      ) : (
 <Circle className="h-3.5 w-3.5 flex-shrink-0 text-td-border-strong" aria-label="pending" />
                      )}
                      <span style={{ color: isDone ? "var(--td-text-secondary)" : isActive ? "var(--td-text)" : "var(--td-text-quaternary)" }}>
                        {i + 1}. {labels[key]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && analysisStatus === "error" && (
            <div
              className="mt-4 rounded-td border p-3 td-fade-in"
              role="alert"
              style={{
                borderColor: "color-mix(in srgb, var(--td-error) 45%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--td-error) 5%, transparent)",
              }}
            >
              <div className="flex items-start gap-2">
 <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-td-error" aria-hidden="true" />
 <p className="flex-1 text-td-sm leading-relaxed text-td-text-secondary" >
                  {error}
                </p>
              </div>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={handleCopyError}
                  className="flex items-center gap-1.5 rounded-td border px-2.5 py-1 text-td-xs font-medium td-transition-fast td-focus-ring hover:bg-td-fill"
                  style={{ borderColor: "var(--td-border)", color: "var(--td-text-secondary)" }}
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {t.home.copyError}
                </button>
                <button
                  onClick={() => handleAnalyze()}
                  className="flex items-center gap-1.5 rounded-td border px-2.5 py-1 text-td-xs font-medium td-transition-fast td-focus-ring hover:bg-td-fill"
                  style={{ borderColor: "var(--td-border)", color: "var(--td-text-secondary)" }}
                >
                  {t.home.retry}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Example data section — with example identifier */}
        <div className="mt-3 td-fade-in-up td-stagger-2">
          <button
            onClick={handleLoadExample}
            className="group flex w-full items-center justify-center gap-2 rounded-td border border-dashed px-4 py-3 text-td-sm font-medium td-transition td-focus-ring hover:bg-td-fill hover:text-td-text"
            style={{
              borderColor: "var(--td-border-strong)",
              color: "var(--td-text-secondary)",
            }}
            aria-label={t.home.loadExample}
          >
            <FlaskConical className="h-4 w-4 group-hover:scale-110 td-transition-fast" aria-hidden="true" />
            {t.home.loadExample}
          </button>
 <p className="mt-2 text-center text-td-xs text-td-text-quaternary" >
            {t.home.exampleHint}
          </p>
        </div>

        {/* Recent analyses */}
        {recents.length > 0 && (
          <div className="mt-5 td-fade-in-up td-stagger-3">
 <div className="mb-2 flex items-center gap-1.5 text-td-xs font-medium uppercase tracking-wider text-td-text-quaternary" >
              <History className="h-3 w-3" aria-hidden="true" />
              {t.home.recentTitle}
            </div>
            <div className="space-y-1.5">
              {recents.slice(0, 5).map((r) => (
                <div
                  key={r.path}
                  className="group flex items-center gap-2.5 rounded-td border px-3 py-2 td-card-hover td-focus-ring"
                  style={{ borderColor: "var(--td-border)", backgroundColor: "var(--td-bg-container)" }}
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-td-sm border text-td-xs font-bold"
                    style={{
                      backgroundColor: GRADE_BG_COLORS[r.overall_grade],
                      color: GRADE_TEXT_COLORS[r.overall_grade],
                      borderColor: GRADE_BORDER_COLORS[r.overall_grade],
                    }}
                    aria-label={`${t.sidebar.overallGrade} ${r.overall_grade}`}
                  >
                    {r.overall_grade === "N" ? "—" : r.overall_grade}
                  </span>
                  <button
                    onClick={() => handleReopen(r.path)}
                    className="flex min-w-0 flex-1 flex-col items-start text-left td-focus-ring rounded-td-sm"
                  >
 <span className="w-full truncate font-mono text-td-xs text-td-text" >{r.prefix}</span>
 <span className="w-full truncate text-td-xs text-td-text-quaternary" title={r.path}>
                      {r.path}
                    </span>
                  </button>
 <span className="flex-shrink-0 text-td-xs td-num text-td-text-quaternary" >
                    {new Date(r.saved_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => { removeRecent(r.path); setRecents(loadRecents()); }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-td-sm td-transition-fast td-focus-ring hover:bg-td-fill"
                    aria-label={`${t.home.remove} ${r.prefix}`}
                    title={t.home.remove}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag hint */}
 <div className="mt-6 flex items-center justify-center gap-1.5 text-td-xs text-td-text-quaternary" >
          <Upload className="h-3 w-3" aria-hidden="true" />
          <span>{t.home.dragHint}</span>
        </div>

        {/* Overview quick access */}
        {analysisStatus === "complete" && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/overview")}
              className="inline-flex items-center gap-1 text-td-sm font-medium td-transition td-focus-ring rounded-td-sm"
            >
              {t.nav.overview}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
