import type { AnalysisReport, Grade } from "../types";

/**
 * 报告 → 独立 HTML 文档（导出格式补齐：HTML + PDF）。
 * - HTML：保存为 .html 文件
 * - PDF：同一 HTML 注入隐藏 iframe 调用打印（WebView2 打印对话框另存为 PDF）
 */

const GRADE_COLOR: Record<Grade, { bg: string; fg: string; border: string }> = {
  A: { bg: "#cef2dc", fg: "#14532d", border: "#a7e8bf" },
  B: { bg: "#e4f4cc", fg: "#1a2e05", border: "#ceeba2" },
  C: { bg: "#faeec9", fg: "#422006", border: "#f7e19c" },
  D: { bg: "#fee0cc", fg: "#431407", border: "#fdc7a2" },
  F: { bg: "#fcd6d6", fg: "#450a0a", border: "#f9b4b4" },
  N: { bg: "#e9e9e9", fg: "#374151", border: "#d7d7d7" },
};

const GRADE_LABEL_ZH: Record<Grade, string> = {
  A: "优秀", B: "良好", C: "一般", D: "警告", F: "严重", N: "未评估",
};
const GRADE_LABEL_EN: Record<Grade, string> = {
  A: "Excellent", B: "Good", C: "Fair", D: "Warning", F: "Critical", N: "Not Evaluated",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function badge(g: Grade, lang: "zh" | "en"): string {
  const c = GRADE_COLOR[g];
  const label = lang === "zh" ? GRADE_LABEL_ZH[g] : GRADE_LABEL_EN[g];
  const glyph = g === "N" ? "—" : g;
  return `<span class="badge" style="background:${c.bg};color:${c.fg};border-color:${c.border}">${glyph} ${esc(label)}</span>`;
}

export function buildReportHtml(report: AnalysisReport, lang: "zh" | "en"): string {
  const L = lang === "zh";
  const overall = report.overall_grade;
  const findings = report.dimensions.flatMap((d) =>
    d.results
      .filter((r) => r.grade === "C" || r.grade === "D" || r.grade === "F")
      .map((r) => ({ dim: d.dimension_id, r }))
  );
  const dimRows = report.dimensions
    .map(
      (d) => `<tr>
        <td>${esc(d.dimension_name)}</td>
        <td>${badge(d.grade, lang)}</td>
        <td>${d.results.length}</td>
      </tr>`
    )
    .join("");
  const checkRows = report.cross_checks
    .map(
      (c) => `<tr>
        <td class="mono">${esc(c.check_id)}</td>
        <td>${esc(c.check_name)}</td>
        <td>${c.passed ? (L ? "✓ 通过" : "✓ Passed") : c.evaluated === false ? (L ? "— 未评估" : "— N/A") : L ? "✗ 未通过" : "✗ Failed"}</td>
        <td>${esc(c.message)}</td>
      </tr>`
    )
    .join("");

  const title = L ? "TreeDoctor 诊断报告" : "TreeDoctor Diagnostic Report";

  return `<!DOCTYPE html>
<html lang="${lang === "zh" ? "zh-CN" : "en"}">
<head>
<meta charset="utf-8">
<title>${title} — ${esc(report.prefix)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, "Microsoft YaHei", sans-serif; margin: 0; padding: 40px; color: #171717; background: #ffffff; line-height: 1.6; }
  h1 { font-size: 24px; letter-spacing: -0.02em; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 32px 0 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
  .meta { color: #525252; font-size: 13px; margin-bottom: 24px; }
  .mono { font-family: Consolas, Menlo, monospace; font-size: 12.5px; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 6px; border: 1px solid; font-size: 12.5px; font-weight: 600; }
  .hero { display: flex; align-items: center; gap: 16px; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px 24px; margin: 16px 0 8px; }
  .hero .big { font-size: 44px; font-weight: 700; border-radius: 12px; border: 2px solid; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #ebebeb; vertical-align: top; }
  th { color: #525252; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  ul { margin: 8px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  .rec { color: #431407; }
  footer { margin-top: 40px; color: #6b6b6b; font-size: 12px; border-top: 1px solid #e5e5e5; padding-top: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta mono">${esc(report.source_dir || report.prefix)} · ${esc(report.timestamp)} · IQ-TREE ${esc(report.iqtree_version ?? "—")}</div>

  <div class="hero">
    <div class="big" style="background:${GRADE_COLOR[overall].bg};color:${GRADE_COLOR[overall].fg};border-color:${GRADE_COLOR[overall].border}">${overall === "N" ? "—" : overall}</div>
    <div>
      <div style="font-size:17px;font-weight:600">${L ? "总体评级" : "Overall Grade"}：${esc(L ? GRADE_LABEL_ZH[overall] : GRADE_LABEL_EN[overall])}</div>
      <div style="color:#525252;font-size:13px">${L ? "详细评级与建议见下文各维度" : "Detailed grades and recommendations per dimension below"}</div>
    </div>
  </div>

  <h2>${L ? "维度评级" : "Dimension Grades"}</h2>
  <table>
    <thead><tr><th>${L ? "维度" : "Dimension"}</th><th>${L ? "评级" : "Grade"}</th><th>${L ? "规则数" : "Rules"}</th></tr></thead>
    <tbody>${dimRows}</tbody>
  </table>

  ${findings.length ? `<h2>${L ? "关键发现（需要处理）" : "Key Findings (action required)"}</h2>
  <ul>${findings.map(({ dim, r }) => `<li><span class="mono">${esc(r.rule_id)}</span> — <strong>${esc(r.rule_name)}</strong> ${badge(r.grade ?? "N", lang)}<br><span style="color:#404040">${esc(r.summary)}</span>${r.recommendation ? `<br><span class="rec">${L ? "建议" : "Recommendation"}：${esc(r.recommendation)}</span>` : ""} <span style="color:#6b6b6b;font-size:12px">(${dim})</span></li>`).join("")}</ul>` : ""}

  ${report.cross_checks.length ? `<h2>${L ? "交叉验证" : "Cross-Checks"}</h2>
  <table>
    <thead><tr><th>ID</th><th>${L ? "检查项" : "Check"}</th><th>${L ? "结果" : "Result"}</th><th>${L ? "说明" : "Message"}</th></tr></thead>
    <tbody>${checkRows}</tbody>
  </table>` : ""}

  <h2>${L ? "分析信息" : "Analysis Info"}</h2>
  <table>
    <tbody>
      <tr><td>${L ? "文件前缀" : "Prefix"}</td><td class="mono">${esc(report.prefix)}</td></tr>
      <tr><td>${L ? "分析类型" : "Analysis Type"}</td><td>${esc(report.analysis_type ?? "—")}</td></tr>
      <tr><td>${L ? "序列数 / 位点数" : "Sequences / Sites"}</td><td>${report.alignment ? `${report.alignment.n_sequences} / ${report.alignment.n_sites}` : "—"}</td></tr>
      <tr><td>${L ? "最优模型" : "Best Model"}</td><td class="mono">${esc(report.model_finder?.best_model ?? "—")}</td></tr>
      <tr><td>LogL</td><td class="mono">${report.likelihood ? report.likelihood.log_likelihood.toFixed(4) : "—"}</td></tr>
      <tr><td>${L ? "已找到 / 缺失文件" : "Files found / missing"}</td><td class="mono">${report.files_found.length} / ${report.files_missing.length}${report.files_missing.length ? ` (${esc(report.files_missing.join(", "))})` : ""}</td></tr>
      ${report.runtime ? `<tr><td>${L ? "运行时间 / 线程" : "Wall-clock / Threads"}</td><td class="mono">${report.runtime.wall_clock_time.toFixed(1)}s / ${report.runtime.n_threads}</td></tr>` : ""}
    </tbody>
  </table>

  <footer>${L ? "本报告由 TreeDoctor 生成 · 仅反映所提供 IQ-TREE 输出文件的质量" : "Generated by TreeDoctor · Reflects the quality of the provided IQ-TREE output files only"}</footer>
</body>
</html>`;
}

/** 将报告 HTML 注入隐藏 iframe 并调起打印（PDF 导出路径） */
export function printReportHtml(html: string): void {
  const existing = document.getElementById("td-print-frame");
  if (existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "td-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  // 等待渲染完成后调起打印
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    // 打印对话框关闭后延迟清理（无法监听，保守 60s）
    setTimeout(() => iframe.remove(), 60_000);
  }, 200);
}
