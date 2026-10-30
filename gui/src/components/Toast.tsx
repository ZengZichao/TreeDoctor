import { useEffect } from "react";
import { create } from "zustand";

/**
 * 全局 Toast 队列：
 * - 右上角堆叠，逐条独立定时清除（cleanup 安全）
 * - 错误类 toast 使用 role="alert"（立即播报），普通类 role="status"
 */

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (type: ToastType, message: string, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
const TIMERS = new Map<number, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (type, message, durationMs = 3500) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    const timer = setTimeout(() => {
      get().dismiss(id);
      TIMERS.delete(id);
    }, durationMs);
    TIMERS.set(id, timer);
  },
  dismiss: (id) => {
    const timer = TIMERS.get(id);
    if (timer) {
      clearTimeout(timer);
      TIMERS.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** 命令式 API：任意模块可直接调用 */
export const toast = {
  success: (msg: string) => useToastStore.getState().push("success", msg),
  error: (msg: string) => useToastStore.getState().push("error", msg),
  info: (msg: string) => useToastStore.getState().push("info", msg),
};

/** 全局 Toast 宿主 — 挂载于 App 根部 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  // 卸载时清理所有未决定时器
  useEffect(() => {
    const timers = TIMERS;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          aria-live={t.type === "error" ? "assertive" : "polite"}
          className="td-zoom-in pointer-events-auto flex items-start gap-2 rounded-td-lg border px-4 py-3"
          style={{
            borderColor:
              t.type === "error"
                ? "color-mix(in srgb, var(--td-error) 35%, transparent)"
                : "var(--td-border)",
            backgroundColor: "var(--td-bg-elevated)",
            boxShadow: "var(--td-shadow-lg)",
          }}
        >
          <span
            className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
            style={{
              backgroundColor:
                t.type === "success"
                  ? "var(--td-success)"
                  : t.type === "error"
                    ? "var(--td-error)"
                    : "var(--td-info)",
            }}
            aria-hidden="true"
          />
 <span className="flex-1 text-td-sm leading-snug text-td-text" >
            {t.message}
          </span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-td-xs td-transition-fast td-focus-ring rounded-td-sm"
            aria-label="dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
