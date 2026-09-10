import type { WebContainer } from "@webcontainer/api";

import type { Candidate } from "../retrieval/CandidateScorer";
import type { Symbol } from "../index/SymbolIndex";

export type ContextRegion = {
  path: string;
  startLine: number;
  endLine: number;
  content: string;
  score: number;
};

export type BuiltContext = {
  regions: ContextRegion[];
};

export type DependencyLookup = (
  symbol: Symbol,
) => Symbol[];

export class ContextBuilder {
  constructor(
    private readonly getDependencies: DependencyLookup,
  ) {}

  async build(
    webcontainer: WebContainer,
    candidates: Candidate[],
  ): Promise<BuiltContext> {
    const regions: ContextRegion[] = [];

    const symbols = this.collectRelevantSymbols(candidates);

    for (const { symbol, score } of symbols) {
      const content = await webcontainer.fs.readFile(
        symbol.filePath,
        "utf-8",
      );

      const lines = content.split("\n");

      const regionContent = lines
        .slice(
          symbol.range.startLine - 1,
          symbol.range.endLine,
        )
        .join("\n");

      regions.push({
        path: symbol.filePath,
        startLine: symbol.range.startLine,
        endLine: symbol.range.endLine,
        content: regionContent,
        score,
      });
    }

    return {
      regions: this.mergeRegions(regions),
    };
  }

  private collectRelevantSymbols(
    candidates: Candidate[],
  ): Array<{
    symbol: Symbol;
    score: number;
  }> {
    const result: Array<{
      symbol: Symbol;
      score: number;
    }> = [];

    const visited = new Set<string>();

    for (const candidate of candidates) {
      for (const symbol of candidate.symbols) {
        this.collectSymbol(
          symbol,
          candidate.score,
          0,
          visited,
          result,
        );
      }
    }

    return result.sort(
      (a, b) => b.score - a.score,
    );
  }

  private collectSymbol(
    symbol: Symbol,
    score: number,
    depth: number,
    visited: Set<string>,
    result: Array<{
      symbol: Symbol;
      score: number;
    }>,
  ): void {
    const key = this.getSymbolKey(symbol);

    if (visited.has(key)) {
      return;
    }

    visited.add(key);

    result.push({
      symbol,
      score,
    });

    // Don't expand dependencies forever.
    if (depth >= 2) {
      return;
    }

    const dependencies = this.getDependencies(symbol);

    for (const dependency of dependencies) {
      this.collectSymbol(
        dependency,
        score * 0.7,
        depth + 1,
        visited,
        result,
      );
    }
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

  private mergeRegions(
    regions: ContextRegion[],
  ): ContextRegion[] {
    const grouped = new Map<string, ContextRegion[]>();

    for (const region of regions) {
      const existing = grouped.get(region.path) ?? [];

      existing.push(region);

      grouped.set(region.path, existing);
    }

    const merged: ContextRegion[] = [];

    for (const fileRegions of grouped.values()) {
      const sorted = fileRegions.sort(
        (a, b) => a.startLine - b.startLine,
      );

      for (const region of sorted) {
        const previous = merged[merged.length - 1];

        if (
          previous &&
          previous.path === region.path &&
          region.startLine <= previous.endLine + 1
        ) {
          previous.endLine = Math.max(
            previous.endLine,
            region.endLine,
          );

          previous.content = `${previous.content}\n${region.content}`;
          previous.score = Math.max(
            previous.score,
            region.score,
          );

          continue;
        }

        merged.push({
          ...region,
        });
      }
    }

    return merged.sort(
      (a, b) => b.score - a.score,
    );
  }
}