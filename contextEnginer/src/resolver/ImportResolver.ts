import path from "node:path";

import type { SourceFile } from "../types";

/**
 * Resolves import paths to actual source files in the repository.
 *
 * Example:
 *   "./Button" imported from "src/App.tsx"
 *
 *   → "src/Button.tsx"
 */
export class ImportResolver {
  private filesByPath = new Map<string, SourceFile>();

  constructor(files: SourceFile[] = []) {
    for (const file of files) {
      this.addFile(file);
    }
  }

  /**
   * Adds a source file to the resolver.
   */
  addFile(file: SourceFile): void {
    this.filesByPath.set(this.normalize(file.path), file);
  }

  /**
   * Removes a source file from the resolver.
   */
  removeFile(filePath: string): void {
    this.filesByPath.delete(this.normalize(filePath));
  }

  clear(): void {
    this.filesByPath.clear();
  }

  /**
   * Resolves an import from one source file to another source file.
   */
  resolve(importPath: string, fromFile: string): SourceFile | null {
    // Currently we only resolve relative imports.
    if (!importPath.startsWith(".")) {
      return null;
    }

    const fromDirectory = path.posix.dirname(
      this.normalize(fromFile),
    );

    const targetPath = this.normalize(
      path.posix.join(fromDirectory, importPath),
    );

    return (
      this.findExactFile(targetPath) ??
      this.findWithExtension(targetPath) ??
      this.findIndexFile(targetPath)
    );
  }

  /**
   * Finds a file whose path exactly matches the target.
   */
  private findExactFile(targetPath: string): SourceFile | null {
    return this.filesByPath.get(targetPath) ?? null;
  }

  /**
   * Finds a file by trying common source-code extensions.
   */
  private findWithExtension(targetPath: string): SourceFile | null {
    const extensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".c",
      ".cpp",
      ".h",
      ".hpp",
    ];

    for (const extension of extensions) {
      const file = this.filesByPath.get(
        `${targetPath}${extension}`,
      );

      if (file) {
        return file;
      }
    }

    return null;
  }

  /**
   * Finds an index file inside a directory.
   *
   * Example:
   *   "./components"
   *
   *   → "components/index.ts"
   */
  private findIndexFile(targetPath: string): SourceFile | null {
    const indexFiles = [
      "index.ts",
      "index.tsx",
      "index.js",
      "index.jsx",
    ];

    for (const indexFile of indexFiles) {
      const file = this.filesByPath.get(
        path.posix.join(targetPath, indexFile),
      );

      if (file) {
        return file;
      }
    }

    return null;
  }

  /**
   * Normalizes paths so Windows and POSIX paths
   * are represented consistently.
   */
  private normalize(filePath: string): string {
    return filePath
      .replace(/\\/g, "/")
      .replace(/^\.\/+/, "")
      .replace(/\/+/g, "/");
  }
}
