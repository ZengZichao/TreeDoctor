import { cn } from "../lib/utils";

type BrandLogoProps = {
  /** 尺寸档位：sm=侧边栏(32px)，lg=首页(64px) */
  size?: "sm" | "lg";
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-8 w-8 rounded-td-lg shadow-sm",
  lg: "h-16 w-16 rounded-td-xl shadow-lg",
};

/**
 * 全局统一品牌 Logo。
 * 渲染 source-of-truth 资源 /tree-icon.svg（与 EXE / 安装包 / favicon 完全一致），
 * 由单一文件驱动，确保软件内所有 Logo 与可执行文件图标永远一致，不再分叉。
 */
export function BrandLogo({ size = "sm", className }: BrandLogoProps) {
  return (
    <img
      src="/tree-icon.svg"
      alt="TreeDoctor"
      draggable={false}
      className={cn(SIZE_CLASS[size], className)}
    />
  );
}
