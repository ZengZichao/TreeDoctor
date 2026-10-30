import { create } from "zustand";
import type { AnalysisReport, RuleInfo } from "../types";
import type { Language } from "../lib/i18n";
import { translations } from "../lib/i18n";

type AnalysisStatus = "idle" | "validating" | "analyzing" | "complete" | "error";
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** 分析阶段定义 */
export interface AnalysisStageState {
  /** 读取文件（含校验结果：发现的文件数，前端已知，属确定性部分） */
  read: "pending" | "active" | "done";
  /** 解析 */
  parse: "pending" | "active" | "done";
  /** 交叉验证 */
  cross: "pending" | "active" | "done";
  /** 生成评级 */
  grade: "pending" | "active" | "done";
}

interface AppState {
  report: AnalysisReport | null;
  analysisStatus: AnalysisStatus;
  error: string | null;
  rules: RuleInfo[];
  selectedDimension: string | null;
  sidebarCollapsed: boolean;
  language: Language;
  /** 用户偏好主题：light / dark / system */
  theme: Theme;
  /** 实际生效主题（system 时由 prefers-color-scheme 解析） */
  resolvedTheme: ResolvedTheme;
  isExampleData: boolean;

  /** 屏幕阅读器播报（aria-live，路由切换/分析完成时更新） */
  announcement: string | null;

  /** 跨组件一次性事件 tick（全局快捷键触发用） */
  openDirTick: number;
  exportTick: number;
  searchTick: number;

  /** 分析阶段状态机 + 开始时间戳（ms） */
  stages: AnalysisStageState;
  analysisStartedAt: number | null;
  /** 取消标记：取消后忽略仍在途的分析结果 */
  analysisCancelled: boolean;

  setReport: (report: AnalysisReport | null) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
  setError: (error: string | null) => void;
  setRules: (rules: RuleInfo[]) => void;
  setSelectedDimension: (dim: string | null) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setIsExampleData: (val: boolean) => void;
  announce: (msg: string | null) => void;
  triggerOpenDir: () => void;
  triggerExport: () => void;
  triggerSearch: () => void;
  setStage: (stage: keyof AnalysisStageState, value: AnalysisStageState[keyof AnalysisStageState]) => void;
  setAllStages: (value: AnalysisStageState[keyof AnalysisStageState]) => void;
  setAnalysisStartedAt: (t: number | null) => void;
  setAnalysisCancelled: (v: boolean) => void;
  reset: () => void;
}

const getStoredTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("treedoctor-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  }
  return "system";
};

const resolveSystemTheme = (): ResolvedTheme => {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const getInitialTheme = (): Theme => getStoredTheme();

const getInitialResolvedTheme = (): ResolvedTheme => {
  const stored = getStoredTheme();
  return stored === "system" ? resolveSystemTheme() : stored;
};

const getInitialLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("treedoctor-language");
    if (stored === "zh" || stored === "en") {
      return stored;
    }
  }
  return "zh";
};

const applyThemeClass = (resolved: ResolvedTheme) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }
};

const persistTheme = (theme: Theme, resolved: ResolvedTheme) => {
  localStorage.setItem("treedoctor-theme", theme);
  applyThemeClass(resolved);
};

// 跟随系统主题：监听系统偏好变化（仅当偏好为 system 时生效）
if (typeof window !== "undefined") {
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      const stored = getStoredTheme();
      if (stored === "system") {
        const resolved: ResolvedTheme = e.matches ? "dark" : "light";
        applyThemeClass(resolved);
        useStore.setState({ resolvedTheme: resolved });
      }
    });
  } catch {
    // 旧引擎不支持 addEventListener on MediaQueryList — 忽略
  }
}

export const useStore = create<AppState>((set, get) => ({
  report: null,
  analysisStatus: "idle",
  error: null,
  rules: [],
  selectedDimension: null,
  sidebarCollapsed: false,
  language: getInitialLanguage(),
  theme: getInitialTheme(),
  resolvedTheme: getInitialResolvedTheme(),
  isExampleData: false,

  announcement: null,
  openDirTick: 0,
  exportTick: 0,
  searchTick: 0,
  stages: { read: "pending", parse: "pending", cross: "pending", grade: "pending" },
  analysisStartedAt: null,
  analysisCancelled: false,

  setReport: (report) => set({ report }),
  setAnalysisStatus: (analysisStatus) => set({ analysisStatus }),
  setError: (error) => set({ error }),
  setRules: (rules) => set({ rules }),
  setSelectedDimension: (selectedDimension) => set({ selectedDimension }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setLanguage: (language) => {
    localStorage.setItem("treedoctor-language", language);
    set({ language });
  },
  toggleLanguage: () => {
    const current = get().language;
    const next: Language = current === "zh" ? "en" : "zh";
    localStorage.setItem("treedoctor-language", next);
    set({ language: next });
  },
  setTheme: (theme) => {
    const resolved: ResolvedTheme = theme === "system" ? resolveSystemTheme() : theme;
    persistTheme(theme, resolved);
    set({ theme, resolvedTheme: resolved });
  },
  toggleTheme: () => {
    // 在 light/dark 间直接切换；当前为 system 时以实际生效主题为基准
    const current = get().resolvedTheme;
    const next: Theme = current === "light" ? "dark" : "light";
    persistTheme(next, next);
    set({ theme: next, resolvedTheme: next });
  },
  setIsExampleData: (val) => set({ isExampleData: val }),
  announce: (announcement) => set({ announcement }),
  triggerOpenDir: () => set((s) => ({ openDirTick: s.openDirTick + 1 })),
  triggerExport: () => set((s) => ({ exportTick: s.exportTick + 1 })),
  triggerSearch: () => set((s) => ({ searchTick: s.searchTick + 1 })),
  setStage: (stage, value) =>
    set((s) => ({ stages: { ...s.stages, [stage]: value } })),
  setAllStages: (value) =>
    set({ stages: { read: value, parse: value, cross: value, grade: value } }),
  setAnalysisStartedAt: (analysisStartedAt) => set({ analysisStartedAt }),
  setAnalysisCancelled: (analysisCancelled) => set({ analysisCancelled }),
  reset: () =>
    set({
      report: null,
      analysisStatus: "idle",
      error: null,
      selectedDimension: null,
      isExampleData: false,
      stages: { read: "pending", parse: "pending", cross: "pending", grade: "pending" },
      analysisStartedAt: null,
      analysisCancelled: false,
    }),
}));

/// Selector helper: get current translation object
export function useTranslation() {
  return translations[useStore((s) => s.language)];
}
