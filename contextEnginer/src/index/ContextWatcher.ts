import type { WebContainer } from "@webcontainer/api";

import { ContextIndex } from "./ContextIndex";
import {
  FileWatcher,
  type FileChange,
} from "../watcher/FileWatcher";

/**
 * Connects the filesystem watcher to the repository index.
 *
 * FileWatcher detects changes.
 * ContextIndex processes those changes.
 */
export class ContextWatcher {
  private readonly fileWatcher: FileWatcher;

  constructor(
    private readonly contextIndex: ContextIndex,
  ) {
    this.fileWatcher = new FileWatcher();
  }

  /**
   * Starts watching the WebContainer workspace.
   */
  start(webcontainer: WebContainer): void {
    this.fileWatcher.watch(
      webcontainer,
      (change: FileChange) => {
        void this.handleChange(webcontainer, change);
      },
    );
  }

  /**
   * Passes filesystem changes to the ContextIndex.
   */
  private async handleChange(
    webcontainer: WebContainer,
    change: FileChange,
  ): Promise<void> {
    try {
      await this.contextIndex.handleChange(
        webcontainer,
        change,
      );
    } catch (error) {
      console.error(
        `Failed to process ${change.type} event for ${change.path}:`,
        error,
      );
    }
  }

  /**
   * Stops watching the workspace.
   */
  stop(): void {
    this.fileWatcher.stop();
  }
}