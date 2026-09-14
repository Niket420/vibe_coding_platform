import type { WebContainer } from "@webcontainer/api";
import type { FileTreeNode } from "@/types/file-tree";
import type { ContextMode } from "./types";
import { queryContextEngine } from "./realContextEngine";

export type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

const MAX_CONTEXT_CHARS = 12000;
const MAX_WORKSPACE_FILES = 25;

const TEXT_FILE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "json", "css", "scss", "html", "md", "mdx",
  "yml", "yaml", "txt", "prisma", "sh", "env",
]);

function isLikelyTextFile(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_FILE_EXTENSIONS.has(ext);
}

function formatFile(path: string, content: string) {
  return `\n--- ${path} ---\n${content}`;
}

function truncate(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit)}\n... (truncated)` : text;
}

function flattenFileTree(nodes: FileTreeNode[], out: string[] = []) {
  for (const node of nodes) {
    if (node.type === "file") {
      out.push(node.path);
    } else if (node.children) {
      flattenFileTree(node.children, out);
    }
  }
  return out;
}

async function readCurrentFile(
  activeFilePath: string | undefined,
  openedFiles: OpenFile[],
  webcontainer: WebContainer | null,
) {
  if (!activeFilePath) return "";

  const openFile = openedFiles.find((file) => file.path === activeFilePath);
  if (openFile) return formatFile(activeFilePath, openFile.content);

  if (!webcontainer) return "";

  try {
    const content = await webcontainer.fs.readFile(activeFilePath, "utf-8");
    return formatFile(activeFilePath, content);
  } catch {
    return "";
  }
}

export async function gatherContext(
  mode: ContextMode,
  params: {
    webcontainer: WebContainer | null;
    openedFiles: OpenFile[];
    fileTree: FileTreeNode[];
    activeFilePath?: string;
    selectedCode?: string;
    query?: string;
  },
): Promise<string> {
  const { webcontainer, openedFiles, fileTree, activeFilePath, selectedCode, query } = params;

  if (mode === "selected-code") {
    if (selectedCode && selectedCode.trim()) {
      const header = activeFilePath ? `Selected code from ${activeFilePath}:` : "Selected code:";
      return truncate(`${header}\n${selectedCode}`, MAX_CONTEXT_CHARS);
    }
    // No active selection — fall back to the current file so the assistant still has something to work with.
    return truncate(await readCurrentFile(activeFilePath, openedFiles, webcontainer), MAX_CONTEXT_CHARS);
  }

  if (mode === "current-file") {
    return truncate(await readCurrentFile(activeFilePath, openedFiles, webcontainer), MAX_CONTEXT_CHARS);
  }

  if (mode === "open-files") {
    if (openedFiles.length === 0) return "";

    let combined = "";
    for (const file of openedFiles) {
      if (combined.length >= MAX_CONTEXT_CHARS) break;
      combined += formatFile(file.path, file.content);
    }
    return truncate(combined, MAX_CONTEXT_CHARS);
  }

  if (mode === "workspace") {
    if (!webcontainer) return "";

    // Use the real contextEnginer retrieval pipeline (symbol + graph +
    // lexical retrieval) so the assistant sees what's actually relevant to
    // the question, not just the first N files alphabetically.
    if (query && query.trim()) {
      try {
        const { regions } = await queryContextEngine(webcontainer, query, { activeFilePath });

        if (regions.length > 0) {
          let combined = "";
          for (const region of regions) {
            if (combined.length >= MAX_CONTEXT_CHARS) break;
            combined += `\n--- ${region.path} (lines ${region.startLine}-${region.endLine}) ---\n${region.content}`;
          }
          return truncate(combined, MAX_CONTEXT_CHARS);
        }
      } catch (error) {
        console.error("Context engine query failed, falling back to a plain file sample:", error);
      }
    }

    // Fallback if the engine found nothing (or errored): sample the tree directly.
    const paths = flattenFileTree(fileTree).filter(isLikelyTextFile).slice(0, MAX_WORKSPACE_FILES);
    let combined = "";

    for (const path of paths) {
      if (combined.length >= MAX_CONTEXT_CHARS) break;

      const openFile = openedFiles.find((file) => file.path === path);
      try {
        const content = openFile ? openFile.content : await webcontainer.fs.readFile(path, "utf-8");
        combined += formatFile(path, content);
      } catch {
        continue;
      }
    }
    return truncate(combined, MAX_CONTEXT_CHARS);
  }

  return "";
}
