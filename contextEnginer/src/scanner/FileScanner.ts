import fs from "node:fs/promises";
import path from "node:path";

import type { SourceFile } from "../types";

const LANGUAGE_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".cpp": "cpp",
  ".c": "c",
  ".h": "c",
  ".hpp": "cpp",
};

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

export class FileScanner {
  async scan(rootPath: string): Promise<SourceFile[]> {
    const absoluteRoot = path.resolve(rootPath);
    const files: SourceFile[] = [];

    await this.walk(absoluteRoot, absoluteRoot, files);

    return files;
  }

  private async walk(
    rootPath: string,
    currentPath: string,
    files: SourceFile[],
  ): Promise<void> {
    const entries = await fs.readdir(currentPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        await this.walk(rootPath, fullPath, files);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      const language = LANGUAGE_MAP[extension];

      if (!language) {
        continue;
      }

      const stats = await fs.stat(fullPath);

      files.push({
        path: path.relative(rootPath, fullPath),
        absolutePath: fullPath,
        extension,
        language,
        size: stats.size,
      });
    }
  }
}