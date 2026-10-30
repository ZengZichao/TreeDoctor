import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import type { TreeNode } from "../types";
import { useTranslation } from "../stores/useStore";
import { useStore } from "../stores/useStore";
import { ZoomIn, ZoomOut, RotateCcw, Download, Image as ImageIcon, PenTool, FileText, Square, Radar, CircleDot, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { saveTextFile, saveBinaryFile } from "../lib/download";
import { toast } from "./Toast";

/**
 * 系统发育树视图：
 * - 三种布局：矩形 / 辐射 / 圆形（T 键或工具栏切换）
 * - 滚轮契约：Ctrl/⌘ + 滚轮以指针为锚缩放；裸滚轮交还页面滚动
 * - 键盘可达：+/- 缩放、方向键平移、R 重置、T 切换布局
 * - 显示密度三档：仅拓扑（悬停显示数值）/ 仅支持值 / 全部
 * - 低支持分支高亮开关
 * - 导出：PNG / SVG / Newick
 * - 配色全部走语义 token（非文本对比度 ≥3:1，随主题切换）
 */

type TreeLayout = "rect" | "radial" | "circular";
type Density = "topology" | "support" | "all";

interface TreeViewProps {
  newick: string;
  /** 受控初始布局（默认矩形） */
  initialLayout?: TreeLayout;
  height?: number;
  className?: string;
}

interface LayoutNode extends TreeNode {
  x: number;
  y: number;
  /** 极坐标：半径、角度 */
  r: number;
  angle: number;
  depth: number;
  cumulativeX: number;
  isLeaf: boolean;
  leafCount: number;
  children: LayoutNode[];
}

interface Transform {
  k: number;
  x: number;
  y: number;
}

const DEFAULT_TRANSFORM: Transform = { k: 1, x: 0, y: 0 };
const MIN_K = 0.4;
const MAX_K = 8;

// 支持值分色 — 语义 token（亮色 4.92–6.47:1，暗色 6.54–11.82:1）
const SUPPORT_COLORS: { threshold: number; color: string }[] = [
  { threshold: 0, color: "var(--td-chart-1)" },
  { threshold: 50, color: "var(--td-chart-2)" },
  { threshold: 80, color: "var(--td-chart-3)" },
  { threshold: 95, color: "var(--td-chart-4)" },
];
const SUPPORT_NULL_COLOR = "var(--td-chart-neutral)";
const DEFAULT_BRANCH_COLOR = "var(--td-axis)";

function getSupportColor(support: number | null): string {
  if (support === null) return SUPPORT_NULL_COLOR;
  for (let i = SUPPORT_COLORS.length - 1; i >= 0; i--) {
    if (support >= SUPPORT_COLORS[i].threshold) return SUPPORT_COLORS[i].color;
  }
  return SUPPORT_NULL_COLOR;
}

export function TreeView({
  newick,
  initialLayout = "rect",
  height = 500,
  className,
}: TreeViewProps) {
  const t = useTranslation();
  const theme = useStore((s) => s.theme);
  const isDark = theme === "dark";

  const [layout, setLayout] = useState<TreeLayout>(initialLayout);
  const [density, setDensity] = useState<Density>("topology");
  const [highlightLow, setHighlightLow] = useState(false);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [exportOpen, setExportOpen] = useState(false);

  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);

  // Responsive width via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 点击外部关闭导出菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const width = containerWidth;

  // 文本颜色（导出时可被解析为字面值）
  const textColor = "var(--td-text-quaternary)"; // 分支数值文本（4.89–7.3:1，随主题）
  const labelColor = "var(--td-text-secondary)"; // 叶子标签（≥4.5:1，随主题）
  const bgColor = "var(--td-bg-container)";

  // Parse newick string into tree structure
  const { layoutNodes, links, maxCumulativeX, leafCount, hasBranchLengths, lowSupportCount } = useMemo(() => {
    const root = parseNewick(newick);
    const empty = { layoutNodes: [] as LayoutNode[], links: [] as [LayoutNode, LayoutNode][], maxCumulativeX: 0, leafCount: 0, hasBranchLengths: false, lowSupportCount: 0 };
    if (!root) return empty;

    let leafIndex = 0;
    const assignLeaves = (node: TreeNode): LayoutNode => {
      const children = node.children.map(assignLeaves);
      const isLeaf = children.length === 0;
      const leafCount = isLeaf ? 1 : children.reduce((s, c) => s + c.leafCount, 0);

      let y: number;
      if (isLeaf) {
        y = leafIndex++;
      } else {
        y = children.reduce((s, c) => s + c.y, 0) / children.length;
      }

      return { ...node, children, isLeaf, leafCount, x: 0, y, r: 0, angle: 0, depth: 0, cumulativeX: 0 };
    };

    const layoutRoot = assignLeaves(root);

    let anyBranchLength = false;

    const assignX = (node: LayoutNode, cumX: number, depth: number) => {
      node.x = cumX;
      node.depth = depth;
      node.cumulativeX = cumX;
      for (const child of node.children) {
        const bl = Number.isFinite(child.branch_length) ? child.branch_length! : null;
        if (bl !== null && bl >= 0) {
          anyBranchLength = true;
          assignX(child, cumX + bl, depth + 1);
        } else {
          assignX(child, cumX + 1, depth + 1);
        }
      }
    };
    assignX(layoutRoot, 0, 0);

    // 极坐标角度：叶子按序均分圆周，内部节点取子节点均值
    const total = layoutRoot.leafCount;
    let polarLeafIdx = 0;
    const assignAngles = (node: LayoutNode) => {
      if (node.isLeaf) {
        node.angle = (polarLeafIdx / Math.max(total, 1)) * Math.PI * 2;
        polarLeafIdx++;
      } else {
        for (const child of node.children) assignAngles(child);
        node.angle = node.children.reduce((s, c) => s + c.angle, 0) / node.children.length;
      }
    };
    assignAngles(layoutRoot);

    let maxCumX = 0;
    let totalLeaves = 0;
    const allNodes: LayoutNode[] = [];
    const allLinks: [LayoutNode, LayoutNode][] = [];

    const collect = (node: LayoutNode) => {
      allNodes.push(node);
      if (node.isLeaf) totalLeaves++;
      if (node.cumulativeX > maxCumX) maxCumX = node.cumulativeX;
      for (const child of node.children) {
        allLinks.push([node, child]);
        collect(child);
      }
    };
    collect(layoutRoot);

    // 低支持分支计数（内部分支 <80）
    const lowSupportCount = allLinks.filter(([, child]) => !child.isLeaf && child.support !== null && child.support < 80).length;

    return { layoutNodes: allNodes, links: allLinks, maxCumulativeX: maxCumX, leafCount: totalLeaves, hasBranchLengths: anyBranchLength, lowSupportCount };
  }, [newick]);

  if (layoutNodes.length === 0) {
    return (
      <div ref={containerRef} className={cn("td-card flex items-center justify-center p-3", className)} style={{ height, color: "var(--td-text-tertiary)" }}>
        <p className="text-td-sm">{t.tree.parseError}</p>
      </div>
    );
  }

  const padding = 44;
  const labelSpace = 110;
  const drawWidth = Math.max(width - padding * 2 - labelSpace, 100);
  const drawHeight = height - padding * 2;
  const xScale = drawWidth / (maxCumulativeX || 1);
  const yScale = drawHeight / Math.max(leafCount - 1, 1);

  // 极坐标半径映射（中心留 24px 孔，末端留标签空间）
  const polarMaxR = Math.max(Math.min(drawWidth, drawHeight) / 2, 60);
  const r0 = 24;
  const rScale = (polarMaxR - r0) / (maxCumulativeX || 1);
  const radiusOf = (cumX: number) => r0 + cumX * rScale;

  const cx = padding + drawWidth / 2;
  const cy = padding + drawHeight / 2;

  // 坐标函数 — 极坐标半径由 cumulativeX 实时计算
  const rectX = (n: LayoutNode) => padding + n.cumulativeX * xScale;
  const rectY = (n: LayoutNode) => padding + n.y * yScale;
  const polarX = (n: LayoutNode) => cx + radiusOf(n.cumulativeX) * Math.cos(n.angle);
  const polarY = (n: LayoutNode) => cy + radiusOf(n.cumulativeX) * Math.sin(n.angle);

  // 极坐标标签位置：半径外 8px，角度带旋转可读性处理
  const leafLabel = (n: LayoutNode): { x: number; y: number; rotate: number; anchor: "start" | "end" } => {
    const lr = radiusOf(n.cumulativeX) + 8;
    let deg = (n.angle * 180) / Math.PI;
    deg = ((deg % 360) + 360) % 360;
    const flip = deg > 90 && deg < 270;
    const lx = cx + lr * Math.cos(n.angle);
    const ly = cy + lr * Math.sin(n.angle);
    return {
      x: lx,
      y: ly,
      rotate: flip ? deg + 180 : deg,
      anchor: flip ? "end" : "start",
    };
  };

  // 极坐标分支路径
  const polarPath = (parent: LayoutNode, child: LayoutNode, curved: boolean): string => {
    const px = polarX(parent);
    const py = polarY(parent);
    const cxx = polarX(child);
    const cyy = polarY(child);
    if (!curved) {
      return `M ${px} ${py} L ${cxx} ${cyy}`;
    }
    // 圆形（肘形）：沿父半径画弧到子角度，再径向连线
    const pR = radiusOf(parent.cumulativeX);
    const endX = cx + pR * Math.cos(child.angle);
    const endY = cy + pR * Math.sin(child.angle);
    let dTheta = child.angle - parent.angle;
    while (dTheta > Math.PI) dTheta -= Math.PI * 2;
    while (dTheta < -Math.PI) dTheta += Math.PI * 2;
    const sweep = dTheta > 0 ? 1 : 0;
    const largeArc = Math.abs(dTheta) > Math.PI ? 1 : 0;
    return `M ${px} ${py} A ${pR} ${pR} 0 ${largeArc} ${sweep} ${endX} ${endY} L ${cxx} ${cyy}`;
  };

  // ============ 缩放 / 平移：指针锚定 ============
  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    setTransform((tr) => {
      const k2 = Math.min(Math.max(tr.k * factor, MIN_K), MAX_K);
      if (k2 === tr.k) return tr;
      // 保持指针下的内容点不动：c = (p - t)/k → t2 = p - c*k2
      const cxp = (px - tr.x) / tr.k;
      const cyp = (py - tr.y) / tr.k;
      return { k: k2, x: px - cxp * k2, y: py - cyp * k2 };
    });
  }, []);

  const zoomCenter = useCallback((factor: number) => {
    const svg = svgRef.current;
    if (!svg) {
      setTransform((tr) => ({ ...tr, k: Math.min(Math.max(tr.k * factor, MIN_K), MAX_K) }));
      return;
    }
    const rect = svg.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }, [zoomAt]);

  // 原生 wheel 监听（non-passive）：Ctrl/⌘+滚轮缩放，裸滚轮交还页面
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        zoomAt(e.clientX, e.clientY, factor);
      }
      // 裸滚轮：不 preventDefault — 浏览器滚动最近可滚动祖先
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const d = dragRef.current;
      setTransform((tr) => ({ ...tr, x: d.tx + (e.clientX - d.x), y: d.ty + (e.clientY - d.y) }));
    }
  };

  const handleMouseUp = () => { dragRef.current = null; };

  const resetView = useCallback(() => setTransform(DEFAULT_TRANSFORM), []);

  const cycleLayout = useCallback(() => {
    setLayout((l) => (l === "rect" ? "radial" : l === "radial" ? "circular" : "rect"));
  }, []);

  // 键盘可达：+/- 缩放、方向键平移、R 重置、T 切换布局
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 30;
    switch (e.key) {
      case "+":
      case "=":
        e.preventDefault();
        zoomCenter(1.2);
        break;
      case "-":
      case "_":
        e.preventDefault();
        zoomCenter(1 / 1.2);
        break;
      case "0":
        e.preventDefault();
        resetView();
        break;
      case "r":
      case "R":
        e.preventDefault();
        resetView();
        break;
      case "t":
      case "T":
        e.preventDefault();
        cycleLayout();
        break;
      case "ArrowLeft":
        e.preventDefault();
        setTransform((tr) => ({ ...tr, x: tr.x + step }));
        break;
      case "ArrowRight":
        e.preventDefault();
        setTransform((tr) => ({ ...tr, x: tr.x - step }));
        break;
      case "ArrowUp":
        e.preventDefault();
        setTransform((tr) => ({ ...tr, y: tr.y + step }));
        break;
      case "ArrowDown":
        e.preventDefault();
        setTransform((tr) => ({ ...tr, y: tr.y - step }));
        break;
      default:
        break;
    }
  };

  // ============ 导出：SVG / PNG / Newick ============
  const buildStandaloneSvg = (): { svgText: string; width: number; height: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const w = svg.clientWidth || width;
    const h = svg.clientHeight || height;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));

    // 解析 CSS 变量为字面值（独立 SVG 文件无法解析 var()）
    const rootStyle = getComputedStyle(document.documentElement);
    const containerStyle = getComputedStyle(containerRef.current ?? document.body);
    const resolveVars = (val: string): string =>
      val.replace(/var\((--[\w-]+)\)/g, (_m, name: string) => {
        // --td-bg-container 等取容器实际渲染色
        const v = name === "--td-bg-container"
          ? containerStyle.backgroundColor
          : rootStyle.getPropertyValue(name).trim();
        return v || _m;
      });

    // 深拷贝属性替换
    const walk = (el: Element) => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.value.includes("var(")) {
          el.setAttribute(attr.name, resolveVars(attr.value));
        }
      }
      for (const child of Array.from(el.children)) walk(child);
    };
    walk(clone);

    // 背景矩形置底
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("x", "0");
    bgRect.setAttribute("y", "0");
    bgRect.setAttribute("width", String(w));
    bgRect.setAttribute("height", String(h));
    bgRect.setAttribute("fill", resolveVars(bgColor));
    clone.insertBefore(bgRect, clone.firstChild);

    const serializer = new XMLSerializer();
    return { svgText: '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone), width: w, height: h };
  };

  const handleExportSvg = async () => {
    setExportOpen(false);
    const built = buildStandaloneSvg();
    if (!built) return;
    const result = await saveTextFile(built.svgText, "tree_export.svg", "SVG", "svg");
    if (result.success) toast.success(`${t.tree.exportSuccess}: SVG`);
    else if (result.error !== "cancelled") toast.error(t.tree.exportFailed);
  };

  const handleExportPng = async () => {
    setExportOpen(false);
    const built = buildStandaloneSvg();
    if (!built) return;
    const scale = 2;
    const blob = new Blob([built.svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("svg load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = built.width * scale;
      canvas.height = built.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, built.width, built.height);
      const pngBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!pngBlob) throw new Error("png encode failed");
      const buf = new Uint8Array(await pngBlob.arrayBuffer());
      const result = await saveBinaryFile(buf, "tree_export.png", "PNG", "png");
      if (result.success) toast.success(`${t.tree.exportSuccess}: PNG`);
      else if (result.error !== "cancelled") toast.error(t.tree.exportFailed);
    } catch {
      toast.error(t.tree.exportFailed);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleExportNewick = async () => {
    setExportOpen(false);
    const result = await saveTextFile(newick.endsWith(";") ? newick : newick + ";", "tree_export.nwk", "Newick", "nwk");
    if (result.success) toast.success(`${t.tree.exportSuccess}: Newick`);
    else if (result.error !== "cancelled") toast.error(t.tree.exportFailed);
  };

  // 供 <title>/<desc> 使用（读屏 + 上下文）
  const treeDesc = `${leafCount} ${t.tree.taxa} · ${t.tree.treeHeight} ${maxCumulativeX.toFixed(3)} · ${lowSupportCount} ${t.tree.lowSupportBranches}`;
  const showBranchLengths = density === "all" && hasBranchLengths;
  const showSupportValues = density === "support" || density === "all";
  const isPolar = layout === "radial" || layout === "circular";

  const layoutOptions: { key: TreeLayout; icon: typeof Square; label: string }[] = [
    { key: "rect", icon: Square, label: t.tree.layoutRect },
    { key: "radial", icon: Radar, label: t.tree.layoutRadial },
    { key: "circular", icon: CircleDot, label: t.tree.layoutCircular },
  ];
  const densityOptions: { key: Density; label: string }[] = [
    { key: "topology", label: t.tree.densityTopology },
    { key: "support", label: t.tree.densitySupport },
    { key: "all", label: t.tree.densityAll },
  ];
  const exportOptions = [
    { key: "png", icon: ImageIcon, label: t.tree.exportPng, handler: handleExportPng },
    { key: "svg", icon: PenTool, label: t.tree.exportSvg, handler: handleExportSvg },
    { key: "nwk", icon: FileText, label: t.tree.exportNewick, handler: handleExportNewick },
  ];

  return (
    <div ref={containerRef} className={cn("td-card p-3", className)} role="figure" aria-label={`${t.tree.treeLabel} — ${treeDesc}`}>
      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Layout picker */}
 <div className="mr-1 flex items-center rounded-td border p-0.5 border-td-border" role="radiogroup" aria-label={t.tree.layout}>
            {layoutOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setLayout(key)}
                className="flex h-8 w-8 items-center justify-center rounded-td-sm td-transition-fast td-focus-ring"
                style={{
                  backgroundColor: layout === key ? "var(--td-fill-tertiary)" : undefined,
                  color: layout === key ? "var(--td-text)" : "var(--td-text-tertiary)",
                }}
                role="radio"
                aria-checked={layout === key}
                title={`${t.tree.layout}: ${label}`}
                aria-label={`${t.tree.layout}: ${label}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Density picker */}
 <div className="mr-1 flex items-center rounded-td border p-0.5 border-td-border" role="radiogroup" aria-label={t.tree.density}>
            {densityOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDensity(key)}
                className="flex h-8 items-center justify-center rounded-td-sm px-2 text-td-xs font-medium td-transition-fast td-focus-ring"
                style={{
                  backgroundColor: density === key ? "var(--td-fill-tertiary)" : undefined,
                  color: density === key ? "var(--td-text)" : "var(--td-text-tertiary)",
                }}
                role="radio"
                aria-checked={density === key}
                title={`${t.tree.density}: ${label}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Low-support highlight toggle */}
          <button
            onClick={() => setHighlightLow(!highlightLow)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-td td-transition-fast td-focus-ring",
              !highlightLow && "hover:bg-td-fill"
            )}
            style={{
              backgroundColor: highlightLow ? "color-mix(in srgb, var(--td-error) 12%, transparent)" : undefined,
              color: highlightLow ? "var(--td-error)" : "var(--td-text-tertiary)",
            }}
            role="switch"
            aria-checked={highlightLow}
            title={t.tree.highlightLow}
            aria-label={t.tree.highlightLow}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => zoomCenter(1.2)}
            className="flex h-8 w-8 items-center justify-center rounded-td hover:bg-td-fill td-transition-fast td-focus-ring"
            title="+"
            aria-label="+"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => zoomCenter(1 / 1.2)}
            className="flex h-8 w-8 items-center justify-center rounded-td hover:bg-td-fill td-transition-fast td-focus-ring"
            title="−"
            aria-label="−"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={resetView}
            className="flex h-8 w-8 items-center justify-center rounded-td hover:bg-td-fill td-transition-fast td-focus-ring"
            title={`${t.tree.reset} (R)`}
            aria-label={t.tree.reset}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
 <span className="text-td-xs font-mono td-num text-td-text-tertiary" >
            {Math.round(transform.k * 100)}%
          </span>
 <div className="h-3 w-px bg-td-border-secondary" aria-hidden="true" />
 <span className="text-td-xs font-mono td-num text-td-text-tertiary" >
            {leafCount} {t.tree.taxa}
          </span>
          {!hasBranchLengths && (
 <span className="text-td-xs px-2 py-0.5 rounded-td-sm bg-td-fill-tertiary text-td-text-tertiary" >
              {t.dimension.topologyMode}
            </span>
          )}

          {/* Export dropdown */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex h-8 items-center gap-1 rounded-td border px-2 text-td-xs font-medium td-transition-fast td-focus-ring hover:bg-td-fill"
              style={{ borderColor: "var(--td-border)", color: "var(--td-text-secondary)" }}
              aria-expanded={exportOpen}
              aria-haspopup="menu"
              aria-label={t.tree.exportTree}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {t.tree.exportTree}
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-td-lg border py-1 td-zoom-in"
                style={{ borderColor: "var(--td-border)", background: "var(--td-bg-elevated)", boxShadow: "var(--td-shadow-lg)" }}
                role="menu"
              >
                {exportOptions.map(({ key, icon: Icon, label, handler }) => (
                  <button
                    key={key}
                    onClick={handler}
                    className="flex w-full items-center gap-2 px-3 py-2 text-td-sm hover:bg-td-fill td-transition-fast td-focus-ring"
                    role="menuitem"
                  >
 <Icon className="h-4 w-4 text-td-text-tertiary" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-2 flex flex-wrap items-center gap-3 px-1">
 <span className="text-td-xs text-td-text-tertiary" >{t.tree.support}:</span>
        {SUPPORT_COLORS.map((sc, i) => {
          const nextThreshold = i < SUPPORT_COLORS.length - 1 ? SUPPORT_COLORS[i + 1].threshold : null;
          const label = sc.threshold === 0 ? (nextThreshold !== null ? `<${nextThreshold}` : "0+") : (nextThreshold !== null ? `${sc.threshold}–${nextThreshold}` : `≥${sc.threshold}`);
          return (
            <div key={i} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sc.color }} aria-hidden="true" />
 <span className="text-td-xs font-mono text-td-text-tertiary" >
                {label}
              </span>
            </div>
          );
        })}
 <span className="ml-auto hidden items-center gap-1 text-td-xs sm:flex text-td-text-quaternary" >
          {t.tree.keyboardHint}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-td"
        style={{ width: "100%", height }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={resetView}
          tabIndex={0}
          role="application"
          aria-label={`${t.tree.treeLabel} — ${treeDesc}`}
          aria-describedby="tree-kbd-hint"
          className="cursor-grab select-none outline-none active:cursor-grabbing td-focus-ring"
          style={{ backgroundColor: bgColor }}
        >
          <title>{t.tree.treeLabel}</title>
          <desc>{treeDesc}</desc>
          <g id="tree-kbd-hint" opacity={0} aria-hidden="true">
            <text fontSize={1}>{t.tree.keyboardHint}</text>
          </g>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Links */}
            {links.map(([parent, child], i) => {
              const support = child.support;
              const baseColor = getSupportColor(support);
              const isLow = highlightLow && !child.isLeaf && support !== null && support < 80;
              const px = isPolar ? polarX(parent) : rectX(parent);
              const py = isPolar ? polarY(parent) : rectY(parent);
              const cxx = isPolar ? polarX(child) : rectX(child);
              const cyy = isPolar ? polarY(child) : rectY(child);
              const d = isPolar
                ? polarPath(parent, child, layout === "circular")
                : `M ${px} ${py} L ${px} ${cyy} L ${cxx} ${cyy}`;
              const midX = (px + cxx) / 2;
              const midY = (py + cyy) / 2;
              // 极坐标下数值标注沿径向中点
              const midR = (radiusOf(parent.cumulativeX) + radiusOf(child.cumulativeX)) / 2;
              const midPx = cx + midR * Math.cos(child.angle);
              const midPy = cy + midR * Math.sin(child.angle);

              return (
                <g key={`link-${i}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={isLow ? "var(--td-chart-1)" : baseColor}
                    strokeWidth={isLow ? 2.5 : 1.5}
                    opacity={0.9}
                  >
                    <title>
                      {support !== null ? `${t.tree.support}: ${Number.isFinite(support) ? support.toFixed(0) : "—"}` : t.diagnostic.notEvaluated}
                      {Number.isFinite(child.branch_length) ? ` · length: ${child.branch_length!.toFixed(4)}` : ""}
                    </title>
                  </path>
                  {showBranchLengths && hasBranchLengths && Number.isFinite(child.branch_length) && child.branch_length! >= 0 && (
                    <text
                      x={isPolar ? midPx : midX}
                      y={isPolar ? midPy - 3 : cyy - 4}
                      fontSize={10}
                      fill={textColor}
                      textAnchor="middle"
                      fontFamily="var(--td-font-mono)"
                    >
                      {child.branch_length!.toFixed(3)}
                    </text>
                  )}
                  {showSupportValues && support !== null && !child.isLeaf && (
                    <text
                      x={isPolar ? polarX(child) + 4 * Math.cos(child.angle) : cxx + 3}
                      y={isPolar ? polarY(child) - 3 : cyy - 3}
                      fontSize={10}
                      fill={baseColor}
                      fontWeight="bold"
                      fontFamily="var(--td-font-mono)"
                    >
                      {Number.isFinite(support) ? support.toFixed(0) : ""}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {layoutNodes.map((node, i) => {
              const nx = isPolar ? polarX(node) : rectX(node);
              const ny = isPolar ? polarY(node) : rectY(node);
              const color = node.isLeaf
                ? "var(--td-chart-neutral)"
                : getSupportColor(node.support);

              return (
                <g key={`node-${i}`}>
                  <circle
                    cx={nx}
                    cy={ny}
                    r={node.isLeaf ? 3 : 4}
                    fill={color}
                    stroke={bgColor}
                    strokeWidth={1.5}
                  />
                  {node.isLeaf && node.name && (
                    isPolar ? (
                      (() => {
                        const lbl = leafLabel(node);
                        return (
                          <text
                            x={lbl.x}
                            y={lbl.y}
                            fontSize={11}
                            fill={labelColor}
                            fontFamily="var(--td-font-sans)"
                            textAnchor={lbl.anchor}
                            dominantBaseline="middle"
                            transform={`rotate(${lbl.rotate} ${lbl.x} ${lbl.y})`}
                          >
                            {node.name}
                          </text>
                        );
                      })()
                    ) : (
                      <text
                        x={nx + 6}
                        y={ny + 3.5}
                        fontSize={11}
                        fill={labelColor}
                        fontFamily="var(--td-font-sans)"
                      >
                        {node.name}
                      </text>
                    )
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

/// Simple Newick parser
function parseNewick(newick: string): TreeNode | null {
  if (!newick || newick.trim().length === 0) return null;
  const input = newick.trim().replace(/;$/, "");
  let pos = 0;

  function parseNode(): TreeNode {
    const node: TreeNode = {
      name: null,
      branch_length: null,
      support: null,
      secondary_support: null,
      children: [],
    };

    if (input[pos] === "(") {
      pos++;
      node.children.push(parseNode());
      while (input[pos] === ",") {
        pos++;
        node.children.push(parseNode());
      }
      if (input[pos] === ")") pos++;
    }

    let label = "";
    while (pos < input.length && input[pos] !== ":" && input[pos] !== "," && input[pos] !== ")" && input[pos] !== ";") {
      label += input[pos];
      pos++;
    }
    label = label.trim();

    if (label) {
      const parts = label.split("/");
      if (parts.length >= 2) {
        const primary = parseFloat(parts[0]);
        const secondary = parseFloat(parts[1]);
        node.support = Number.isFinite(primary) ? primary : null;
        node.secondary_support = Number.isFinite(secondary) ? secondary : null;
        if (parts.length >= 3) {
          node.name = parts.slice(2).join("/");
        }
      } else {
        const num = parseFloat(label);
        if (!isNaN(num) && node.children.length > 0) {
          node.support = num;
        } else {
          node.name = label;
        }
      }
    }

    if (input[pos] === ":") {
      pos++;
      let bl = "";
      while (pos < input.length && input[pos] !== "," && input[pos] !== ")" && input[pos] !== ";") {
        bl += input[pos];
        pos++;
      }
      const parsed = parseFloat(bl);
      node.branch_length = Number.isFinite(parsed) ? parsed : null;
    }

    return node;
  }

  try {
    return parseNode();
  } catch {
    return null;
  }
}
