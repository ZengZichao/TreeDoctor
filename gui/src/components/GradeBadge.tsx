import { type Grade } from "../types";
import { cn } from "../lib/utils";
import { useTranslation } from "../stores/useStore";
import { GRADE_BG_COLORS, GRADE_TEXT_COLORS, GRADE_BORDER_COLORS } from "../types";

interface GradeBadgeProps {
  grade: Grade;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    badge: "w-5 h-5 text-td-xs rounded-td-sm",
    label: "text-td-xs",
    gap: "gap-1.5",
  },
  md: {
    badge: "w-8 h-8 text-td-sm rounded-td",
    label: "text-td-sm",
    gap: "gap-2",
  },
  lg: {
    badge: "w-14 h-14 text-2xl rounded-td-lg",
    label: "text-base",
    gap: "gap-3",
  },
};

export function GradeBadge({
  grade,
  size = "md",
  showLabel = false,
  className,
}: GradeBadgeProps) {
  const t = useTranslation();
  const labels: Record<Grade, string> = {
    A: t.grades.A,
    B: t.grades.B,
    C: t.grades.C,
    D: t.grades.D,
    F: t.grades.F,
    N: t.grades.N,
  };
  const bgColor = GRADE_BG_COLORS[grade];
  const textColor = GRADE_TEXT_COLORS[grade];
  const borderColor = GRADE_BORDER_COLORS[grade];
  const sizes = SIZE_CONFIG[size];

  // For N (Not Evaluated), use a neutral style with dashed border
  if (grade === "N") {
    return (
      <div className={cn("flex items-center", sizes.gap, className)}>
        <div
          className={cn(
            "flex items-center justify-center font-bold rounded-td-sm border border-dashed",
            sizes.badge
          )}
          role="img"
          aria-label={labels[grade]}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            borderColor: "var(--td-border-strong)",
          }}
        >
          —
        </div>
        {showLabel && (
          <span className={cn("font-medium", sizes.label)} style={{ color: "var(--td-text-tertiary)" }}>
            {labels[grade]}
          </span>
        )}
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div
          className={cn(
            "flex items-center justify-center font-bold rounded-td-lg border-2",
            sizes.badge
          )}
          role="img"
          aria-label={`${grade}: ${labels[grade]}`}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            borderColor: borderColor,
          }}
        >
          {grade}
        </div>
        {showLabel && (
          <span className={cn("font-semibold tracking-tight", sizes.label)} style={{ color: "var(--td-text)" }}>
            {labels[grade]}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      <div
        className={cn(
          "flex items-center justify-center font-bold border",
          sizes.badge
        )}
        role="img"
        aria-label={`${grade}: ${labels[grade]}`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor,
        }}
      >
        {grade}
      </div>
      {showLabel && (
        <span className={cn("font-medium", sizes.label)} style={{ color: "var(--td-text-secondary)" }}>
          {labels[grade]}
        </span>
      )}
    </div>
  );
}
