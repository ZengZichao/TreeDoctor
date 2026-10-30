import { useEffect, useState } from "react";

/**
 * 入场动画去抖：同一 key（路由/维度）只在本会话首次挂载时
 * 播放入场动画，二次进入直接渲染，消除快速切换时的整页抖动。
 */
const visited = new Set<string>();

export function useFirstVisit(key: string): boolean {
  const [first] = useState(() => !visited.has(key));
  useEffect(() => {
    visited.add(key);
  }, [key]);
  return first;
}

/** 便捷工具：first 时返回给定的动画类，否则为空 */
export function enterIf(first: boolean, ...classes: string[]): string {
  return first ? classes.join(" ") : "";
}
