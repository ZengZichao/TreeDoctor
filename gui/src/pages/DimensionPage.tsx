import { useEffect, useMemo, useState } from "react";
import { useStore, useTranslation } from "../stores/useStore";
import { useNavigate, useLocation } from "react-router-dom";
import { GradeBadge } from "../components/GradeBadge";
import { DiagnosticCard } from "../components/DiagnosticCard";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { StatCard } from "../components/StatCard";
import { TreeView } from "../components/TreeView";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Database, Boxes, TrendingUp, GitBranch, ShieldCheck, Repeat, GitMerge, Clock, ChevronLeft, ChevronRight, Keyboard } from "lucide-react";
import { cn } from "../lib/utils";
import { useFirstVisit, enterIf } from "../hooks/useFirstVisit";

interface DimensionPageProps {
  dimensionId: string;
}

const DIM_PATHS = ["/alignment", "/model", "/likelihood", "/topology", "/support", "/bootstrap", "/consensus", "/runtime"];
const DIM_IDS = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"];

export function DimensionPage({ dimensionId }: DimensionPageProps) {
  const report = useStore((s) => s.report);
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const first = useFirstVisit("dim:" + dimensionId);

  // 深链 ?rule= → 滚动到规则卡片并 2s 高亮
  const [highlightRule, setHighlightRule] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rule = params.get("rule");
    if (!rule) return;
    setHighlightRule(rule);
    // 等 DOM 挂载后滚动
    const timer = setTimeout(() => {
      const el = document.getElementById(`rule-${rule}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
    const clear = setTimeout(() => setHighlightRule(null), 2400);
    return () => {
      clearTimeout(timer);
      clearTimeout(clear);
    };
  }, [location.search, dimensionId]);

  // 维度上下篇导航（横向阅读动线）
  const idx = DIM_IDS.indexOf(dimensionId);
  const prevId = idx > 0 ? DIM_IDS[idx - 1] : DIM_IDS[DIM_IDS.length - 1];
  const nextId = idx < DIM_IDS.length - 1 ? DIM_IDS[idx + 1] : DIM_IDS[0];
  const goDim = (id: string) => navigate(DIM_PATHS[DIM_IDS.indexOf(id)]);

  if (!report) {
    return (
 <div className="flex h-full flex-col items-center justify-center gap-4 text-td-text-tertiary" >
        <p className="text-td-sm">{t.dimension.noReport}</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 rounded-td px-4 py-2 text-td-sm font-medium td-transition td-focus-ring"
        >
          {t.home.backToHome}
        </button>
      </div>
    );
  }

  const dimension = report.dimensions.find((d) => d.dimension_id === dimensionId);

  if (!dimension) {
    return (
 <div className="flex h-full flex-col items-center justify-center gap-4 text-td-text-tertiary" >
        <p className="text-td-sm">{t.dimension.dimUnavailable}</p>
        <button
          onClick={() => navigate("/overview")}
          className="inline-flex items-center gap-1.5 rounded-td px-4 py-2 text-td-sm font-medium td-transition td-focus-ring"
        >
          {t.nav.overview}
        </button>
      </div>
    );
  }

  // 各维度独立图标
  const dimIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    D1: Database,
    D2: Boxes,
    D3: TrendingUp,
    D4: GitBranch,
    D5: ShieldCheck,
    D6: Repeat,
    D7: GitMerge,
    D8: Clock,
  };
  const DimIcon = dimIcons[dimensionId] || Database;
  const failedCount = dimension.results.filter((r) => r.grade === "C" || r.grade === "D" || r.grade === "F").length;

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* 吸顶维度小结 */}
      <header
        className="sticky top-0 z-10 -mx-6 mb-5 flex items-center justify-between border-b px-6 py-3 td-fade-in-down"
        style={{
          borderColor: "var(--td-border)",
          backgroundColor: "color-mix(in srgb, var(--td-bg-layout) 92%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-td-lg"
            style={{
              backgroundColor: "var(--td-fill-tertiary)",
              color: "var(--td-text-secondary)",
            }}
            aria-hidden="true"
          >
            <DimIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-td-xl truncate font-semibold tracking-tight td-display text-td-text" >{dimension.dimension_name}</h2>
            </div>
 <p className="mt-0.5 text-td-xs td-num text-td-text-tertiary" >
              {dimension.results.length} {t.rules.rules}
              {failedCount > 0 && (
                <span className="text-td-warning"> · {failedCount} {t.dimension.failedRules}</span>
              )}
            </p>
          </div>
        </div>
        <GradeBadge grade={dimension.grade} size="md" showLabel />
      </header>

      {/* Dimension-specific stats */}
      {dimensionId === "D1" && report.alignment && (
        <div className="mb-4 grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-1")} label={t.dimension.nSequences} value={report.alignment.n_sequences} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-2")} label={t.dimension.nSites} value={report.alignment.n_sites} />
          <StatCard
            className={enterIf(first, "td-fade-in-up", "td-stagger-3")}
            label={t.dimension.informativeSites}
            value={report.alignment.n_informative_sites}
            subValue={`${report.alignment.n_sites > 0 ? ((report.alignment.n_informative_sites / report.alignment.n_sites) * 100).toFixed(1) : "—"}%`}
          />
          <StatCard
            className={enterIf(first, "td-fade-in-up", "td-stagger-4")}
            label={t.dimension.constantSites}
            value={report.alignment.n_constant_sites}
            subValue={`${(report.alignment.frac_constant * 100).toFixed(1)}%`}
          />
        </div>
      )}

      {dimensionId === "D1" && report.composition_test && (
        <div className="mb-4">
          <CollapsibleSection title={t.dimension.compositionTest} badge={`${report.composition_test.n_failed}/${report.composition_test.sequences.length} ${t.dimension.failed}`}>
            <CompositionTestTable />
          </CollapsibleSection>
        </div>
      )}

      {dimensionId === "D2" && report.model_finder && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-1")} label={t.dimension.bestModel} value={report.model_finder.best_model} />
            <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-2")} label={t.dimension.criterion} value={report.model_finder.criterion} />
            <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-3")} label={t.dimension.freeParams} value={report.likelihood?.n_free_parameters ?? "—"} />
            <StatCard
              className={enterIf(first, "td-fade-in-up", "td-stagger-4")}
              label={t.dimension.gammaShape}
              value={report.substitution?.alpha?.toFixed(4) ?? "—"}
            />
          </div>

          {report.model_finder.models.length > 0 && (
            <div className="mb-4">
              <CollapsibleSection title={t.dimension.modelComparison} badge={`${report.model_finder.models.length}`}>
                <ModelComparisonTable />
              </CollapsibleSection>
            </div>
          )}
        </>
      )}

      {dimensionId === "D3" && report.likelihood && (
        <div className="mb-4 grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-1")} label={t.dimension.logl} value={report.likelihood.log_likelihood.toFixed(4)} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-2")} label={t.dimension.aic} value={report.likelihood.aic.toFixed(2)} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-3")} label={t.dimension.aicc} value={report.likelihood.aicc.toFixed(2)} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-4")} label={t.dimension.bic} value={report.likelihood.bic.toFixed(2)} />
        </div>
      )}

      {/* D4: Tree visualization — responsive, no fixed width */}
      {dimensionId === "D4" && report.ml_tree && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <TreeView newick={report.ml_tree.newick_string} height={400} />
          </div>
          <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <StatCard label={t.dimension.totalTreeLength} value={report.ml_tree.total_tree_length.toFixed(4)} />
            <StatCard label={t.dimension.internalBranches} value={report.ml_tree.n_internal_branches} />
            <StatCard label={t.dimension.minBranch} value={report.ml_tree.min_branch_length.toFixed(4)} />
            <StatCard label={t.dimension.maxBranch} value={report.ml_tree.max_branch_length.toFixed(4)} />
            <StatCard label={t.dimension.nearZeroBranches} value={report.ml_tree.near_zero_branches.length} />
            <StatCard label={t.dimension.longBranches} value={report.ml_tree.long_branches.length} />
          </div>
        </div>
      )}

      {dimensionId === "D5" && report.splits && (
        <div className="mb-4">
          <SupportDistributionChart />
        </div>
      )}

      {dimensionId === "D6" && report.bootstrap && (
        <div className="mb-4 grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-1")} label={t.dimension.bootstrapType} value={report.bootstrap.bootstrap_type} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-2")} label={t.dimension.nReplicates} value={report.bootstrap.n_replicates} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-3")} label={t.dimension.correlationCoeff} value={report.bootstrap.correlation_coefficient?.toFixed(4) ?? "—"} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-4")} label={t.dimension.nIterations} value={report.bootstrap.n_iterations} />
        </div>
      )}

      {/* D7: Display consensus tree alongside ML tree */}
      {dimensionId === "D7" && report.ml_tree && report.consensus_tree && (
        <div className="mb-4 space-y-4">
          <div>
 <h3 className="mb-2 text-td-lg font-semibold tracking-tight text-td-text" >{t.dimension.mlTree}</h3>
            <TreeView newick={report.ml_tree.newick_string} height={400} />
          </div>
          <div>
 <h3 className="mb-2 text-td-lg font-semibold tracking-tight text-td-text" >{t.dimension.consensusTree}</h3>
            <TreeView newick={report.consensus_tree.newick_string} height={400} />
          </div>
          {report.bootstrap && report.bootstrap.rf_distance !== null && (
            <StatCard label={t.dimension.rfDistance} value={report.bootstrap.rf_distance} />
          )}
        </div>
      )}

      {dimensionId === "D8" && report.runtime && (
        <div className="mb-4 grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-1")} label={t.dimension.nThreads} value={report.runtime.n_threads} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-2")} label={t.dimension.nCpuCores} value={report.runtime.n_cpu_cores} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-3")} label={t.dimension.cpuTime} value={`${report.runtime.cpu_time.toFixed(2)}s`} />
          <StatCard className={enterIf(first, "td-fade-in-up", "td-stagger-4")} label={t.dimension.wallClock} value={`${report.runtime.wall_clock_time.toFixed(2)}s`} />
        </div>
      )}

      {/* Diagnostic results — 每张卡片带 anchor，承接 ?rule= 深链 */}
      <div className="space-y-3">
        {dimension.results.map((result, i) => (
          <div
            key={result.rule_id}
            id={`rule-${result.rule_id}`}
            className={cn(
              "scroll-mt-24 rounded-td-lg",
              enterIf(first, "td-fade-in-up", `td-stagger-${Math.min(i + 1, 8)}`),
              highlightRule === result.rule_id && "td-rule-flash"
            )}
          >
            <DiagnosticCard result={result} highlight={highlightRule === result.rule_id} />
          </div>
        ))}
      </div>

      {/* 上下篇导航 */}
      <nav
        className="mt-8 flex items-center justify-between gap-3 border-t pt-4 pb-2"
        aria-label={t.dimension.dimNavHint}
      >
        <button
          onClick={() => goDim(prevId)}
          className="group flex min-w-0 items-center gap-2 rounded-td px-3 py-2 text-td-sm td-card-hover td-focus-ring"
          aria-label={`${t.dimension.prevDim}: ${prevId}`}
        >
          <ChevronLeft className="h-4 w-4 flex-shrink-0 group-hover:-translate-x-0.5 td-transition-fast" aria-hidden="true" />
          <span className="truncate">
 <span className="font-mono text-td-xs text-td-text-quaternary" >{prevId}</span>{" "}
            {report.dimensions.find((d) => d.dimension_id === prevId)?.dimension_name}
          </span>
        </button>
 <span className="hidden flex-shrink-0 items-center gap-1 text-td-xs sm:flex text-td-text-quaternary" >
          <Keyboard className="h-3 w-3" aria-hidden="true" />
          {t.dimension.dimNavHint}
        </span>
        <button
          onClick={() => goDim(nextId)}
          className="group flex min-w-0 items-center justify-end gap-2 rounded-td px-3 py-2 text-right text-td-sm td-card-hover td-focus-ring"
          aria-label={`${t.dimension.nextDim}: ${nextId}`}
        >
          <span className="truncate">
 <span className="font-mono text-td-xs text-td-text-quaternary" >{nextId}</span>{" "}
            {report.dimensions.find((d) => d.dimension_id === nextId)?.dimension_name}
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 group-hover:translate-x-0.5 td-transition-fast" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

/* ============ 可排序 hook ============ */
type SortDir = "asc" | "desc";
function useSort<T extends Record<string, unknown>>(
  rows: T[],
  initialKey: string,
  initialDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp: number;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va ?? "").localeCompare(String(vb ?? ""), undefined, { numeric: true });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggle = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return { sorted, sortKey, sortDir, toggle };
}

function SortHeader({
  label, sortKey, current, dir, onToggle, numeric,
}: {
  label: string;
  sortKey: string;
  current: string;
  dir: SortDir;
  onToggle: (key: string) => void;
  numeric?: boolean;
}) {
  const active = current === sortKey;
  return (
    <th
      className={cn("py-2 pr-4 font-medium", numeric && "text-right")}
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        onClick={() => onToggle(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 rounded-td-sm px-1 py-0.5 td-transition-fast td-focus-ring hover:text-td-text",
          active && "font-semibold"
        )}
        style={{ color: "inherit" }}
        title={label}
      >
        {label}
        <span aria-hidden="true" className="text-td-xs" style={{ opacity: active ? 1 : 0.35 }}>
          {active ? (dir === "asc" ? "▲" : "▼") : "▲▼"}
        </span>
      </button>
    </th>
  );
}

function CompositionTestTable() {
  const report = useStore((s) => s.report);
  const t = useTranslation();
  if (!report?.composition_test) return null;

  const ct = report.composition_test;
  const rows = ct.sequences.map((seq, i) => ({
    idx: i + 1,
    seq_name: seq.seq_name,
    gap: seq.gap_percentage,
    passed: seq.passed,
    passedNum: seq.passed ? 1 : 0,
    p_value: seq.p_value,
  }));
  const { sorted, sortKey, sortDir, toggle } = useSort(rows, "idx");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-td-sm">
        <caption className="sr-only">{t.dimension.compositionTest}</caption>
        <thead>
          <tr className="border-b text-left text-td-xs uppercase tracking-wider" style={{ borderColor: "var(--td-border)", color: "var(--td-text-tertiary)" }}>
            <SortHeader label="#" sortKey="idx" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
            <SortHeader label={t.dimension.seqName} sortKey="seq_name" current={sortKey} dir={sortDir} onToggle={toggle} />
            <SortHeader label="Gap%" sortKey="gap" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
            <SortHeader label={t.dimension.testResult} sortKey="passedNum" current={sortKey} dir={sortDir} onToggle={toggle} />
            <SortHeader label={t.dimension.pValue} sortKey="p_value" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.idx}
              className="border-b last:border-0 hover:bg-td-fill td-transition-fast"
              style={{
                borderColor: "var(--td-border-secondary)",
                backgroundColor: !row.passed ? "color-mix(in srgb, var(--td-error) 6%, transparent)" : undefined,
              }}
            >
 <td className="py-2 pr-4 text-td-xs td-num text-td-text-quaternary" >{row.idx}</td>
 <td className="py-2 pr-4 font-mono text-td-xs text-td-text" >{row.seq_name}</td>
 <td className="py-2 pr-4 text-td-xs text-right td-num text-td-text-secondary" >{row.gap.toFixed(2)}</td>
              <td className="py-2 pr-4">
                {row.passed ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-td-sm px-2 py-0.5 text-td-xs font-medium"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--td-success) 10%, transparent)",
                      color: "var(--td-success)",
                    }}
                  >
 <span className="h-1.5 w-1.5 rounded-full bg-td-success" aria-hidden="true" />
                    {t.dimension.passed}
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded-td-sm px-2 py-0.5 text-td-xs font-medium"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--td-error) 10%, transparent)",
                      color: "var(--td-error)",
                    }}
                  >
 <span className="h-1.5 w-1.5 rounded-full bg-td-error" aria-hidden="true" />
                    {t.dimension.failed}
                  </span>
                )}
              </td>
 <td className="py-2 pr-4 text-td-xs td-num text-td-text-tertiary" >{row.p_value < 0.001 ? '< 0.001' : row.p_value.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
 <div className="mt-2 text-td-xs td-num text-td-text-quaternary" >
        {ct.n_failed}/{ct.sequences.length} {t.dimension.failed} · {t.dimension.significanceLevel}: {ct.significance_level}
      </div>
    </div>
  );
}

function ModelComparisonTable() {
  const report = useStore((s) => s.report);
  const t = useTranslation();
  if (!report?.model_finder) return null;

  const mf = report.model_finder;
  const criterionKey = mf.criterion.toLowerCase();

  const rows = mf.models.map((m) => ({
    name: m.name,
    logl: m.logl,
    n_params: m.n_params,
    aicc: m.aicc,
    bic: m.bic,
    weight: criterionKey === "aic" ? m.aic_weight : criterionKey === "aicc" ? m.aicc_weight : m.bic_weight,
    inConf: criterionKey === "aic" ? m.aic_in_confidence_set : criterionKey === "aicc" ? m.aicc_in_confidence_set : m.bic_in_confidence_set,
  }));
  // 初始按当前准则升序
  const { sorted, sortKey, sortDir, toggle } = useSort(rows, criterionKey === "aic" ? "aicc" : "bic", "asc");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-td-sm">
        <caption className="sr-only">{t.dimension.modelComparison}</caption>
        <thead>
          <tr className="border-b text-left text-td-xs uppercase tracking-wider" style={{ borderColor: "var(--td-border)", color: "var(--td-text-tertiary)" }}>
            <SortHeader label={t.dimension.model} sortKey="name" current={sortKey} dir={sortDir} onToggle={toggle} />
            <SortHeader label={t.dimension.logl} sortKey="logl" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
            <SortHeader label={t.dimension.df} sortKey="n_params" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
            <SortHeader label={t.dimension.aicc} sortKey="aicc" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
            <SortHeader label={t.dimension.bic} sortKey="bic" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
            <SortHeader label={t.dimension.weightColumn} sortKey="weight" current={sortKey} dir={sortDir} onToggle={toggle} numeric />
          </tr>
        </thead>
        <tbody>
          {sorted.map((model, i) => (
            <tr
              key={`${model.name}-${i}`}
              className="border-b last:border-0 td-transition-fast hover:bg-td-fill"
            >
 <td className="py-2 pr-4 text-td-sm font-medium text-td-text" >
                {model.name === mf.best_model && (
                  <span className="text-td-warning" aria-label="best">★ </span>
                )}
                <span className="font-mono text-td-xs">{model.name}</span>
              </td>
 <td className="py-2 pr-4 text-td-xs text-right td-num text-td-text-secondary" >{model.logl.toFixed(2)}</td>
 <td className="py-2 pr-4 text-td-xs text-right td-num text-td-text-secondary" >{model.n_params}</td>
 <td className="py-2 pr-4 text-td-xs text-right td-num text-td-text-secondary" >{model.aicc.toFixed(2)}</td>
 <td className="py-2 pr-4 text-td-xs text-right td-num text-td-text-secondary" >{model.bic.toFixed(2)}</td>
 <td className="py-2 pr-4 text-td-xs text-right td-num text-td-text-secondary" >
                {model.weight.toFixed(4)}
 {model.inConf && <span className="ml-1 text-td-xs text-td-primary-text" aria-label={t.dimension.confidenceSet}>●</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
 <div className="mt-2 text-td-xs text-td-text-quaternary" >
        {t.dimension.sortedBy} {mf.criterion} · {t.dimension.showing} {sorted.length} {t.dimension.of} {mf.models.length}
      </div>
    </div>
  );
}

function SupportDistributionChart() {
  const report = useStore((s) => s.report);
  const t = useTranslation();
  if (!report?.splits) return null;

  // 图表色走 token（非文本对比度 ≥3:1，随主题切换）
  const buckets = [
    { range: "<50", count: 0, fill: "var(--td-chart-1)" },
    { range: "50–80", count: 0, fill: "var(--td-chart-2)" },
    { range: "80–95", count: 0, fill: "var(--td-chart-3)" },
    { range: "≥95", count: 0, fill: "var(--td-chart-4)" },
  ];

  for (const split of report.splits.splits) {
    const support = split.support;
    const idx = support < 50 ? 0 : support < 80 ? 1 : support < 95 ? 2 : 3;
    buckets[idx].count++;
  }

  const gridColor = "var(--td-grid)";
  const tickColor = "var(--td-axis)";
  const tooltipBg = "var(--td-bg-elevated)";
  const tooltipBorder = "var(--td-border)";

  return (
    <div className="td-card td-fade-in-up p-5" role="figure" aria-label={t.dimension.supportDistribution}>
 <h3 className="mb-4 text-td-lg font-semibold tracking-tight text-td-text" >{t.dimension.supportDistribution}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={buckets}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="range" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis tick={{ fontSize: 12, fill: tickColor }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--td-text)",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {buckets.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
