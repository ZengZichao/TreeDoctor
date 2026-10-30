import {
  LayoutDashboard,
  AlignHorizontalJustifyCenter,
  Boxes,
  TrendingUp,
  GitBranch,
  ShieldCheck,
  Repeat,
  GitMerge,
  Clock,
  FileSearch,
  CheckCircle2,
  TreePine,
  ChevronLeft,
  BookOpen,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";
import { useStore, useTranslation } from "../stores/useStore";
import type { Grade } from "../types";
import { GRADE_BG_COLORS, GRADE_TEXT_COLORS, GRADE_BORDER_COLORS } from "../types";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  dim?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const report = useStore((s) => s.report);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const t = useTranslation();

  const NAV_GROUPS: NavGroup[] = [
    {
      group: t.nav.overview,
      items: [
        { path: "/", label: t.nav.home, icon: TreePine },
        { path: "/overview", label: t.nav.overview, icon: LayoutDashboard },
      ],
    },
    {
      group: t.sidebar.dimensions || "Dimensions",
      items: [
        { path: "/alignment", label: t.nav.alignment, icon: AlignHorizontalJustifyCenter, dim: "D1" },
        { path: "/model", label: t.nav.model, icon: Boxes, dim: "D2" },
        { path: "/likelihood", label: t.nav.likelihood, icon: TrendingUp, dim: "D3" },
        { path: "/topology", label: t.nav.topology, icon: GitBranch, dim: "D4" },
        { path: "/support", label: t.nav.support, icon: ShieldCheck, dim: "D5" },
        { path: "/bootstrap", label: t.nav.bootstrap, icon: Repeat, dim: "D6" },
        { path: "/consensus", label: t.nav.consensus, icon: GitMerge, dim: "D7" },
        { path: "/runtime", label: t.nav.runtime, icon: Clock, dim: "D8" },
      ],
    },
    {
      group: t.sidebar.tools || "Tools",
      items: [
        { path: "/cross-check", label: t.nav.crossCheck, icon: CheckCircle2 },
        { path: "/raw-data", label: t.nav.rawData, icon: FileSearch },
        { path: "/rules", label: t.nav.rules, icon: BookOpen },
        { path: "/settings", label: t.nav.settings, icon: SettingsIcon },
      ],
    },
  ];

  // Get dimension grades from report
  const dimGrades: Record<string, Grade> = {};
  if (report) {
    for (const dim of report.dimensions) {
      dimGrades[dim.dimension_id] = dim.grade;
    }
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r td-transition flex-shrink-0",
        collapsed ? "w-[56px]" : "w-[240px]"
      )}
      style={{ borderColor: "var(--td-border)", backgroundColor: "var(--td-bg-container)" }}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 flex-shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <BrandLogo size="sm" />
          {!collapsed && (
            <div className="flex flex-col">
 <span className="text-td-sm font-semibold leading-tight tracking-tight text-td-text" >
                TreeDoctor
              </span>
 <span className="text-td-xs leading-tight text-td-text-tertiary" >
                {t.appTagline}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="mb-4">
            {/* Group label */}
            {!collapsed && group.group && (
 <div className="mb-1.5 px-3 text-td-xs font-medium uppercase tracking-wider text-td-text-quaternary" >
                {group.group}
              </div>
            )}

            {/* Group items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                const grade = item.dim ? dimGrades[item.dim] : undefined;

                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={cn(
                      "group relative flex w-full items-center gap-2.5 rounded-td px-2.5 py-2 text-td-sm td-transition td-focus-ring",
                      collapsed && "justify-center",
                      isActive
                        ? "font-medium"
                        : "hover:bg-td-fill"
                    )}
                    style={{
                      backgroundColor: isActive ? "var(--td-fill-tertiary)" : undefined,
                      color: isActive ? "var(--td-text)" : "var(--td-text-secondary)",
                    }}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={grade ? `${item.label}，${t.sidebar.overallGrade} ${grade === "N" ? t.grades.N : grade}` : item.label}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 td-transition",
                      )}
                      style={{
                        color: isActive ? "var(--td-text)" : "var(--td-text-tertiary)",
                      }}
                      aria-hidden="true"
                    />
                    {!collapsed && (
                      <span className="flex-1 text-left text-td-sm td-text-ellipsis">
                        {item.label}
                      </span>
                    )}
                    {/* 评级徽章：字母形式，不以颜色为唯一载体 */}
                    {!collapsed && grade && (
                      <span
                        className="flex h-4.5 min-w-[18px] flex-shrink-0 items-center justify-center rounded-td-sm border px-0.5 text-td-xs font-bold leading-none"
                        style={{
                          height: 18,
                          backgroundColor: GRADE_BG_COLORS[grade],
                          color: GRADE_TEXT_COLORS[grade],
                          borderColor: GRADE_BORDER_COLORS[grade],
                        }}
                        aria-hidden="true"
                      >
                        {grade === "N" ? "—" : grade}
                      </span>
                    )}
                    {collapsed && grade && (
                      <span
                        className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border text-[8px] font-bold leading-none"
                        style={{
                          backgroundColor: GRADE_BG_COLORS[grade],
                          color: GRADE_TEXT_COLORS[grade],
                          borderColor: GRADE_BORDER_COLORS[grade],
                        }}
                        aria-hidden="true"
                      >
                        {grade === "N" ? "—" : grade}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "flex h-8 flex-shrink-0 items-center justify-center border-t hover:bg-td-fill td-transition td-focus-ring",
          collapsed ? "w-full" : "w-full gap-2"
        )}
        style={{ borderColor: "var(--td-border)", color: "var(--td-text-tertiary)" }}
        title={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        aria-label={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        aria-expanded={!collapsed}
      >
        <ChevronLeft
          className={cn("h-4 w-4 td-transition", collapsed && "rotate-180")}
          aria-hidden="true"
        />
        {!collapsed && (
          <span className="text-td-xs">{t.sidebar.collapse}</span>
        )}
      </button>

      {/* Overall Grade Footer */}
      {!collapsed && report && (
        <div
          className="flex-shrink-0 border-t px-3 py-2.5"
        >
 <div className="text-td-xs uppercase tracking-wider text-td-text-quaternary" >
            {t.sidebar.overallGrade}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-td text-td-xs font-bold border"
              style={{
                backgroundColor: GRADE_BG_COLORS[report.overall_grade],
                color: GRADE_TEXT_COLORS[report.overall_grade],
                borderColor: GRADE_BORDER_COLORS[report.overall_grade],
              }}
              aria-label={`${t.sidebar.overallGrade}: ${report.overall_grade}`}
            >
              {report.overall_grade === "N" ? "—" : report.overall_grade}
            </span>
 <span className="text-td-xs font-medium text-td-text-secondary" >
              {t.grades[report.overall_grade]}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
