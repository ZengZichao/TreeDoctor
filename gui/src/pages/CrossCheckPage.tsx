import { useStore, useTranslation } from "../stores/useStore";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { useFirstVisit, enterIf } from "../hooks/useFirstVisit";

export function CrossCheckPage() {
  const report = useStore((s) => s.report);
  const t = useTranslation();
  const navigate = useNavigate();
  const first = useFirstVisit("cross-check");

  if (!report) {
    return (
 <div className="flex h-full flex-col items-center justify-center gap-4 text-td-text-tertiary" >
        <p className="text-td-sm">{t.crossCheck.noReport}</p>
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
  const total = report.cross_checks.length;
  const evaluatedTotal = evaluatedChecks.length;
  const hasChecks = total > 0;
  const allPassed = evaluatedTotal > 0 && evaluatedPassed === evaluatedTotal;

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className={cn("mb-5", enterIf(first, "td-fade-in-down"))}>
 <h2 className="text-td-xl font-semibold tracking-tight td-display text-td-text" >{t.crossCheck.title}</h2>
 <p className="mt-1 text-td-sm td-num text-td-text-tertiary" >
          {hasChecks ? `${evaluatedPassed}/${evaluatedTotal} ${t.crossCheck.passed}` : t.crossCheck.noChecks}
        </p>
      </div>

      {/* Summary banner — 0/0 shows "no checks" not "all passed" */}
      {hasChecks ? (
        <div
          className={cn("td-card mb-4 p-4", enterIf(first, "td-fade-in-up"))}
          style={{ borderLeft: `4px solid ${allPassed ? "var(--td-success)" : "var(--td-warning)"}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-td-lg"
              style={{
                backgroundColor: allPassed ? "color-mix(in srgb, var(--td-success) 10%, transparent)" : "color-mix(in srgb, var(--td-warning) 10%, transparent)",
                color: allPassed ? "var(--td-success)" : "var(--td-warning)",
              }}
              aria-hidden="true"
            >
              {allPassed ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div>
 <div className="text-td-lg font-semibold td-num text-td-text" >
                {evaluatedPassed}/{evaluatedTotal}
              </div>
 <div className="text-td-xs text-td-text-tertiary" >
                {allPassed ? t.crossCheck.allPassed : `${evaluatedTotal - evaluatedPassed} ${t.crossCheck.checksFailed}`}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn("td-card mb-4 p-4", enterIf(first, "td-fade-in-up"))}
          style={{ borderLeft: `4px solid var(--td-border-strong)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-td-lg"
              style={{
                backgroundColor: "var(--td-fill-tertiary)",
                color: "var(--td-text-tertiary)",
              }}
              aria-hidden="true"
            >
              <Info className="h-6 w-6" />
            </div>
            <div>
 <div className="text-td-sm font-semibold text-td-text" >
                {t.crossCheck.noChecks}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check items */}
      {hasChecks && (
        <div className="space-y-2">
          {report.cross_checks.map((check, i) => {
            const isEvaluated = check.evaluated !== false;
            const severityLabel = check.severity === "info" ? t.crossCheck.info : check.severity === "warning" ? t.crossCheck.warning : check.severity === "error" ? t.crossCheck.error : check.severity;
            return (
            <div
              key={check.check_id}
              className={cn("td-card overflow-hidden", enterIf(first, "td-fade-in-up", `td-stagger-${Math.min(i + 1, 8)}`))}
              style={{
                borderLeft: `4px solid ${!isEvaluated ? "var(--td-border-strong)" : check.passed ? "color-mix(in srgb, var(--td-success) 40%, transparent)" : "color-mix(in srgb, var(--td-error) 40%, transparent)"}`,
              }}
              role="article"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-td"
                    style={{
                      backgroundColor: !isEvaluated ? "var(--td-fill-tertiary)" : check.passed ? "color-mix(in srgb, var(--td-success) 10%, transparent)" : "color-mix(in srgb, var(--td-error) 10%, transparent)",
                      color: !isEvaluated ? "var(--td-text-tertiary)" : check.passed ? "var(--td-success)" : "var(--td-error)",
                    }}
                    aria-hidden="true"
                  >
                    {!isEvaluated ? (
                      <Info className="h-4 w-4" />
                    ) : check.passed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
 <span className="font-mono text-td-xs text-td-text-tertiary" >{check.check_id}</span>
 <h3 className="text-td-sm font-medium tracking-tight text-td-text" >{check.check_name}</h3>
                      {isEvaluated && !check.passed && (
                        <span
                          className="inline-flex items-center rounded-td-sm px-1.5 py-0.5 text-td-xs font-medium tracking-wider"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--td-error) 10%, transparent)",
                            color: "var(--td-error)",
                          }}
                        >
                          {severityLabel}
                        </span>
                      )}
                      {!isEvaluated && (
                        <span
                          className="inline-flex items-center rounded-td-sm px-1.5 py-0.5 text-td-xs font-medium"
                          style={{
                            backgroundColor: "var(--td-fill-tertiary)",
                            color: "var(--td-text-tertiary)",
                          }}
                        >
                          {t.diagnostic.notEvaluated}
                        </span>
                      )}
                    </div>
 <p className="text-td-sm leading-relaxed text-td-text-secondary" >{check.message}</p>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
