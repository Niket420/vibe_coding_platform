import type { WebContainer } from "@webcontainer/api";

import type { SourceFile } from "../types";
import { LANGUAGE_MAP, IGNORED_DIRECTORIES } from "./languageMap";

/**
 * Scans the live WebContainer filesystem — this app's actual workspace only
 * exists in the browser tab, so indexing has to walk `webcontainer.fs`
 * instead of a real OS filesystem (see FileScanner for the Node equivalent).
 */
export class WebContainerFileScanner {
  async scan(webcontainer: WebContainer, rootPath = "."): Promise<SourceFile[]> {
    const files: SourceFile[] = [];
    await this.walk(webcontainer, rootPath, files);
    return files;
  }

  private async walk(
    webcontainer: WebContainer,
    currentPath: string,
    files: SourceFile[],
  ): Promise<void> {
    const entries = await webcontainer.fs.readdir(currentPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = currentPath === "." ? entry.name : `${currentPath}/${entry.name}`;

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        await this.walk(webcontainer, fullPath, files);
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = this.getExtension(entry.name);
      const language = LANGUAGE_MAP[extension];
      if (!language) continue;

      files.push({
        path: fullPath,
        absolutePath: fullPath,
        extension,
        language,
        size: 0,
      });
    }
  }

  private getExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    return dotIndex === -1 ? "" : fileName.slice(dotIndex).toLowerCase();
  }
}
