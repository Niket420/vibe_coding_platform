import type { Tool } from "../types";
import { guardPath } from "../executor/Guardrails";

export const CreateDirectoryTool: Tool = {
  requiresApproval: false,
  definition: {
    name: "create_directory",
    description: "Create a directory (and any missing parent directories) in the project.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Project-relative directory path, e.g. \"src/components\".",
        },
      },
      required: ["path"],
    },
  },
  async execute(context, args) {
    const rawPath = String(args.path ?? "");

    try {
      const path = guardPath(rawPath, context.projectRoot);
      await context.webcontainer.fs.mkdir(path, { recursive: true });

      return { success: true, output: `Created directory ${path}.` };
    } catch (error) {
      return { success: false, output: "", error: error instanceof Error ? error.message : String(error) };
    }
  },
};
