import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, useTranslation } from "../stores/useStore";
import { Settings, Sun, Moon, Monitor, Languages, History, Trash2, Keyboard, Info, FolderOpen, Play } from "lucide-react";
import { cn } from "../lib/utils";
import { loadRecents, removeRecent, clearRecents, type RecentEntry } from "../lib/recent";
import { analyzeDirectory } from "../lib/tauri";
import { toast } from "../components/Toast";
import { useFirstVisit, enterIf } from "../hooks/useFirstVisit";
import type { Grade } from "../types";
import { GRADE_BG_COLORS, GRADE_TEXT_COLORS, GRADE_BORDER_COLORS } from "../types";

/**
 * 设置页：外观（主题三态/语言）· 历史记录与对比 · 快捷键 · 关于
 */

function GradeChip({ grade }: { grade: Grade | null | undefined }) {
  if (!grade) return <span className="text-td-text-quaternary">—</span>;
  return (
    <span
      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-td-sm border px-1 text-td-xs font-bold"
      style={{
        backgroundColor: GRADE_BG_COLORS[grade],
        color: GRADE_TEXT_COLORS[grade],
        borderColor: GRADE_BORDER_COLORS[grade],
      }}
    >
      {grade === "N" ? "—" : grade}
    </span>
  );
}

// 维度 id → 导航键（用于取本地化维度名，避免显示 D1-D8 编号）
const DIM_NAV_KEY: Record<string, "alignment" | "model" | "likelihood" | "topology" | "support" | "bootstrap" | "consensus" | "runtime"> = {
  D1: "alignment",
  D2: "model",
  D3: "likelihood",
  D4: "topology",
  D5: "support",
  D6: "bootstrap",
  D7: "consensus",
  D8: "runtime",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, language, setLanguage, report } = useStore();
  const t = useTranslation();
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadRecents());
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [reopening, setReopening] = useState<string | null>(null);
  const first = useFirstVisit("/settings");

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    clearRecents();
    setRecents([]);
    setConfirmingClear(false);
  };

  const handleRemove = (path: string) => {
    removeRecent(path);
    setRecents(loadRecents());
  };

  const handleReopen = async (path: string) => {
    setReopening(path);
    try {
      const r = await analyzeDirectory(path);
      r.source_dir = path;
      useStore.getState().setReport(r);
      useStore.getState().setIsExampleData(false);
      useStore.getState().setAnalysisStatus("complete");
      navigate("/overview");
    } catch (err) {
      toast.error(String(err));
      useStore.getState().setError(String(err));
      useStore.getState().setAnalysisStatus("error");
    } finally {
      setReopening(null);
    }
  };

  const shortcuts: { keys: string; label: string }[] = [
    { keys: "Ctrl/Cmd + O", label: t.settings.shortcutOpen },
    { keys: "Ctrl/Cmd + E", label: t.settings.shortcutExport },
    { keys: "Ctrl/Cmd + 1–8", label: t.settings.shortcutDims },
    { keys: "Ctrl/Cmd + ,", label: t.settings.shortcutSettings },
    { keys: "Ctrl/Cmd + F", label: t.settings.shortcutSearch },
    { keys: "Ctrl/Cmd + ←/→", label: t.settings.shortcutPrevNext },
    { keys: "+ / − / R / T", label: t.settings.shortcutTree },
  ];

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className={cn("mb-6 flex items-center gap-2.5", enterIf(first, "td-fade-in-down"))}>
 <Settings className="h-5 w-5 text-td-text-tertiary" aria-hidden="true" />
 <h2 className="text-td-xl font-semibold tracking-tight td-display text-td-text" >
          {t.settings.title}
        </h2>
      </div>

      {/* Appearance */}
      <section
        className={cn("td-section mb-4 p-5", enterIf(first, "td-fade-in-up", "td-stagger-1"))}
        aria-labelledby="settings-appearance"
      >
 <h3 id="settings-appearance" className="mb-4 flex items-center gap-2 text-td-lg font-semibold tracking-tight text-td-text" >
 <Sun className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
          {t.settings.appearance}
        </h3>

        {/* Theme */}
        <div className="mb-4">
 <div className="mb-2 text-td-sm font-medium text-td-text-secondary" >{t.settings.theme}</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.settings.theme}>
            {([
              { value: "light", label: t.settings.themeLight, icon: Sun },
              { value: "dark", label: t.settings.themeDark, icon: Moon },
              { value: "system", label: t.settings.themeSystem, icon: Monitor },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                role="radio"
                aria-checked={theme === value}
                className={cn(
                  "flex items-center gap-1.5 rounded-td border px-3 py-1.5 text-td-sm font-medium td-transition td-focus-ring td-pressable",
                  theme === value ? "border-transparent" : "hover:bg-td-fill"
                )}
                style={{
                  backgroundColor: theme === value ? "var(--td-primary)" : "var(--td-bg-container)",
                  borderColor: theme === value ? "var(--td-primary)" : "var(--td-border)",
                  color: theme === value ? "#ffffff" : "var(--td-text-secondary)",
                }}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
 <div className="mb-2 text-td-sm font-medium text-td-text-secondary" >{t.settings.language}</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.settings.language}>
            {([
              { value: "zh", label: t.settings.languageZh },
              { value: "en", label: t.settings.languageEn },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLanguage(value)}
                role="radio"
                aria-checked={language === value}
                className={cn(
                  "flex items-center gap-1.5 rounded-td border px-3 py-1.5 text-td-sm font-medium td-transition td-focus-ring td-pressable",
                  language === value ? "border-transparent" : "hover:bg-td-fill"
                )}
                style={{
                  backgroundColor: language === value ? "var(--td-primary)" : "var(--td-bg-container)",
                  borderColor: language === value ? "var(--td-primary)" : "var(--td-border)",
                  color: language === value ? "#ffffff" : "var(--td-text-secondary)",
                }}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* History & comparison */}
      <section
        className={cn("td-section mb-4 p-5", enterIf(first, "td-fade-in-up", "td-stagger-2"))}
        aria-labelledby="settings-history"
      >
        <div className="mb-4 flex items-center justify-between">
 <h3 id="settings-history" className="flex items-center gap-2 text-td-lg font-semibold tracking-tight text-td-text" >
 <History className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
            {t.settings.historySection}
          </h3>
          {recents.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-td border px-2.5 py-1 text-td-xs font-medium td-transition-fast td-focus-ring hover:bg-td-fill"
              style={{
                borderColor: confirmingClear ? "var(--td-error)" : "var(--td-border)",
                color: confirmingClear ? "var(--td-error)" : "var(--td-text-tertiary)",
              }}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              {confirmingClear ? t.settings.confirmClear : t.settings.clearHistory}
            </button>
          )}
        </div>

        {recents.length === 0 ? (
 <p className="text-td-sm text-td-text-quaternary" >{t.settings.historyEmpty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-td-sm">
              <caption className="sr-only">{t.settings.historySection}</caption>
              <thead>
                <tr className="border-b text-left text-td-xs uppercase tracking-wider" style={{ borderColor: "var(--td-border)", color: "var(--td-text-tertiary)" }}>
                  <th className="py-2 pr-3 font-medium" scope="col">#</th>
                  <th className="py-2 pr-3 font-medium" scope="col">{t.overview.filePrefix}</th>
                  <th className="py-2 pr-3 font-medium" scope="col">{t.sidebar.overallGrade}</th>
                  {["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"].map((d) => (
                    <th
                      key={d}
                      className="px-2 py-2 text-center font-medium text-td-xs leading-tight"
                      scope="col"
                      title={t.nav[DIM_NAV_KEY[d]]}
                    >
                      <span className="inline-block max-w-[72px] whitespace-normal">{t.nav[DIM_NAV_KEY[d]]}</span>
                    </th>
                  ))}
                  <th className="py-2 pr-3 text-right font-medium" scope="col">
                    <span className="sr-only">{t.settings.open} / {t.settings.remove}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recents.map((r, i) => {
                  const isCurrent = report?.source_dir === r.path;
                  return (
                    <tr
                      key={r.path}
                      className="border-b last:border-0 hover:bg-td-fill td-transition-fast"
                    >
 <td className="py-2 pr-3 text-td-xs td-num text-td-text-quaternary" >{i + 1}</td>
                      <td className="py-2 pr-3">
 <div className="font-mono text-td-xs td-text-ellipsis max-w-[220px] text-td-text" title={r.path}>
                          {r.prefix}
                        </div>
 <div className="text-td-xs text-td-text-quaternary" >
                          {new Date(r.saved_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-2 pr-3"><GradeChip grade={r.overall_grade} /></td>
                      {["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"].map((d) => {
                        const g = r.dims[d];
                        // 与当前报告对比：不同则高亮
                        const cur = report?.dimensions.find((x) => x.dimension_id === d)?.grade;
                        const diff = isCurrent === false && cur && g && cur !== g;
                        return (
                          <td key={d} className="py-2 pr-2 text-center">
                            <span title={diff ? `${t.settings.vsCurrent}: ${cur} → ${g}` : undefined}
                              style={diff ? { outline: "1.5px solid var(--td-warning)", outlineOffset: 1, borderRadius: 4 } : undefined}>
                              <GradeChip grade={g ?? null} />
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2 pr-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleReopen(r.path)}
                            disabled={reopening === r.path}
                            className="flex h-7 w-7 items-center justify-center rounded-td td-transition-fast td-focus-ring hover:bg-td-fill"
                            title={`${t.settings.open}: ${r.path}`}
                            aria-label={`${t.settings.open}: ${r.prefix}`}
                          >
                            {reopening === r.path ? <Play className="h-3.5 w-3.5 animate-pulse" /> : <FolderOpen className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleRemove(r.path)}
                            className="flex h-7 w-7 items-center justify-center rounded-td td-transition-fast td-focus-ring hover:bg-td-fill"
                            title={t.settings.remove}
                            aria-label={`${t.settings.remove}: ${r.prefix}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Shortcuts */}
      <section
        className={cn("td-section mb-4 p-5", enterIf(first, "td-fade-in-up", "td-stagger-3"))}
        aria-labelledby="settings-shortcuts"
      >
 <h3 id="settings-shortcuts" className="mb-4 flex items-center gap-2 text-td-lg font-semibold tracking-tight text-td-text" >
 <Keyboard className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
          {t.settings.shortcuts}
        </h3>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
          {shortcuts.map((s) => (
 <div key={s.keys} className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0 border-td-border-secondary" >
 <dt className="text-td-sm text-td-text-secondary" >{s.label}</dt>
              <dd>
                <kbd
                  className="rounded-td-sm border px-1.5 py-0.5 font-mono text-td-xs"
                  style={{ borderColor: "var(--td-border)", backgroundColor: "var(--td-canvas-soft-2)", color: "var(--td-text-secondary)" }}
                >
                  {s.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* About */}
      <section
        className={cn("td-section p-5", enterIf(first, "td-fade-in-up", "td-stagger-4"))}
        aria-labelledby="settings-about"
      >
 <h3 id="settings-about" className="mb-3 flex items-center gap-2 text-td-lg font-semibold tracking-tight text-td-text" >
 <Info className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
          {t.settings.about}
        </h3>
 <div className="space-y-1 text-td-sm text-td-text-secondary" >
          <div className="flex items-center gap-2">
 <span className="font-semibold text-td-text" >TreeDoctor</span>
 <span className="rounded-td-sm px-1.5 py-0.5 font-mono text-td-xs bg-td-fill-tertiary text-td-text-tertiary" >
              {t.settings.versionLabel} 0.1.0
            </span>
          </div>
          <p>{t.settings.desc}</p>
        </div>
      </section>
    </div>
  );
}
