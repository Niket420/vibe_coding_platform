import type { Tool } from "../types";
import { guardPath } from "../executor/Guardrails";

const IGNORED_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);
const MAX_ENTRIES = 500;

async function walk(
  webcontainer: import("@webcontainer/api").WebContainer,
  path: string,
  recursive: boolean,
  depth: number,
  out: string[],
): Promise<void> {
  if (out.length >= MAX_ENTRIES) return;

  const entries = await webcontainer.fs.readdir(path, { withFileTypes: true });

  for (const entry of entries) {
    if (out.length >= MAX_ENTRIES) return;
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path === "." ? entry.name : `${path}/${entry.name}`;
    out.push(entry.isDirectory() ? `${fullPath}/` : fullPath);

    if (recursive && entry.isDirectory() && depth < 6) {
      await walk(webcontainer, fullPath, recursive, depth + 1, out);
    }
  }
}

export const ListDirectoryTool: Tool = {
  requiresApproval: false,
  definition: {
    name: "list_directory",
    description: "List files and directories under a path in the project.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Project-relative directory path. Defaults to the project root.",
        },
        recursive: {
          type: "boolean",
          description: "Whether to list nested directories too. Defaults to false.",
        },
      },
    },
  },
  async execute(context, args) {
    const rawPath = typeof args.path === "string" && args.path.length > 0 ? args.path : ".";
    const recursive = Boolean(args.recursive);

    try {
      const path = guardPath(rawPath, context.projectRoot);
      const out: string[] = [];
      await walk(context.webcontainer, path, recursive, 0, out);

      if (out.length === 0) {
        return { success: true, output: `${path} is empty.` };
      }

      const suffix = out.length >= MAX_ENTRIES ? `\n… (stopped at ${MAX_ENTRIES} entries)` : "";
      return { success: true, output: out.join("\n") + suffix };
    } catch (error) {
      return { success: false, output: "", error: error instanceof Error ? error.message : String(error) };
    }
  },
};
