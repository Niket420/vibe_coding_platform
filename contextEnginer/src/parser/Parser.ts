import TSParser from "web-tree-sitter";
import type { ParsedFile, ParsedSymbol, SourceRange } from "../types";

// tree-sitter's native Node bindings can't run in a browser tab — this app's
// filesystem (WebContainer) only exists client-side, so parsing has to happen
// there too. web-tree-sitter runs the same grammars compiled to WASM instead.
//
// Pinned to 0.20.x: the prebuilt grammar files in tree-sitter-wasms@0.1.13
// were built with tree-sitter-cli 0.20.8, and newer web-tree-sitter runtimes
// (0.25+) use an incompatible WASM dynamic-linking format that fails to load
// them ("need to see wasm magic number").
const WASM_BASE_PATH = "/tree-sitter";

const LANGUAGE_WASM: Record<string, string> = {
  typescript: "tree-sitter-typescript.wasm",
  tsx: "tree-sitter-tsx.wasm",
  javascript: "tree-sitter-javascript.wasm",
};

type SyntaxNode = TSParser.SyntaxNode;

let initPromise: Promise<void> | null = null;
const languageCache = new Map<string, Promise<TSParser.Language>>();

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = TSParser.init({
      locateFile: () => `${WASM_BASE_PATH}/tree-sitter.wasm`,
    });
  }
  await initPromise;
}

async function loadLanguage(language: string): Promise<TSParser.Language | null> {
  const wasmFile = LANGUAGE_WASM[language];
  if (!wasmFile) return null;

  let pending = languageCache.get(language);
  if (!pending) {
    pending = ensureInitialized().then(() => TSParser.Language.load(`${WASM_BASE_PATH}/${wasmFile}`));
    languageCache.set(language, pending);
  }
  return pending;
}

function getRange(node: SyntaxNode): SourceRange {
  return {
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    startColumn: node.startPosition.column,
    endColumn: node.endPosition.column,
  };
}

function getNodeName(node: SyntaxNode): string | null {
  const nameNode = node.childForFieldName("name");
  return nameNode?.text ?? null;
}

function walk(
  node: SyntaxNode,
  functions: ParsedSymbol[],
  classes: ParsedSymbol[],
  exports: ParsedSymbol[],
  imports: string[],
): void {
  switch (node.type) {
    case "function_declaration": {
      const name = getNodeName(node);
      if (name) functions.push({ name, type: "function", range: getRange(node) });
      break;
    }

    case "class_declaration": {
      const name = getNodeName(node);
      if (name) classes.push({ name, type: "class", range: getRange(node) });
      break;
    }

    case "export_statement": {
      const declaration = node.childForFieldName("declaration");
      if (declaration) {
        const name = getNodeName(declaration);
        if (name) exports.push({ name, type: "export", range: getRange(node) });
      }
      break;
    }

    case "import_statement": {
      const sourceNode = node.childForFieldName("source");
      if (sourceNode) {
        // Grammar text includes the surrounding quotes ("./foo" -> ./foo).
        imports.push(sourceNode.text.slice(1, -1));
      }
      break;
    }
  }

  for (const child of node.namedChildren) {
    if (child) walk(child, functions, classes, exports, imports);
  }
}

/**
 * Parses one file's source into structural information (functions, classes,
 * exports, imports) using the WASM tree-sitter grammar for its language.
 * Falls back to an empty result for languages without a loaded grammar
 * (e.g. Python, Go) rather than failing the whole indexing pass.
 */
export async function parseFile(
  path: string,
  source: string,
  language: string = "typescript",
): Promise<ParsedFile> {
  const empty: ParsedFile = { path, functions: [], classes: [], exports: [], imports: [] };

  const grammarLanguage = await loadLanguage(language);
  if (!grammarLanguage) return empty;

  const parser = new TSParser();
  parser.setLanguage(grammarLanguage);

  const tree = parser.parse(source);
  if (!tree) return empty;

  const functions: ParsedSymbol[] = [];
  const classes: ParsedSymbol[] = [];
  const exportsFound: ParsedSymbol[] = [];
  const imports: string[] = [];

  walk(tree.rootNode, functions, classes, exportsFound, imports);
  parser.delete();

  return { path, functions, classes, exports: exportsFound, imports };
}

/**
 * Thin wrapper matching the shape ContextIndex expects: a parser it can hand
 * `{ path, language }` metadata plus file content to.
 */
export class CodeParser {
  async parse(meta: { path: string; language: string }, content: string): Promise<ParsedFile> {
    return parseFile(meta.path, content, meta.language);
  }
}
