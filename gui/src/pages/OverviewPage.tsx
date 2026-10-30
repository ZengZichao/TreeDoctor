import { useState } from "react";
import { useStore, useTranslation } from "../stores/useStore";
import { useNavigate } from "react-router-dom";
import { GradeBadge } from "../components/GradeBadge";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronRight, Info, Clock, Database,
  Activity, FolderOpen, FileWarning, ChevronDown, Info as InfoIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Grade } from "../types";
import { GRADE_COLORS, GRADE_TEXT_COLORS, GRADE_BORDER_COLORS, GRADE_BG_COLORS } from "../types";
import { useFirstVisit, enterIf } from "../hooks/useFirstVisit";

const DIMENSION_PATHS: Record<string, string> = {
  D1: "/alignment",
  D2: "/model",
  D3: "/likelihood",
  D4: "/topology",
  D5: "/support",
  D6: "/bootstrap",
  D7: "/consensus",
  D8: "/runtime",
};

/** 严重度排序权重：F > D > C */
const SEVERITY_ORDER: Record<string, number> = { F: 0, D: 1, C: 2 };

/**
 * 缺失文件 → 受影响维度映射：
 * 缺失文件不只是"少了一个 chip"，要显式声明哪些维度因此不可信。
 */
function impactOfMissing(files: string[]): string[] {
  const dims = new Set<string>();
  for (const f of files) {
    const name = f.toLowerCase();
    if (name.includes("contree") || name.includes("splits")) {
      dims.add("D6");
      dims.add("D7");
    }
    if (name.includes("boottrees")) dims.add("D6");
    if (name.includes("log")) dims.add("D8");
    if (name.includes("mltree") || name.includes("treefile")) {
      dims.add("D4");
      dims.add("D5");
    }
    if (name.includes("model")) dims.add("D2");
    if (name.includes("iqtree")) {
      dims.add("D1"); dims.add("D2"); dims.add("D3"); dims.add("D4"); dims.add("D5");
    }
  }
  return [...dims].sort();
}

