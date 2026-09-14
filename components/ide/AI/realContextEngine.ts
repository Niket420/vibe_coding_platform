import type { WebContainer } from "@webcontainer/api";

import {
  CodeParser,
  WebContainerFileScanner,
  ContextIndex,
  ContextWatcher,
  SymbolRetriever,
  GraphRetriever,
  LexicalRetriever,
  ContextBuilder,
  ContextEngine,
  type ContextRegion,
  type Symbol,
} from "@/contextEnginer/src";

type Session = {
  index: ContextIndex;
  engine: ContextEngine;
  ready: Promise<void>;
};

// One indexed session per live WebContainer — this app boots exactly one
// WebContainer per tab, and re-scanning/re-parsing the whole workspace on
// every chat message would be wasteful. The ContextWatcher below keeps the
// index fresh as the user edits instead.
const sessions = new WeakMap<WebContainer, Session>();

function getDependencies(index: ContextIndex) {
  return (symbol: Symbol): Symbol[] => {
    // The graph only tracks file-level "imports" edges, so a symbol's
    // dependencies are approximated as: every symbol defined in a file that
    // this symbol's file imports.
    const importedFiles = index
      .getCodeGraph()
      .getOutgoing(symbol.filePath)
      .filter((edge) => edge.type === "imports")
      .map((edge) => edge.to);

    if (importedFiles.length === 0) return [];

    const importedFileSet = new Set(importedFiles);
    return index.getSymbolIndex().getAll().filter((candidate) => importedFileSet.has(candidate.filePath));
  };
}

function createSession(webcontainer: WebContainer): Session {
  const parser = new CodeParser();
  const index = new ContextIndex(parser);

  const symbolRetriever = new SymbolRetriever(index.getSymbolIndex());
  const graphRetriever = new GraphRetriever(index.getCodeGraph());
  const lexicalRetriever = new LexicalRetriever();
  const contextBuilder = new ContextBuilder(getDependencies(index));
  const engine = new ContextEngine(symbolRetriever, graphRetriever, lexicalRetriever, contextBuilder);

  const ready = (async () => {
    const scanner = new WebContainerFileScanner();
    const sourceFiles = await scanner.scan(webcontainer, ".");
    await index.initialize(webcontainer, sourceFiles);

    // Keep the index in sync as the user edits, so later queries in the same
    // session reflect the current state of the workspace, not just the
    // snapshot taken when the panel first indexed it.
    new ContextWatcher(index).start(webcontainer);
  })();

  return { index, engine, ready };
}

function getSession(webcontainer: WebContainer): Session {
  let session = sessions.get(webcontainer);
  if (!session) {
    session = createSession(webcontainer);
    sessions.set(webcontainer, session);
  }
  return session;
}

export type RealContextResult = {
  regions: ContextRegion[];
};

/**
 * Runs the actual contextEnginer retrieval pipeline (symbol + graph + lexical
 * retrieval, merged, expanded, and token-budgeted) against the live workspace.
 */
export async function queryContextEngine(
  webcontainer: WebContainer,
  query: string,
  options: { activeFilePath?: string; maxTokens?: number } = {},
): Promise<RealContextResult> {
  const session = getSession(webcontainer);
  await session.ready;

  const filePaths = session.index.getSourceFiles().map((file) => file.path);

  const built = await session.engine.buildContext(webcontainer, query, {
    maxTokens: options.maxTokens,
    filePaths,
    activeFilePath: options.activeFilePath,
  });

  return { regions: built.regions };
}
