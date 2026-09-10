import type { Symbol } from "../index/SymbolIndex";
import type { Candidate } from "../retrieval/CandidateScorer";

export type DependencyExpanderOptions = {
  maxDepth?: number;
  maxSymbols?: number;
};

export type ExpandedSymbol = {
  symbol: Symbol;
  score: number;
  depth: number;
  reason: "direct" | "dependency";
};

/**
 * Expands relevant symbols through the repository dependency graph.
 *
 * The initial candidates represent what retrieval found directly.
 * This component adds symbols that are connected to those candidates.
 */
export class DependencyExpander {
  constructor(
    private readonly getDependencies: (
      symbol: Symbol,
    ) => Symbol[],
  ) {}

  expand(
    candidates: Candidate[],
    options: DependencyExpanderOptions = {},
  ): ExpandedSymbol[] {
    const maxDepth = options.maxDepth ?? 2;
    const maxSymbols = options.maxSymbols ?? 30;

    const result: ExpandedSymbol[] = [];
    const visited = new Set<string>();

    const queue: Array<{
      symbol: Symbol;
      score: number;
      depth: number;
      reason: "direct" | "dependency";
    }> = [];

    // Start with the symbols that retrieval explicitly found.
    for (const candidate of candidates) {
      for (const symbol of candidate.symbols) {
        queue.push({
          symbol,
          score: candidate.score,
          depth: 0,
          reason: "direct",
        });
      }
    }

    while (queue.length > 0 && result.length < maxSymbols) {
      const current = queue.shift()!;

      const key = this.getSymbolKey(current.symbol);

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      result.push({
        symbol: current.symbol,
        score: current.score,
        depth: current.depth,
        reason: current.reason,
      });

      if (current.depth >= maxDepth) {
        continue;
      }

      const dependencies = this.getDependencies(current.symbol);

      for (const dependency of dependencies) {
        const dependencyScore =
          current.score * 0.7 ** (current.depth + 1);

        queue.push({
          symbol: dependency,
          score: dependencyScore,
          depth: current.depth + 1,
          reason: "dependency",
        });
      }
    }

    return result.sort((a, b) => b.score - a.score);
  }

  private getSymbolKey(symbol: Symbol): string {
    return [
      symbol.filePath,
      symbol.name,
      symbol.type,
      symbol.range.startLine,
      symbol.range.endLine,
    ].join(":");
  }
}