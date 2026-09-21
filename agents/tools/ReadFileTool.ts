import { statPath } from "@/contextEnginer/src";
import type { Tool } from "../types";
import { guardPath, Limits } from "../executor/Guardrails";

export const ReadFileTool: Tool = {
  requiresApproval: false,
  definition: {
    name: "read_file",
    description: "Read the contents of a file in the project.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Project-relative path to the file, e.g. \"src/App.tsx\".",
        },
      },
      required: ["path"],
    },
  },
  async execute(context, args) {
    const rawPath = String(args.path ?? "");

    try {
      const path = guardPath(rawPath, context.projectRoot);
      const { exists, isDirectory } = await statPath(context.webcontainer, path);

      if (!exists) {
        return { success: false, output: "", error: `No such file: "${path}".` };
      }
      if (isDirectory) {
        return { success: false, output: "", error: `"${path}" is a directory, not a file. Use list_directory instead.` };
      }

      const content = await context.webcontainer.fs.readFile(path, "utf-8");
      const truncated = content.length > Limits.MAX_READ_BYTES;
      const body = truncated ? content.slice(0, Limits.MAX_READ_BYTES) : content;

      return {
        success: true,
        output: truncated
          ? `${body}\n… (truncated, file is ${content.length} characters)`
          : body,
      };
    } catch (error) {
      return { success: false, output: "", error: error instanceof Error ? error.message : String(error) };
    }
  },
};
