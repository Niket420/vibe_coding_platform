import type { WebContainer } from "@webcontainer/api";

import type { ParsedFile, SourceFile } from "../types";
import { CodeParser } from "../parser/Parser";
import { SymbolIndex } from "./SymbolIndex";
import { ImportResolver } from "../resolver/ImportResolver";
import { CodeGraph } from "../graph/CodeGraph";
import type { FileChange } from "../watcher/FileWatcher";

/**
 * Coordinates the repository indexing components.
 *
 * ContextIndex keeps the parser, symbol index, import resolver,
 * and code graph synchronized with the current workspace.
 */
export class ContextIndex {
  private readonly parser: CodeParser;
  private readonly symbolIndex: SymbolIndex;
  private readonly importResolver: ImportResolver;
  private readonly codeGraph: CodeGraph;

  private readonly parsedFiles = new Map<string, ParsedFile>();
  private readonly sourceFiles = new Map<string, SourceFile>();

  constructor(parser: CodeParser) {
    this.parser = parser;
    this.symbolIndex = new SymbolIndex();
    this.importResolver = new ImportResolver();
    this.codeGraph = new CodeGraph(this.importResolver);
  }

  /**
   * Builds the initial index from all files discovered
   * by the repository scanner.
   */
  async initialize(
    webcontainer: WebContainer,
    files: SourceFile[],
  ): Promise<void> {
    // Start from a completely clean index.
    this.clear();

    // Register every source file with the resolver first.
    // This allows imports to be resolved when files are parsed.
    for (const file of files) {
      this.sourceFiles.set(file.path, file);
      this.importResolver.addFile(file);
    }

    // Parse and index every source file.
    for (const file of files) {
      await this.indexFile(webcontainer, file);
    }
  }

  /**
   * Handles a filesystem event reported by the FileWatcher.
   */
  async handleChange(
    webcontainer: WebContainer,
    change: FileChange,
  ): Promise<void> {
    // Delegate the change to the appropriate operation.
    switch (change.type) {
      case "created":
        await this.handleCreatedFile(webcontainer, change.path);
        break;

      case "modified":
        await this.handleModifiedFile(webcontainer, change.path);
        break;

      case "deleted":
        this.handleDeletedFile(change.path);
        break;
    }
  }

  /**
   * Handles creation of a new source file.
   */
  private async handleCreatedFile(
    webcontainer: WebContainer,
    filePath: string,
  ): Promise<void> {
    // Build the SourceFile metadata for the newly created file.
    const sourceFile = await this.createSourceFile(
      webcontainer,
      filePath,
    );

    // Ignore files that are not supported source files.
    if (!sourceFile) {
      return;
    }

    // Add the new file to our known files.
    this.sourceFiles.set(filePath, sourceFile);

    // Make the new file available for import resolution.
    this.importResolver.addFile(sourceFile);

    // Parse and add the file to the indexes.
    await this.indexFile(webcontainer, sourceFile);
  }

  /**
   * Handles modification of an existing source file.
   */
  private async handleModifiedFile(
    webcontainer: WebContainer,
    filePath: string,
  ): Promise<void> {
    const sourceFile = this.sourceFiles.get(filePath);

    // If we don't know the file, treat the event as a new file.
    if (!sourceFile) {
      await this.handleCreatedFile(webcontainer, filePath);
      return;
    }

    // Remove the old parsed information before rebuilding it.
    this.removeIndexedFile(filePath);

    // Parse and index the updated version.
    await this.indexFile(webcontainer, sourceFile);
  }

  /**
   * Handles deletion of a source file.
   */
  private handleDeletedFile(filePath: string): void {
    // Remove the file's symbols, graph relationships,
    // and parsed representation.
    this.removeIndexedFile(filePath);

    // Remove the file from the known source files.
    this.sourceFiles.delete(filePath);

    // Prevent future imports from resolving to the deleted file.
    this.importResolver.removeFile(filePath);
  }

  /**
   * Reads, parses, and indexes a single source file.
   */
  private async indexFile(
    webcontainer: WebContainer,
    sourceFile: SourceFile,
  ): Promise<void> {
    // Read the latest contents directly from the workspace.
    const content = await webcontainer.fs.readFile(
      sourceFile.path,
      "utf-8",
    );

    // Convert the source code into structural information.
    const parsedFile = this.parser.parse(
      {
        path: sourceFile.path,
        language: sourceFile.language,
      },
      content,
    );

    // Remember the parsed representation.
    this.parsedFiles.set(sourceFile.path, parsedFile);

    // Add symbols discovered in the file.
    this.symbolIndex.addFile(parsedFile);

    // Build graph relationships discovered in the file.
    this.codeGraph.addFile(parsedFile);
  }

  /**
   * Removes all indexed information belonging to one file.
   */
  private removeIndexedFile(filePath: string): void {
    // Remove symbols belonging to the file.
    this.symbolIndex.removeFile(filePath);

    // Remove graph edges belonging to the file.
    this.codeGraph.removeFile(filePath);

    // Remove the parsed representation.
    this.parsedFiles.delete(filePath);
  }

  /**
   * Creates SourceFile metadata for a newly created file.
   */
  private async createSourceFile(
    webcontainer: WebContainer,
    filePath: string,
  ): Promise<SourceFile | null> {
    try {
      // Ask WebContainer for information about the filesystem entry.
      const stat = await webcontainer.fs.stat(filePath);

      // Directories are not source files.
      if (stat.isDirectory()) {
        return null;
      }

      const extension = this.getExtension(filePath);
      const language = this.getLanguage(extension);

      // Ignore unsupported file types.
      if (!language) {
        return null;
      }

      return {
        path: filePath,
        absolutePath: filePath,
        extension,
        language,
        size: stat.size,
      };
    } catch {
      // The file may have disappeared between the watcher
      // event and this filesystem lookup.
      return null;
    }
  }

  /**
   * Extracts the extension from a file path.
   */
  private getExtension(filePath: string): string {
    // Get only the filename portion of the path.
    const fileName = filePath.split("/").pop() ?? "";

    const dotIndex = fileName.lastIndexOf(".");

    // Files without an extension are unsupported.
    if (dotIndex === -1) {
      return "";
    }

    return fileName.slice(dotIndex);
  }

  /**
   * Maps file extensions to parser language names.
   */
  private getLanguage(extension: string): string | null {
    // Map extensions to the languages supported by the parser.
    const languages: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "tsx",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".c": "c",
      ".cpp": "cpp",
      ".h": "c",
      ".hpp": "cpp",
    };

    return languages[extension] ?? null;
  }

  /**
   * Clears the complete repository index.
   */
  clear(): void {
    // Clear every internal data structure so the index
    // can be rebuilt from scratch.
    this.parsedFiles.clear();
    this.sourceFiles.clear();
    this.symbolIndex.clear();
    this.importResolver.clear();
    this.codeGraph.clear();
  }

  /**
   * Returns the symbol index.
   */
  getSymbolIndex(): SymbolIndex {
    return this.symbolIndex;
  }

  /**
   * Returns the code graph.
   */
  getCodeGraph(): CodeGraph {
    return this.codeGraph;
  }

  /**
   * Returns all parsed files.
   */
  getParsedFiles(): ParsedFile[] {
    return Array.from(this.parsedFiles.values());
  }

  /**
   * Returns all known source files.
   */
  getSourceFiles(): SourceFile[] {
    return Array.from(this.sourceFiles.values());
  }
}