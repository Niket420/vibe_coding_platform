import type { Symbol } from "../index/SymbolIndex";
import { SymbolIndex } from "../index/SymbolIndex";

/**
 * Represents a symbol found during retrieval.
 */
export type SymbolResult = {
  symbol: Symbol;
  score: number;
};

/**
 * Retrieves relevant symbols from the repository symbol index.
 *
 * This is the first structural retrieval layer of the
 * Context Engine.
 */
export class SymbolRetriever {
  constructor(
    private readonly symbolIndex: SymbolIndex,
  ) {}

  /**
   * Finds symbols whose names match the requested query.
   */
  retrieve(query: string): SymbolResult[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const results: SymbolResult[] = [];

    for (const symbol of this.symbolIndex.getAll()) {
      const normalizedName = symbol.name.toLowerCase();

      const score = this.calculateScore(
        normalizedQuery,
        normalizedName,
      );

      if (score > 0) {
        results.push({
          symbol,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculates how closely a symbol name matches the query.
   */
  private calculateScore(
    query: string,
    symbolName: string,
  ): number {
    // Exact match gets the highest score.
    if (symbolName === query) {
      return 1;
    }

    // Prefix match is highly relevant.
    if (symbolName.startsWith(query)) {
      return 0.8;
    }

    // Partial name match is less relevant.
    if (symbolName.includes(query)) {
      return 0.5;
    }

    return 0;
  }
}