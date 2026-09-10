import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import type { ParsedFile, ParsedSymbol, SourceRange } from "../types";

const parser = new Parser();

parser.setLanguage(TypeScript.typescript);

function getRange(node: Parser.SyntaxNode): SourceRange {
  return {
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    startColumn: node.startPosition.column,
    endColumn: node.endPosition.column,
  };
}

function getNodeName(node: Parser.SyntaxNode): string | null {
  const nameNode = node.childForFieldName("name");

  return nameNode?.text ?? null;
}

export function parseFile(
  path: string,
  source: string,
): ParsedFile {
  const tree = parser.parse(source);

  const functions: ParsedSymbol[] = [];
  const classes: ParsedSymbol[] = [];
  const exports: ParsedSymbol[] = [];
  const imports: string[] = [];

  function walk(node: Parser.SyntaxNode): void {
    switch (node.type) {
      case "function_declaration": {
        const name = getNodeName(node);

        if (name) {
          functions.push({
            name,
            type: "function",
            range: getRange(node),
          });
        }

        break;
      }

      case "class_declaration": {
        const name = getNodeName(node);

        if (name) {
          classes.push({
            name,
            type: "class",
            range: getRange(node),
          });
        }

        break;
      }

      case "export_statement": {
        const declaration = node.childForFieldName("declaration");

        if (declaration) {
          const name = getNodeName(declaration);

          if (name) {
            exports.push({
              name,
              type: "export",
              range: getRange(node),
            });
          }
        }

        break;
      }

      case "import_statement": {
        const sourceNode = node.childForFieldName("source");

        if (sourceNode) {
          imports.push(sourceNode.text);
        }

        break;
      }
    }

    for (const child of node.namedChildren) {
      walk(child);
    }
  }

  walk(tree.rootNode);

  return {
    path,
    functions,
    classes,
    exports,
    imports,
  };
}