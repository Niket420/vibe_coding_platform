import type { WebContainer } from "@webcontainer/api";

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
  // File paths eligible for lexical (full-text) search.
  filePaths?: string[];
  // Seeds graph retrieval, e.g. the file the user currently has open.
  activeFilePath?: string;
};

export class ContextEngine {
  private readonly candidateScorer = new CandidateScorer();
  private readonly contextOptimizer = new ContextOptimizer();

  constructor(
    private readonly symbolRetriever: SymbolRetriever,
    private readonly graphRetriever: GraphRetriever,
    private readonly lexicalRetriever: LexicalRetriever,
    private readonly contextBuilder: ContextBuilder,
  ) {}

  async buildContext(
    webcontainer: WebContainer,
    query: string,
    options: ContextEngineOptions = {},
  ): Promise<BuiltContext> {
    const maxTokens = options.maxTokens ?? 8000;

    const symbolResults = this.symbolRetriever.retrieve(query);

    // Graph retrieval walks outward from a specific file — nothing to do
    // without one (e.g. the file the user currently has open).
    const graphResults = options.activeFilePath
      ? this.graphRetriever.retrieve(options.activeFilePath)
      : [];

    // Lexical retrieval scans specific files' text — nothing to search
    // without a candidate file list.
    const lexicalResults =
      options.filePaths && options.filePaths.length > 0
        ? await this.lexicalRetriever.retrieve(webcontainer, options.filePaths, query)
        : [];

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