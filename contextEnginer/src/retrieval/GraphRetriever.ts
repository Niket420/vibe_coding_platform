import { CodeGraph, type GraphEdge } from "../graph/CodeGraph";

/**
 * Represents a file discovered through graph retrieval.
 */
export type GraphResult = {
  path: string;
  score: number;
  depth: number;
  relationship: GraphEdge["type"];
};

/**
 * Retrieves files structurally related to a given file
 * by traversing the CodeGraph.
 */
export class GraphRetriever {
  constructor(
    private readonly codeGraph: CodeGraph,
  ) {}

  /**
   * Finds files related to the starting file.
   *
   * By default, traversal follows outgoing edges,
   * meaning files that the starting file depends on.
   */
  retrieve(
    filePath: string,
    maxDepth = 2,
  ): GraphResult[] {
    const results: GraphResult[] = [];
    const visited = new Set<string>([filePath]);

    this.traverse(
      filePath,
      0,
      maxDepth,
      visited,
      results,
    );

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Recursively traverses the graph.
   */
  private traverse(
    currentPath: string,
    depth: number,
    maxDepth: number,
    visited: Set<string>,
    results: GraphResult[],
  ): void {
    if (depth >= maxDepth) {
      return;
    }

    const edges = this.codeGraph.getOutgoing(currentPath);

    for (const edge of edges) {
      // Ignore nodes we've already visited.
      if (visited.has(edge.to)) {
        continue;
      }

      visited.add(edge.to);

      const nextDepth = depth + 1;

      results.push({
        path: edge.to,
        depth: nextDepth,
        relationship: edge.type,
        score: this.calculateScore(nextDepth),
      });

      this.traverse(
        edge.to,
        nextDepth,
        maxDepth,
        visited,
        results,
      );
    }
  }

  /**
   * Gives closer dependencies a higher relevance score.
   */
  private calculateScore(depth: number): number {
    return 1 / depth;
  }
}