import { cn } from "../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function StatCard({ label, value, subValue, icon: Icon, className }: StatCardProps) {
  return (
    // 单值统计不再用 role="group"，用带 aria-label 的普通容器
    <div
      className={cn(
        "td-card td-card-hover p-4 group",
        className
      )}
      aria-label={`${label}: ${typeof value === "number" ? value.toLocaleString() : value}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
 <div className="text-td-lg font-semibold td-num leading-tight tracking-tight text-td-text" >
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {/* 中文标签不用 font-mono（等宽字体无中文字形，回退导致基线/字重不齐） */}
 <div className="mt-1 text-td-xs td-text-ellipsis text-td-text-tertiary" >
            {label}
          </div>
          {subValue && (
 <div className="mt-0.5 text-td-xs font-medium td-num text-td-primary-text" >
              {subValue}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-td td-transition group-hover:scale-110"
            style={{
              backgroundColor: "var(--td-fill-tertiary)",
              color: "var(--td-text-tertiary)",
            }}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
