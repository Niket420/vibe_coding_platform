import type { WebContainer } from "@webcontainer/api";

import type { SymbolIndex } from "../index/SymbolIndex";
import type { SymbolRetriever } from "../retrieval/SymbolRetriever";
import type { GraphRetriever } from "../retrieval/GraphRetriever";
import type { LexicalRetriever } from "../retrieval/LexicalRetriever";

import { CandidateScorer } from "../retrieval/CandidateScorer";

import {
  ContextBuilder,
  type BuiltContext,
} from "./ContextBuilder";

import { ContextOptimizer } from "./ContextOptimizer";

export type ContextEngineOptions = {
  maxTokens?: number;
};

export class ContextEngine {
  private readonly candidateScorer = new CandidateScorer();
  private readonly contextOptimizer = new ContextOptimizer();

  constructor(
    private readonly symbolRetriever: SymbolRetriever,
    private readonly graphRetriever: GraphRetriever,
    private readonly lexicalRetriever: LexicalRetriever,
    private readonly symbolIndex: SymbolIndex,
    private readonly contextBuilder: ContextBuilder,
  ) {}

  async buildContext(
    webcontainer: WebContainer,
    query: string,
    options: ContextEngineOptions = {},
  ): Promise<BuiltContext> {
    const maxTokens = options.maxTokens ?? 8000;

    const symbolResults =
      await this.symbolRetriever.search(query);

    const graphResults =
      await this.graphRetriever.search(query);

    const lexicalResults =
      await this.lexicalRetriever.search(query);

    const candidates =
      this.candidateScorer.merge(
        symbolResults,
        graphResults,
        lexicalResults,
      );

    const context =
      await this.contextBuilder.build(
        webcontainer,
        candidates,
      );

    const optimized =
      this.contextOptimizer.optimize(
        context.regions,
        maxTokens,
      );

    return {
      regions: optimized.items,
    };
  }
}