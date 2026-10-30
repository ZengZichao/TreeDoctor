import { Menu, Download, Sun, Moon, Languages, ChevronDown, FileText, FileCode, Braces, Globe, Printer, Clock, FolderOpen, AlertCircle, ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { useStore, useTranslation } from "../stores/useStore";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { exportReport } from "../lib/tauri";
import { buildReportHtml, printReportHtml } from "../lib/reportHtml";
import { saveTextFile } from "../lib/download";
import { toast } from "./Toast";
import { cn } from "../lib/utils";

interface TopBarProps {
  title: string;
  onToggleSidebar: () => void;
}

export function TopBar({ title, onToggleSidebar }: TopBarProps) {
  const report = useStore((s) => s.report);
  const isExampleData = useStore((s) => s.isExampleData);
  const exportTick = useStore((s) => s.exportTick);
  const { language, toggleLanguage, toggleTheme, resolvedTheme } = useStore();
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, []);

  // Ctrl/Cmd + E → 打开导出菜单
  useEffect(() => {
    if (exportTick > 0) {
      setExportOpen(true);
    }
  }, [exportTick]);

  // Sync html lang and document title with language
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = language === "zh"
      ? "TreeDoctor - IQ-TREE 分析质量诊断"
      : "TreeDoctor - IQ-TREE Analysis Quality Diagnostics";
  }, [language]);

  const handleExport = async (format: string) => {
    setExportOpen(false);
    if (!report) return;

    if (isExampleData) {
      toast.error(t.export.exampleBlocked);
      return;
    }

    if (format === "html" || format === "pdf") {
      const html = buildReportHtml(report, language);
      if (format === "pdf") {
        // PDF：注入隐藏 iframe 调起系统打印（WebView2 打印对话框可选"另存为 PDF"）
        printReportHtml(html);
        return;
      }
      const result = await saveTextFile(
        html,
        `${report.prefix}_treedoctor_report.html`,
        "HTML",
        "html"
      );
      if (result.success) {
        toast.success(t.export.saveSuccess);
      } else if (result.error !== "cancelled") {
        toast.error(t.export.saveFailed);
      }
      return;
    }

    const result = await exportReport(report, format, t.export.saveTitle);
    if (result.success) {
      toast.success(t.export.saveSuccess);
    } else if (result.error !== "cancelled") {
      toast.error(t.export.saveFailed);
    }
  };

  const exportFormats = [
    { format: "text", label: t.topBar.textFormat, icon: FileText },
    { format: "markdown", label: t.topBar.markdownFormat, icon: FileCode },
    { format: "json", label: t.topBar.jsonFormat, icon: Braces },
    { format: "html", label: t.topBar.htmlFormat, icon: Globe },
    { format: "pdf", label: t.topBar.pdfFormat, icon: Printer },
  ];

  // Format timestamp for display — supports ISO 8601 and Unix seconds
  const formattedTime = report?.timestamp
    ? (() => {
        const d = new Date(report.timestamp);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString(language === "zh" ? "zh-CN" : "en-US");
        }
        // Fallback: try parsing as Unix seconds (legacy/example data)
        const ts = parseInt(report.timestamp, 10);
        if (!isNaN(ts)) {
          const d2 = new Date(ts * 1000);
          if (!isNaN(d2.getTime())) {
            return d2.toLocaleString(language === "zh" ? "zh-CN" : "en-US");
          }
        }
        return report.timestamp;
      })()
    : null;

  return (
    <header
      className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center justify-between border-b px-4 td-transition td-glass"
      role="banner"
    >
      {/* Left: Title area */}
      <div className="flex items-center gap-1.5">
        {location.pathname !== "/" && (
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-td td-transition-fast hover:bg-td-fill td-focus-ring"
            aria-label={t.topBar.back}
            title={t.topBar.back}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => { onToggleSidebar(); }}
          className="flex h-8 w-8 items-center justify-center rounded-td td-transition-fast hover:bg-td-fill td-focus-ring"
          aria-label={t.sidebar.collapse || "Toggle sidebar"}
          title={t.sidebar.collapse || "Toggle sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Title — 页面级标题由各页面承担，此处为导航性文本 */}
        <div className="flex items-center gap-2">
 <p className="text-td-sm font-semibold tracking-tight text-td-text" >{title}</p>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1">
        {/* Report identity info */}
        {report && (
 <div className="hidden items-center gap-2 mr-2 px-3 py-1 rounded-td md:flex bg-td-fill-tertiary" >
            {isExampleData && (
              <span
                className="inline-flex items-center gap-1 text-td-xs font-medium px-1.5 py-0.5 rounded-td-sm"
                style={{ backgroundColor: "color-mix(in srgb, var(--td-warning) 12%, transparent)", color: "var(--td-warning)" }}
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                {t.topBar.exampleMode}
              </span>
            )}
 <span className="text-td-xs font-mono text-td-text-tertiary" >
              {report.prefix}
            </span>
            {formattedTime && (
              <>
 <span className="text-td-xs text-td-text-quaternary" >·</span>
 <span className="flex items-center gap-1 text-td-xs td-num text-td-text-tertiary" >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formattedTime}
                </span>
              </>
            )}
 <span className="text-td-xs text-td-text-quaternary" >·</span>
 <span className="flex items-center gap-1 text-td-xs font-mono td-num text-td-text-tertiary" >
              {report.files_found.length}/{report.files_found.length + report.files_missing.length}
              <FolderOpen className="inline h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        )}

        {/* Export button */}
        {report && (
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className={cn(
                "flex items-center gap-1.5 rounded-td px-3 py-1.5 text-td-sm font-medium td-transition td-focus-ring hover:bg-td-fill",
                isExampleData && "cursor-not-allowed opacity-50"
              )}
              disabled={isExampleData}
              aria-expanded={exportOpen}
              aria-haspopup="menu"
              aria-label={isExampleData ? t.topBar.exportDisabled : t.topBar.exportReport}
              style={{
                backgroundColor: exportOpen ? "var(--td-fill-tertiary)" : undefined,
                color: exportOpen ? "var(--td-text)" : "var(--td-text-secondary)",
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t.topBar.exportReport}</span>
              <ChevronDown className={cn("h-3 w-3 td-transition", exportOpen && "rotate-180")} aria-hidden="true" />
            </button>

            {exportOpen && !isExampleData && (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-td-lg border py-1 td-zoom-in"
                style={{ borderColor: "var(--td-border)", background: "var(--td-bg-elevated)", boxShadow: "var(--td-shadow-lg)" }}
                role="menu"
                aria-label={t.topBar.exportReport}
              >
 <div className="px-3 py-1.5 text-td-xs uppercase tracking-wider text-td-text-quaternary" >
                  {t.topBar.exportReport}
                </div>
                {exportFormats.map(({ format, label, icon: Icon }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-td-sm hover:bg-td-fill td-transition-fast td-focus-ring hover:text-td-text"
                    role="menuitem"
                  >
 <Icon className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
 <div className="mx-1 h-5 w-px bg-td-border" aria-hidden="true" />

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className="flex h-8 w-8 items-center justify-center rounded-td td-transition hover:bg-td-fill td-focus-ring"
          aria-label={t.settings.title}
          title={t.settings.title}
        >
          <SettingsIcon className="h-4 w-4" />
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex h-8 items-center gap-1 rounded-td px-2 td-transition hover:bg-td-fill td-focus-ring"
          aria-label={t.topBar.language}
          title={t.topBar.language}
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          <span className="text-td-xs font-medium">{language === "zh" ? "中" : "EN"}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-td td-transition hover:bg-td-fill td-focus-ring"
          aria-label={resolvedTheme !== "dark" ? t.topBar.darkTheme : t.topBar.lightTheme}
          title={resolvedTheme !== "dark" ? t.topBar.darkTheme : t.topBar.lightTheme}
        >
          {resolvedTheme !== "dark" ? (
            <Moon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
