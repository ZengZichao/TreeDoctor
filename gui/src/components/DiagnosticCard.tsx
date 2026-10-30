import { cn } from "../lib/utils";
import type { DiagnosticResult } from "../types";
import { GradeBadge } from "./GradeBadge";
import { useTranslation } from "../stores/useStore";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DiagnosticCardProps {
  result: DiagnosticResult;
  className?: string;
  /** 深链命中高亮（?rule= 跳转后 2s 内为 true） */
  highlight?: boolean;
}

export function DiagnosticCard({ result, className, highlight }: DiagnosticCardProps) {
  const hasRecommendation = result.recommendation.length > 0;
  const hasDetail = result.detail.length > 0;
  const hasMetrics = result.metrics && Object.keys(result.metrics).length > 0;
  const expandable = hasDetail || hasMetrics;
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Show N/A badge for unevaluated results
  const displayGrade = result.grade === null ? "N" as const : result.grade;
  const isNotEvaluated = result.evaluated === false || result.grade === null;

  return (
    <div
      className={cn(
        "td-card overflow-hidden",
        expandable && "td-card-hover",
        className
      )}
      style={highlight ? { boxShadow: "0 0 0 2px var(--td-primary-text)" } : undefined}
      role="article"
      aria-label={`${result.rule_id}: ${result.rule_name}`}
    >
      {/* Header — 整行可点击展开 */}
      <button
        type="button"
        onClick={() => expandable && setExpanded(!expanded)}
        disabled={!expandable}
        className={cn(
          "flex w-full items-start justify-between gap-3 p-4 pb-3 text-left td-focus-ring",
          expandable ? "cursor-pointer" : "cursor-default"
        )}
        aria-expanded={expandable ? expanded : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-td-sm px-1.5 py-0.5 font-mono text-td-xs font-medium"
              style={{
                backgroundColor: "var(--td-fill-tertiary)",
                color: "var(--td-text-secondary)",
              }}
            >
              {result.rule_id}
            </span>
            {isNotEvaluated && (
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
 <h4 className="text-td-sm font-medium leading-snug tracking-tight text-td-text" >
            {result.rule_name}
          </h4>
        </div>
        <GradeBadge grade={displayGrade} size="sm" />
      </button>

      {/* Body */}
      <div className="px-4 pb-3">
 <p className="text-td-sm leading-relaxed text-td-text-secondary" >
          {result.summary}
        </p>

        {expandable && (
          <div className="mt-3">
            {hasDetail && (
              <p
                className={cn(
                  "text-td-xs leading-relaxed",
                  !expanded && "line-clamp-2"
                )}
              >
                {result.detail}
              </p>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 flex items-center gap-1 rounded-td-sm px-0.5 text-td-xs font-medium td-transition-fast td-focus-ring hover:text-td-text"
              aria-expanded={expanded}
              aria-label={expanded ? t.diagnostic.collapse : t.diagnostic.expand}
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" aria-hidden="true" />{t.diagnostic.collapse}</>
              ) : (
                <><ChevronDown className="h-3 w-3" aria-hidden="true" />{t.diagnostic.expand}</>
              )}
            </button>
          </div>
        )}

        {/* Expanded metrics */}
        {expanded && hasMetrics && (
 <div className="mt-3 rounded-td p-3 td-fade-in bg-td-canvas-soft-2" role="region" aria-label={t.diagnostic.metrics}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(result.metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between">
 <span className="text-td-xs font-mono text-td-text-tertiary" >{key}</span>
 <span className="text-td-xs font-medium td-num text-td-text-secondary" >
                    {typeof value === "number" ? value.toLocaleString() : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {hasRecommendation && (
        <div
          className="border-t px-4 py-2.5"
          style={{
            borderColor: "var(--td-border-secondary)",
            background: "color-mix(in srgb, var(--td-warning) 4%, transparent)",
          }}
        >
          <div className="flex items-start gap-2">
 <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-td-warning" aria-hidden="true" />
 <p className="text-td-xs leading-relaxed text-td-text-secondary" >
 <span className="font-semibold text-td-warning" >
                {t.diagnostic.recommendation}:{" "}
              </span>
              {result.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
