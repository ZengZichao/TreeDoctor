import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile, writeFile } from "@tauri-apps/plugin-fs";

/**
 * 文件导出辅助：优先走 Tauri 原生保存对话框；
 * 浏览器开发环境下降级为 <a download> 触发下载。
 */

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function browserDownload(data: BlobPart, filename: string, mime: string): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 保存文本文件（SVG / Newick / HTML / JSON 等） */
export async function saveTextFile(
  content: string,
  defaultName: string,
  filterName: string,
  ext: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isTauri()) {
      const filePath = await save({
        title: defaultName,
        defaultPath: defaultName,
        filters: [{ name: filterName, extensions: [ext] }],
      });
      if (!filePath) return { success: false, error: "cancelled" };
      await writeTextFile(filePath, content);
      return { success: true };
    }
    browserDownload(content, defaultName, "text/plain;charset=utf-8");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** 保存二进制文件（PNG 等） */
export async function saveBinaryFile(
  data: Uint8Array,
  defaultName: string,
  filterName: string,
  ext: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isTauri()) {
      const filePath = await save({
        title: defaultName,
        defaultPath: defaultName,
        filters: [{ name: filterName, extensions: [ext] }],
      });
      if (!filePath) return { success: false, error: "cancelled" };
      await writeFile(filePath, data);
      return { success: true };
    }
    browserDownload(data.slice().buffer as ArrayBuffer, defaultName, "image/png");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
