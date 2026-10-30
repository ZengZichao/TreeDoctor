import { useState, useMemo, useRef, useEffect } from "react";
import { useStore, useTranslation } from "../stores/useStore";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { Copy, Check, Search } from "lucide-react";
import { toast } from "../components/Toast";
import { useFirstVisit, enterIf } from "../hooks/useFirstVisit";

/**
 * 原始数据页：
 * 完整报告 JSON + 对齐/模型/树/Bootstrap 分类标签
 * - tablist/tab/tabpanel 完整 ARIA + 方向键导航 + roving tabindex
 * - 搜索改为高亮匹配（不重排/不破坏 JSON 结构），复制永远复制完整数据
 * - 移除 dangerouslySetInnerHTML 误用，纯文本渲染
 */
export function RawDataPage() {
  const report = useStore((s) => s.report);
  const searchTick = useStore((s) => s.searchTick);
  const t = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("report");
  const [search, setSearch] = useState("");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const first = useFirstVisit("raw-data");

  // Ctrl/Cmd + F → 聚焦搜索框
  useEffect(() => {
    if (searchTick > 0) {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, [searchTick]);

  const tabs = [
    { id: "report", label: t.rawData.fullReport },
    { id: "alignment", label: t.rawData.alignmentData },
    { id: "model", label: t.rawData.modelData },
    { id: "tree", label: t.rawData.treeData },
    { id: "bootstrap", label: t.rawData.bootstrapData },
  ];

  const rawData = useMemo(() => {
    if (!report) return "";
    switch (activeTab) {
      case "report":
        return JSON.stringify(report, null, 2);
      case "alignment":
        return JSON.stringify(
          { alignment: report.alignment, composition_test: report.composition_test },
          null, 2
        );
      case "model":
        return JSON.stringify(
          { model_finder: report.model_finder, substitution: report.substitution, likelihood: report.likelihood },
          null, 2
        );
      case "tree":
        return JSON.stringify(
          { ml_tree: report.ml_tree, consensus_tree: report.consensus_tree, splits: report.splits },
          null, 2
        );
      case "bootstrap":
        return JSON.stringify(report.bootstrap, null, 2);
      default:
        return "";
    }
  }, [report, activeTab]);

  if (!report) {
    return (
 <div className="flex h-full flex-col items-center justify-center gap-4 text-td-text-tertiary" >
        <p className="text-td-sm">{t.rawData.noReport}</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 rounded-td px-4 py-2 text-td-sm font-medium td-transition td-focus-ring"
        >
          {t.home.backToHome}
        </button>
      </div>
    );
  }

  // 匹配统计 + 行内高亮（不改写 JSON 结构）
  const matchCount = useMemo(() => {
    if (!search.trim()) return 0;
    const needle = search.toLowerCase();
    let count = 0;
    for (const line of rawData.split("\n")) {
      let idx = 0;
      const lower = line.toLowerCase();
      while ((idx = lower.indexOf(needle, idx)) !== -1) {
        count++;
        idx += needle.length;
      }
    }
    return count;
  }, [rawData, search]);

  const handleCopy = async () => {
    // 复制永远是完整数据，不受过滤影响
    try {
      await navigator.clipboard.writeText(rawData);
      toast.success(t.rawData.copied);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = rawData;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        toast.success(t.rawData.copied);
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    }
  };

  // 方向键导航（roving tabindex）
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next !== -1) {
      e.preventDefault();
      setActiveTab(tabs[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  const lineCount = rawData.split("\n").length;

  /** 单行内高亮匹配片段（纯文本拆分，无 HTML 注入） */
  const renderLine = (line: string): React.ReactNode => {
    const needle = search.trim().toLowerCase();
    if (!needle) return line;
    const parts: React.ReactNode[] = [];
    const lower = line.toLowerCase();
    let pos = 0;
    let key = 0;
    while (true) {
      const idx = lower.indexOf(needle, pos);
      if (idx === -1) {
        parts.push(line.slice(pos));
        break;
      }
      if (idx > pos) parts.push(line.slice(pos, idx));
      parts.push(
        <mark
          key={key++}
          style={{
            backgroundColor: "color-mix(in srgb, var(--td-warning) 28%, transparent)",
            color: "var(--td-text)",
            borderRadius: 2,
          }}
        >
          {line.slice(idx, idx + needle.length)}
        </mark>
      );
      pos = idx + needle.length;
    }
    return parts;
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className={cn("mb-4", enterIf(first, "td-fade-in-down"))}>
 <h2 className="text-td-xl font-semibold tracking-tight td-display text-td-text" >{t.rawData.fullReport}</h2>
 <p className="mt-1 text-td-sm td-num text-td-text-tertiary" >
          {t.rawData.jsonViewer} · {lineCount} {t.rawData.lines}
        </p>
      </div>

      {/* Toolbar: Tabs + Search */}
      <div className={cn("mb-3 flex flex-wrap items-center justify-between gap-3", enterIf(first, "td-fade-in"))} role="toolbar" aria-label={t.rawData.jsonViewer}>
        {/* Tabs — 完整 ARIA tablist */}
 <div className="flex gap-1 rounded-td-lg p-1 bg-td-fill-tertiary" role="tablist" aria-label={t.rawData.jsonViewer}>
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={cn(
                "rounded-td px-3 py-1.5 text-td-sm font-medium td-transition-fast td-focus-ring",
              )}
              style={{
                backgroundColor: activeTab === tab.id ? "var(--td-bg-container)" : undefined,
                color: activeTab === tab.id ? "var(--td-text)" : "var(--td-text-tertiary)",
                boxShadow: activeTab === tab.id ? "var(--td-shadow-xs)" : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Copy */}
        <div className="flex items-center gap-2">
          <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-td-text-quaternary" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.rawData.filter}
              className="w-36 rounded-td border py-1.5 pl-7 pr-3 font-mono text-td-xs focus:outline-none td-transition td-focus-ring"
              style={{
                borderColor: "var(--td-border)",
                backgroundColor: "var(--td-bg-container)",
                color: "var(--td-text)",
              }}
              aria-label={t.rawData.filter}
            />
          </div>
          <button
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center rounded-td border td-transition-fast td-focus-ring hover:border-td-text-tertiary hover:text-td-text"
            style={{
              borderColor: "var(--td-border)",
              color: "var(--td-text-tertiary)",
            }}
            title={t.rawData.copyAlwaysFull}
            aria-label={t.rawData.copyAlwaysFull}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Match count（搜索反馈） */}
      {search.trim() && (
 <p className="mb-2 text-td-xs td-num text-td-text-tertiary" role="status">
          {t.rawData.matches.replace("{n}", String(matchCount))}
        </p>
      )}

      {/* JSON viewer — token 化配色，纯文本渲染 */}
      <div
        className={cn("min-h-0 flex-1 overflow-auto rounded-td-lg border p-4", enterIf(first, "td-fade-in-up"))}
        style={{
          borderColor: "var(--td-border)",
          backgroundColor: "var(--td-canvas-soft-2)",
          boxShadow: "var(--td-shadow-sm)",
        }}
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
 <pre className="text-td-xs leading-relaxed font-mono text-td-text" >
          {rawData.split("\n").map((line, i) => (
            <div key={i} className="flex hover:bg-td-fill td-transition-fast" style={{ minHeight: "20px" }}>
              <span
                className="w-10 flex-shrink-0 select-none pr-3 text-right td-num"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="flex-1" style={{ color: syntaxHighlight(line) }}>
                {renderLine(line)}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function syntaxHighlight(line: string): string {
  // 基于语义 token 的行级配色（非注入式高亮）
  if (line.trim().startsWith('"') && line.includes(":")) {
    return "var(--td-text)";
  }
  if (line.includes("null")) {
    return "var(--td-text-tertiary)";
  }
  if (line.includes("true") || line.includes("false")) {
    return "var(--td-primary-text)";
  }
  return "var(--td-text-secondary)";
}
