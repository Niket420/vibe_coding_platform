import type { WebContainer } from "@webcontainer/api";

/**
 * Represents a change detected in the workspace.
 */
export type FileChange =
  | {
      type: "created";
      path: string;
    }
  | {
      type: "modified";
      path: string;
    }
  | {
      type: "deleted";
      path: string;
    };

/**
 * Watches the WebContainer filesystem and reports
 * source-file changes to the Context Engine.
 */
export class FileWatcher {
  private unsubscribe: (() => void) | null = null;

  /**
   * Starts watching the WebContainer filesystem.
   */
  watch(
    webcontainer: WebContainer,
    onChange: (change: FileChange) => void,
  ): void {
    this.stop();

    this.unsubscribe = webcontainer.fs.watch(
      ".",
      {
        recursive: true,
      },
      (eventType, filename) => {
        if (!filename) {
          return;
        }

        const path = filename.toString().replace(/\\/g, "/");

        if (this.shouldIgnore(path)) {
          return;
        }

        if (eventType === "rename") {
          this.handleRename(webcontainer, path, onChange);
          return;
        }

        if (eventType === "change") {
          onChange({
            type: "modified",
            path,
          });
        }
      },
    );
  }

  /**
   * Stops watching the filesystem.
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Determines whether a path should be ignored by
   * the Context Engine.
   */
  private shouldIgnore(filePath: string): boolean {
    const ignoredDirectories = [
      ".git",
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
    ];

    return ignoredDirectories.some(
      (directory) =>
        filePath === directory ||
        filePath.startsWith(`${directory}/`),
    );
  }

  /**
   * A filesystem rename event can represent either
   * a file creation or a file deletion.
   *
   * We check whether the path currently exists to
   * determine which one happened.
   */
  private async handleRename(
    webcontainer: WebContainer,
    filePath: string,
    onChange: (change: FileChange) => void,
  ): Promise<void> {
    try {
      await webcontainer.fs.stat(filePath);

      onChange({
        type: "created",
        path: filePath,
      });
    } catch {
      onChange({
        type: "deleted",
        path: filePath,
      });
    }
  }
}