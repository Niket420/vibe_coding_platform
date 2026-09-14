// Note: FileScanner (the Node `fs`-based scanner) is intentionally NOT
// exported here — this barrel is imported from browser client code, and
// bundlers pull in every export's dependencies, including Node built-ins
// that can't run in a browser tab. Import it directly from
// "./scanner/FileScanner" if you need it for server-side/CLI use.
export { WebContainerFileScanner } from "./scanner/WebContainerFileScanner";
export type { SourceFile, ParsedFile, ParsedSymbol, SourceRange } from "./types";

export { CodeParser, parseFile } from "./parser/Parser";
export { ImportResolver } from "./resolver/ImportResolver";
export { CodeGraph, type GraphEdge } from "./graph/CodeGraph";

export { SymbolIndex, type Symbol } from "./index/SymbolIndex";
export { ContextIndex } from "./index/ContextIndex";
export { ContextWatcher } from "./index/ContextWatcher";
export { FileWatcher, type FileChange } from "./watcher/FileWatcher";

export { SymbolRetriever, type SymbolResult } from "./retrieval/SymbolRetriever";
export { GraphRetriever, type GraphResult } from "./retrieval/GraphRetriever";
export { LexicalRetriever, type LexicalResult } from "./retrieval/LexicalRetriever";
export { CandidateScorer, type Candidate } from "./retrieval/CandidateScorer";

export { ContextBuilder, type ContextRegion, type BuiltContext } from "./context/ContextBuilder";
export { ContextOptimizer, type OptimizedContext } from "./context/ContextOptimizer";
export { ContextSelector, type ContextItem } from "./context/ContextSelector";
export { DependencyExpander } from "./context/DependencyExpander";
export { ContextEngine, type ContextEngineOptions } from "./context/ContextEngine";