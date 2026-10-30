import { useState, useId } from "react";
import { cn } from "../lib/utils";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  icon: Icon,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  // id 由 useId 生成，避免中文标题生成 id + 跨页撞 id
  const sectionId = useId();

  return (
    <div
      className={cn(
        "td-card overflow-hidden td-transition",
        className
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3.5 text-left hover:bg-td-fill td-transition-fast td-focus-ring"
        aria-expanded={open}
        aria-controls={sectionId}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="h-4 w-4" aria-hidden="true" />
          )}
 <h3 className="text-td-lg font-medium tracking-tight text-td-text" >{title}</h3>
          {badge && (
            <span
              className="inline-flex items-center rounded-td-sm px-1.5 py-0.5 text-td-xs font-medium td-num"
              style={{
                backgroundColor: "var(--td-fill-tertiary)",
                color: "var(--td-text-secondary)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 td-transition",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={sectionId}
          className="border-t p-4 td-fade-in"
          role="region"
          aria-label={title}
        >
          {children}
        </div>
      )}
    </div>
  );
}
