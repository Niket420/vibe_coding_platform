import { statPath } from "@/contextEnginer/src";
import type { Tool } from "../types";
import { guardPath } from "../executor/Guardrails";

export const DeleteFileTool: Tool = {
  // Deleting is hard to reverse (no undo, no trash) — always confirmed by
  // the user first. See executor/Guardrails.ts.
  requiresApproval: true,
  definition: {
    name: "delete_file",
    description: "Delete a file or directory (recursively) from the project. Requires user approval.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Project-relative path to delete.",
        },
      },
      required: ["path"],
    },
  },
  async execute(context, args) {
    const rawPath = String(args.path ?? "");

    try {
      const path = guardPath(rawPath, context.projectRoot);
      const { exists } = await statPath(context.webcontainer, path);

      if (!exists) {
        return { success: false, output: "", error: `No such path: "${path}".` };
      }

      await context.webcontainer.fs.rm(path, { recursive: true, force: true });

      return { success: true, output: `Deleted ${path}.` };
    } catch (error) {
      return { success: false, output: "", error: error instanceof Error ? error.message : String(error) };
    }
  },
};
