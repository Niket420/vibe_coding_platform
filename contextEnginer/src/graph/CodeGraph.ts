import type { ParsedFile } from "../types";
import type { ImportResolver } from "../resolver/ImportResolver";

/**
 * Represents a relationship between two nodes in the repository.
 *
 * Example:
 * App.tsx --imports--> Button.tsx
 */
export type GraphEdge = {
  from: string;
  to: string;
  type: "imports" | "exports";
};

/**
 * Stores relationships between files in the repository.
 *
 * The graph uses resolved file paths so relationships point
 * to actual files instead of unresolved import strings.
 */
export class CodeGraph {
  private edges = new Map<string, GraphEdge[]>();

  constructor(private readonly importResolver: ImportResolver) {}

  /**
   * Adds the relationships discovered from a parsed file.
   */
  addFile(parsedFile: ParsedFile): void {
    const filePath = parsedFile.path;

    for (const importPath of parsedFile.imports) {
      const resolvedFile = this.importResolver.resolve(
        importPath,
        filePath,
      );

      if (!resolvedFile) {
        continue;
      }

      this.addEdge({
        from: filePath,
        to: resolvedFile.path,
        type: "imports",
      });
    }

    for (const exportName of parsedFile.exports) {
      this.addEdge({
        from: filePath,
        to: exportName,
        type: "exports",
      });
    }
  }

  /**
   * Adds a relationship to the graph while preventing duplicates.
   */
  private addEdge(edge: GraphEdge): void {
    const existing = this.edges.get(edge.from) ?? [];

    const alreadyExists = existing.some(
      (item) =>
        item.to === edge.to &&
        item.type === edge.type,
    );

    if (alreadyExists) {
      return;
    }

    existing.push(edge);

    this.edges.set(edge.from, existing);
  }

  /**
   * Returns all relationships originating from a node.
   */
  getOutgoing(filePath: string): GraphEdge[] {
    return this.edges.get(filePath) ?? [];
  }

  /**
   * Returns all relationships pointing to a node.
   */
  getIncoming(filePath: string): GraphEdge[] {
    const incoming: GraphEdge[] = [];

    for (const edges of this.edges.values()) {
      for (const edge of edges) {
        if (edge.to === filePath) {
          incoming.push(edge);
        }
      }
    }

    return incoming;
  }

  /**
   * Removes all relationships belonging to a file.
   *
   * Used when a file changes so stale relationships
   * do not remain in the graph.
   */
  removeFile(filePath: string): void {
    this.edges.delete(filePath);

    for (const [from, edges] of this.edges) {
      const remaining = edges.filter(
        (edge) => edge.to !== filePath,
      );

      if (remaining.length === 0) {
        this.edges.delete(from);
      } else {
        this.edges.set(from, remaining);
      }
    }
  }

  /**
   * Removes every relationship from the graph.
   */
  clear(): void {
    this.edges.clear();
  }

  /**
   * Returns every relationship currently stored in the graph.
   */
  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values()).flat();
  }
}