export function OverviewPage() {
  const report = useStore((s) => s.report);
  const isExampleData = useStore((s) => s.isExampleData);
  const t = useTranslation();
  const navigate = useNavigate();
  const [showBasis, setShowBasis] = useState(false);
  const first = useFirstVisit("overview:" + (report?.prefix ?? ""));

  if (!report) {
    return (
 <div className="flex h-full flex-col items-center justify-center gap-4 text-td-text-tertiary" >
        <p className="text-td-sm">{t.overview.noReport}</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 rounded-td px-4 py-2 text-td-sm font-medium td-transition td-focus-ring"
        >
          {t.home.backToHome}
        </button>
      </div>
    );
  }

  const evaluatedChecks = report.cross_checks.filter((c) => c.evaluated !== false);
  const evaluatedPassed = evaluatedChecks.filter((c) => c.passed).length;
  const evaluatedTotal = evaluatedChecks.length;
  const hasChecks = evaluatedTotal > 0;
  const allPassed = hasChecks && evaluatedPassed === evaluatedTotal;

  // Key findings: rules with grade C or below, 按严重度排序
  const keyFindings = report.dimensions
    .flatMap((dim) =>
      dim.results
        .filter((r) => {
          const g = r.grade as Grade | null;
          return g && (g === "C" || g === "D" || g === "F");
        })
        .map((r) => ({ dim: dim.dimension_id, dimName: dim.dimension_name, result: r }))
    )
    .sort((a, b) => (SEVERITY_ORDER[a.result.grade as string] ?? 9) - (SEVERITY_ORDER[b.result.grade as string] ?? 9));

  // Count evaluated rules
  const evaluatedRules = report.dimensions.flatMap((d) => d.results).filter((r) => r.grade !== null && r.grade !== "N").length;
  const totalRules = report.dimensions.flatMap((d) => d.results).length;

  // 结论一句话：不是"良好"两个字，而是"能不能用"
  const verdictFor = (grade: Grade, n: number): string => {
    const tpl: Record<Grade, string> = {
      A: t.overview.verdictA,
      B: t.overview.verdictB,
      C: t.overview.verdictC,
      D: t.overview.verdictD,
      F: t.overview.verdictF,
      N: t.overview.verdictN,
    };
    return tpl[grade].replace("{n}", String(n));
  };
  const verdict = verdictFor(report.overall_grade, keyFindings.length);

  const missingImpact = impactOfMissing(report.files_missing);

  // Format timestamp — supports ISO 8601 and Unix seconds
  const formattedTime = report.timestamp
    ? (() => {
        const d = new Date(report.timestamp);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString();
        }
        const ts = parseInt(report.timestamp, 10);
        if (!isNaN(ts)) {
          const d2 = new Date(ts * 1000);
          if (!isNaN(d2.getTime())) {
            return d2.toLocaleString();
          }
        }
        return report.timestamp;
      })()
    : null;

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* 报告身份条 */}
      <div className={cn("mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b pb-3 text-td-sm", enterIf(first, "td-fade-in-down"))} style={{ borderColor: "var(--td-border)" }}>
        {isExampleData && (
          <span
            className="inline-flex items-center gap-1 text-td-xs font-medium px-2 py-1 rounded-td-sm"
            style={{ backgroundColor: "color-mix(in srgb, var(--td-warning) 12%, transparent)", color: "var(--td-warning)" }}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {t.home.exampleData}
          </span>
        )}
 <span className="flex items-center gap-1.5 text-td-text-secondary" >
          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-mono text-td-xs td-text-ellipsis max-w-[340px]" title={report.source_dir || report.prefix}>
            {report.source_dir || report.prefix}
          </span>
        </span>
        {formattedTime && (
 <span className="flex items-center gap-1.5 text-td-xs td-num text-td-text-tertiary" >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formattedTime}
          </span>
        )}
 <span className="flex items-center gap-1.5 text-td-xs td-num text-td-text-tertiary" >
          <FileWarning className="h-3.5 w-3.5" aria-hidden="true" />
          {t.overview.filesFound} {report.files_found.length} / {report.files_found.length + report.files_missing.length}
        </span>
      </div>

      {/* 结论块：大评级 + 一句话判断 + 评级依据 */}
      <section
        className={cn("td-card relative mb-4 overflow-hidden p-6", enterIf(first, "td-fade-in-up", "td-stagger-1"))}
        aria-label={t.sidebar.overallGrade}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundColor: GRADE_COLORS[report.overall_grade] }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-6">
          <GradeBadge grade={report.overall_grade} size="lg" showLabel />
          <div className="min-w-0 flex-1">
 <h2 className="text-td-xl font-semibold leading-snug tracking-tight text-td-text" >
              {t.overview.verdictPrefix}
              {verdict}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBasis(!showBasis)}
                className="inline-flex items-center gap-1 rounded-td-sm px-1.5 py-0.5 text-td-xs font-medium td-transition-fast td-focus-ring hover:bg-td-fill"
                aria-expanded={showBasis}
                aria-controls="grade-basis"
              >
                <InfoIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.overview.gradeBasis}
                <ChevronDown className={cn("h-3 w-3 td-transition", showBasis && "rotate-180")} aria-hidden="true" />
              </button>
 <span className="text-td-xs td-num text-td-text-quaternary" >
                {t.overview.evaluatedRules}: {evaluatedRules}/{totalRules}
              </span>
            </div>
          </div>
        </div>
        {showBasis && (
          <div id="grade-basis" className="relative mt-4 rounded-td border p-3 td-fade-in" style={{ borderColor: "var(--td-border)", backgroundColor: "var(--td-canvas-soft)" }}>
            <div className="flex flex-wrap gap-2">
              {report.dimensions.map((d) => (
                <button
                  key={d.dimension_id}
                  onClick={() => navigate(DIMENSION_PATHS[d.dimension_id] || "/")}
                  className="flex items-center gap-1.5 rounded-td-sm px-2 py-1 text-td-xs td-transition-fast td-focus-ring hover:bg-td-fill"
                >
                  <span
                    className="flex h-4.5 w-4.5 items-center justify-center rounded-td-sm border text-td-xs font-bold leading-none"
                    style={{
                      height: 18, width: 18,
                      backgroundColor: GRADE_BG_COLORS[d.grade],
                      color: GRADE_TEXT_COLORS[d.grade],
                      borderColor: GRADE_BORDER_COLORS[d.grade],
                    }}
                    aria-hidden="true"
                  >
                    {d.grade === "N" ? "—" : d.grade}
                  </span>
                  {d.dimension_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 必须处理：可点击、按严重度排序的待办清单 */}
      <section
        className={cn("td-card mb-4 overflow-hidden", enterIf(first, "td-fade-in-up", "td-stagger-2"))}
        style={{ borderLeft: `4px solid ${keyFindings.length > 0 ? "var(--td-warning)" : "var(--td-success)"}` }}
        aria-label={t.overview.mustHandle}
      >
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
 <h3 className="flex items-center gap-2 text-td-lg font-semibold tracking-tight text-td-text" >
              <AlertTriangle className="h-4 w-4" style={{ color: keyFindings.length > 0 ? "var(--td-warning)" : "var(--td-success)" }} aria-hidden="true" />
              {keyFindings.length > 0 ? t.overview.mustHandle : t.overview.allGood}
              {keyFindings.length > 0 && (
                <span
                  className="ml-1 inline-flex items-center rounded-td-sm px-1.5 py-0.5 text-td-xs font-medium td-num"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--td-warning) 12%, transparent)",
                    color: "var(--td-warning)",
                  }}
                >
                  {keyFindings.length}
                </span>
              )}
            </h3>
 <span className="text-td-xs text-td-text-quaternary" >
              {t.overview.findCount.replace("{n}", String(keyFindings.length))}
            </span>
          </div>

          {keyFindings.length > 0 ? (
            <div className="space-y-1.5">
              {keyFindings.map(({ dim, dimName, result }) => (
                <button
                  key={result.rule_id}
                  onClick={() => navigate(`${DIMENSION_PATHS[dim] || "/"}?rule=${encodeURIComponent(result.rule_id)}`)}
                  className="group flex w-full items-start gap-3 rounded-td border p-3 text-left td-card-hover td-focus-ring"
                  aria-label={`${result.rule_id}，${t.grades[result.grade as Grade]}：${result.summary}。${t.overview.viewDetail}`}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-td-sm border text-td-xs font-bold"
                    style={{
                      backgroundColor: GRADE_BG_COLORS[result.grade as Grade],
                      color: GRADE_TEXT_COLORS[result.grade as Grade],
                      borderColor: GRADE_BORDER_COLORS[result.grade as Grade],
                    }}
                    aria-hidden="true"
                  >
                    {result.grade}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
 <span className="font-mono text-td-xs text-td-text-tertiary" >{result.rule_id}</span>
 <span className="text-td-sm font-medium text-td-text" >{result.rule_name}</span>
 <span className="text-td-xs text-td-text-quaternary" >{dimName}</span>
                    </span>
 <span className="mt-0.5 block text-td-sm leading-relaxed text-td-text-secondary" >
                      {result.summary}
                    </span>
                  </span>
 <span className="mt-1 flex flex-shrink-0 items-center gap-0.5 text-td-xs font-medium td-transition-fast group-hover:translate-x-0.5 text-td-primary-text" >
                    {t.overview.viewDetail}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-td border p-3" style={{ borderColor: "var(--td-border)", backgroundColor: "var(--td-canvas-soft)" }}>
 <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-td-success" aria-hidden="true" />
 <p className="text-td-sm text-td-text-secondary" >{t.overview.allGood}</p>
            </div>
          )}
        </div>
      </section>

      {/* 数据完整性 / 交叉验证 / 维度评级 */}
      <div className={cn("mb-4 grid grid-cols-1 gap-4", enterIf(first, "td-fade-in-up", "td-stagger-3"))} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {/* 数据完整性：显式声明影响范围 */}
        <div className="td-section p-4">
 <h3 className="mb-2.5 flex items-center gap-2 text-td-sm font-semibold tracking-tight text-td-text" >
            <FileWarning className="h-4 w-4" style={{ color: report.files_missing.length > 0 ? "var(--td-warning)" : "var(--td-success)" }} aria-hidden="true" />
            {t.overview.dataIntegrity}
          </h3>
          {report.files_missing.length === 0 ? (
 <p className="flex items-center gap-1.5 text-td-sm text-td-success" >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {report.files_found.length} {t.overview.filesFound}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {report.files_missing.map((f) => (
                  <span key={f} className="inline-block rounded-td-sm px-1.5 py-0.5 font-mono text-td-xs" style={{ backgroundColor: "color-mix(in srgb, var(--td-warning) 10%, transparent)", color: "var(--td-warning)" }}>
                    {f}
                  </span>
                ))}
              </div>
              {missingImpact.length > 0 && (
 <p className="mt-2 text-td-xs leading-relaxed text-td-text-tertiary" >
                  {t.overview.dimsAffected}：
                  {missingImpact.map((d) => (
                    <button
                      key={d}
                      onClick={() => navigate(DIMENSION_PATHS[d] || "/")}
                      className="mx-0.5 rounded-td-sm px-1 font-mono td-focus-ring hover:underline"
                    >
                      {d}
                    </button>
                  ))}
                  <span className="text-td-text-quaternary"> {t.grades.N}</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* 交叉验证 */}
        <div className="td-section p-4">
          <div className="flex items-center justify-between">
 <h3 className="flex items-center gap-2 text-td-sm font-semibold tracking-tight text-td-text" >
 <CheckCircle2 className="h-4 w-4 text-td-success" aria-hidden="true" />
              {t.overview.crossCheck}
            </h3>
            {hasChecks ? (
              <span
                className="flex items-center gap-1 rounded-td-sm px-2 py-0.5 text-td-xs font-medium td-num"
                style={{
                  backgroundColor: allPassed ? "color-mix(in srgb, var(--td-success) 10%, transparent)" : "color-mix(in srgb, var(--td-warning) 10%, transparent)",
                  color: allPassed ? "var(--td-success)" : "var(--td-warning)",
                }}
              >
                {allPassed ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                {evaluatedPassed}/{evaluatedTotal} {t.overview.passed}
              </span>
            ) : (
 <span className="rounded-td-sm px-2 py-0.5 text-td-xs font-medium bg-td-fill-tertiary text-td-text-tertiary" >
                {t.overview.noChecks}
              </span>
            )}
          </div>
          {hasChecks && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {report.cross_checks.slice(0, 6).map((check) => (
                <span
                  key={check.check_id}
                  className="flex items-center gap-1 rounded-td-sm px-2 py-1 text-td-xs font-medium"
                  style={{
                    backgroundColor: check.passed ? "color-mix(in srgb, var(--td-success) 10%, transparent)" : "color-mix(in srgb, var(--td-error) 10%, transparent)",
                    color: check.passed ? "var(--td-success)" : "var(--td-error)",
                  }}
                >
                  {check.passed ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <XCircle className="h-3 w-3" aria-hidden="true" />}
                  <span className="font-mono">{check.check_id}</span>
                </span>
              ))}
              <button
                onClick={() => navigate("/cross-check")}
                className="ml-auto inline-flex items-center gap-0.5 rounded-td-sm px-1.5 py-1 text-td-xs font-medium td-transition-fast td-focus-ring hover:underline"
              >
                {t.overview.viewDetail}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* 八维评级（横向索引） */}
        <div className="td-section p-4">
 <h3 className="mb-2.5 text-td-sm font-semibold tracking-tight text-td-text" >
            {t.overview.dimDashboard}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {report.dimensions.map((d) => (
              <button
                key={d.dimension_id}
                onClick={() => navigate(DIMENSION_PATHS[d.dimension_id] || "/")}
                className="flex h-7 w-7 items-center justify-center rounded-td border text-td-xs font-bold td-card-hover td-focus-ring"
                style={{
                  backgroundColor: GRADE_BG_COLORS[d.grade],
                  color: GRADE_TEXT_COLORS[d.grade],
                  borderColor: GRADE_BORDER_COLORS[d.grade],
                }}
                aria-label={`${d.dimension_name}，${t.grades[d.grade]}`}
                title={d.dimension_name}
              >
                {d.grade === "N" ? "—" : d.grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 维度仪表盘（可点击入口，auto-fit 防挤压） */}
      <div className={cn("td-card mb-4 p-5", enterIf(first, "td-fade-in-up", "td-stagger-4"))}>
 <h3 className="mb-4 text-td-lg font-semibold tracking-tight text-td-text" >{t.overview.dimDashboard}</h3>
        <div className="grid grid-cols-1 gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
          {report.dimensions.map((dim) => {
            return (
              <button
                key={dim.dimension_id}
                onClick={() => navigate(DIMENSION_PATHS[dim.dimension_id] || "/")}
                className="group flex items-center gap-3 rounded-td border p-3 text-left td-card-hover td-focus-ring"
                aria-label={`${dim.dimension_name}，${t.grades[dim.grade]}`}
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-td text-td-sm font-bold border"
                  style={{
                    backgroundColor: GRADE_BG_COLORS[dim.grade],
                    color: GRADE_TEXT_COLORS[dim.grade],
                    borderColor: GRADE_BORDER_COLORS[dim.grade],
                  }}
                  aria-hidden="true"
                >
                  {dim.grade === "N" ? "—" : dim.grade}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-td-sm td-text-ellipsis text-td-text-secondary" >
                    {dim.dimension_name}
                  </div>
                </div>
 <ChevronRight className="h-4 w-4 flex-shrink-0 group-hover:translate-x-0.5 td-transition-fast text-td-text-quaternary" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 分析参数（默认收起，下沉非首屏信息） */}
      <details className={cn("td-section group", enterIf(first, "td-fade-in-up", "td-stagger-5"))}>
 <summary className="flex cursor-pointer select-none items-center gap-2 p-3.5 text-td-sm font-medium td-focus-ring rounded-td-lg hover:bg-td-fill text-td-text-secondary" aria-expanded={false}>
 <Info className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
          {t.overview.analysisParams}
 <ChevronDown className="ml-auto h-4 w-4 td-transition group-open:rotate-180 text-td-text-tertiary" aria-hidden="true" />
        </summary>
 <div className="border-t p-4 border-td-border-secondary" >
          <div className="grid grid-cols-1 gap-x-6 gap-y-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <InfoRow icon={Database} label={t.overview.iqtreeVersion} value={report.iqtree_version ?? t.overview.unknown} />
            <InfoRow icon={Activity} label={t.overview.analysisType} value={report.analysis_type ?? t.overview.unknown} />
            <InfoRow label={t.overview.nSequences} value={String(report.alignment?.n_sequences ?? "—")} />
            <InfoRow label={t.overview.nSites} value={String(report.alignment?.n_sites ?? "—")} />
            <InfoRow label={t.overview.bestModel} value={report.model_finder?.best_model ?? "—"} />
            <InfoRow label={t.overview.logLikelihood} value={report.likelihood?.log_likelihood.toFixed(4) ?? "—"} />
            <InfoRow icon={Clock} label={t.overview.runtime} value={report.runtime ? `${report.runtime.wall_clock_time.toFixed(1)}s` : "—"} />
            <InfoRow label={t.overview.filePrefix} value={report.prefix} />
          </div>
        </div>
      </details>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
 <span className="flex flex-shrink-0 items-center gap-1.5 text-td-xs text-td-text-tertiary" >
        {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
        {label}
      </span>
 <span className="text-td-xs font-medium td-text-ellipsis td-num text-td-text" >
        {value}
      </span>
    </div>
  );
}
