import fs from "node:fs/promises";
import path from "node:path";

import type { SourceFile } from "../types";
import { LANGUAGE_MAP, IGNORED_DIRECTORIES } from "./languageMap";

/**
 * Scans a real OS filesystem. This app's workspace only exists inside a
 * browser-side WebContainer, so this scanner isn't reachable from the running
 * app — see WebContainerFileScanner for the one actually used at runtime.
 * Kept for potential server-side/CLI use of this engine against a real disk.
 */
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