import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../stores/useStore";

/**
 * 全局键盘快捷键：
 * - Ctrl/Cmd + O     打开目录（跳首页并触发浏览对话框）
 * - Ctrl/Cmd + E     导出报告（打开顶栏导出菜单）
 * - Ctrl/Cmd + 1..8  跳转 D1–D8
 * - Ctrl/Cmd + ,     设置
 * - Ctrl/Cmd + F     搜索/过滤（跳转原始数据页并聚焦搜索框）
 * - Ctrl/Cmd + ←/→   诊断维度上/下篇
 * 树视图内 +/-/R/T 由 TreeView 自行处理（树获得焦点时生效）。
 */
export function useHotkeys() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      const inEditable =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable);

      // Ctrl/Cmd + ,  → 设置
      if (e.key === ",") {
        e.preventDefault();
        navigate("/settings");
        return;
      }

      switch (key) {
        case "o":
          e.preventDefault();
          navigate("/");
          useStore.getState().triggerOpenDir();
          return;
        case "e":
          e.preventDefault();
          useStore.getState().triggerExport();
          return;
        case "f":
          e.preventDefault();
          if (location.pathname !== "/raw-data") {
            navigate("/raw-data");
            // 等路由挂载后聚焦
            setTimeout(() => useStore.getState().triggerSearch(), 80);
          } else {
            useStore.getState().triggerSearch();
          }
          return;
        default:
          break;
      }

      // Ctrl/Cmd + 1..8 → D1..D8
      if (/^[1-8]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10);
        const paths = ["/alignment", "/model", "/likelihood", "/topology", "/support", "/bootstrap", "/consensus", "/runtime"];
        navigate(paths[idx - 1]);
        return;
      }

      // Ctrl/Cmd + ←/→ → 维度上/下篇（编辑框内不劫持光标移动）
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !inEditable) {
        const dimPaths = ["/alignment", "/model", "/likelihood", "/topology", "/support", "/bootstrap", "/consensus", "/runtime"];
        const currentIdx = dimPaths.indexOf(location.pathname);
        if (currentIdx !== -1) {
          e.preventDefault();
          const next =
            e.key === "ArrowRight"
              ? (currentIdx + 1) % dimPaths.length
              : (currentIdx - 1 + dimPaths.length) % dimPaths.length;
          navigate(dimPaths[next]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, location.pathname]);
}
