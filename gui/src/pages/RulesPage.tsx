import { useEffect, useState } from "react";
import { getRules } from "../lib/tauri";
import { useStore, useTranslation } from "../stores/useStore";
import { EXAMPLE_RULES } from "../lib/exampleData";
import type { RuleInfo } from "../types";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useFirstVisit, enterIf } from "../hooks/useFirstVisit";

export function RulesPage() {
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const isExampleData = useStore((s) => s.isExampleData);
  const t = useTranslation();
  const first = useFirstVisit("rules");

  const fetchRules = async () => {
    setLoading(true);
    setFetchError(false);

    if (isExampleData) {
      setRules(EXAMPLE_RULES);
      setLoading(false);
      return;
    }

    try {
      const r = await getRules();
      setRules(r);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
      // Do NOT silently fall back to example rules — show error state
      setFetchError(true);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [isExampleData]);

  if (loading) {
    return (
 <div className="flex h-full items-center justify-center text-td-text-tertiary" >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-td-sm">{t.rules.loading}</span>
      </div>
    );
  }

  // Error state — no silent fallback to example rules
  if (fetchError && !isExampleData) {
    return (
 <div className="flex h-full flex-col items-center justify-center gap-4 text-td-text-tertiary" >
 <AlertCircle className="h-8 w-8 text-td-error" />
        <p className="text-td-sm">{t.rules.fetchError}</p>
        <button
          onClick={fetchRules}
          className="inline-flex items-center gap-1.5 rounded-td border px-4 py-2 text-td-sm font-medium td-transition td-focus-ring hover:border-td-text-tertiary hover:text-td-text"
          style={{
            borderColor: "var(--td-border)",
            color: "var(--td-text-secondary)",
          }}
        >
          {t.rules.retry}
        </button>
      </div>
    );
  }

  // Group by dimension
  const grouped: Record<string, RuleInfo[]> = {};
  for (const rule of rules) {
    if (!grouped[rule.dimension_id]) grouped[rule.dimension_id] = [];
    grouped[rule.dimension_id].push(rule);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className={cn("mb-5", enterIf(first, "td-fade-in-down"))}>
        <div className="flex items-center gap-2">
 <BookOpen className="h-5 w-5 text-td-text-tertiary" />
 <h2 className="text-td-xl font-semibold tracking-tight td-display text-td-text" >
            {t.rules.title}
          </h2>
          <span
            className="inline-flex items-center rounded-td-sm px-2 py-0.5 text-td-xs font-medium font-mono"
            style={{
              backgroundColor: "var(--td-fill-tertiary)",
              color: "var(--td-text-secondary)",
            }}
          >
            {rules.length} {t.rules.rules}
          </span>
          {isExampleData && (
              <span
                className="inline-flex items-center rounded-td-sm px-2 py-0.5 text-td-xs font-medium"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--td-warning) 12%, transparent)",
                  color: "var(--td-warning)",
                }}
              >
                {t.rules.exampleRules}
              </span>
          )}
        </div>
      </div>

      {/* Dimension groups */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([dimId, dimRules], i) => (
          <div
            key={dimId}
            className={cn("td-card overflow-hidden", enterIf(first, "td-fade-in-up", `td-stagger-${Math.min(i + 1, 8)}`))}
          >
            {/* Group header */}
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{
                borderColor: "var(--td-border-secondary)",
                backgroundColor: "var(--td-canvas-soft-2)",
              }}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-td-sm font-semibold tracking-tight text-td-text" >
                  {dimRules[0]?.dimension_name}
                </h3>
              </div>
 <span className="text-td-xs font-mono text-td-text-tertiary" >
                {dimRules.length} {t.rules.rules}
              </span>
            </div>

            {/* Rules list */}
 <div className="divide-y border-td-border-secondary" >
              {dimRules.map((rule) => (
                <div
                  key={rule.rule_id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-td-fill td-transition-fast"
                >
                  <span
                    className="inline-flex items-center rounded-td-sm px-1.5 py-0.5 font-mono text-td-xs font-medium flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "var(--td-fill-tertiary)",
                      color: "var(--td-text-secondary)",
                    }}
                  >
                    {rule.rule_id}
                  </span>
                  <div className="flex-1 min-w-0">
 <div className="text-td-sm font-medium text-td-text" >
                      {rule.rule_name}
                    </div>
                    {rule.description && (
 <div className="mt-0.5 text-td-xs leading-relaxed text-td-text-tertiary" >
                        {rule.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
