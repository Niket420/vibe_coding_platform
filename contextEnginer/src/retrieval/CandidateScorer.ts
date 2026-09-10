import type { SymbolResult } from "./SymbolRetriever";
import type { GraphResult } from "./GraphRetriever";
import type { LexicalResult } from "./LexicalRetriever";
import type { Symbol } from "../index/SymbolIndex";

export type Candidate = {
  path: string;
  score: number;
  sources: ("symbol" | "graph" | "lexical")[];

  // Exact symbols that caused this candidate to be relevant.
  symbols: Symbol[];
};

export class CandidateScorer {
  merge(
    symbolResults: SymbolResult[],
    graphResults: GraphResult[],
    lexicalResults: LexicalResult[],
  ): Candidate[] {
    const candidates = new Map<string, Candidate>();

    for (const result of symbolResults) {
      this.addCandidate(
        candidates,
        result.symbol.filePath,
        result.score,
        "symbol",
        result.symbol,
      );
    }

    for (const result of graphResults) {
      this.addCandidate(
        candidates,
        result.path,
        result.score,
        "graph",
      );
    }

    for (const result of lexicalResults) {
      this.addCandidate(
        candidates,
        result.path,
        result.score,
        "lexical",
      );
    }

    return Array.from(candidates.values()).sort(
      (a, b) => b.score - a.score,
    );
  }

  private addCandidate(
    candidates: Map<string, Candidate>,
    path: string,
    score: number,
    source: Candidate["sources"][number],
    symbol?: Symbol,
  ): void {
    const existing = candidates.get(path);

    if (!existing) {
      candidates.set(path, {
        path,
        score,
        sources: [source],
        symbols: symbol ? [symbol] : [],
      });

      return;
    }

    existing.score += score;

    if (!existing.sources.includes(source)) {
      existing.sources.push(source);
    }

    if (
      symbol &&
      !existing.symbols.some(
        (existingSymbol) =>
          existingSymbol.name === symbol.name &&
          existingSymbol.range.startLine ===
            symbol.range.startLine,
      )
    ) {
      existing.symbols.push(symbol);
    }
  }
}