import type {
  ParsedFile,
  ParsedSymbol,
  SourceRange,
} from "../types";

export type Symbol = {
  name: string;
  type: ParsedSymbol["type"];
  filePath: string;
  range: SourceRange;
};

export class SymbolIndex {
  private symbols = new Map<string, Symbol[]>();

  addFile(parsedFile: ParsedFile): void {
    for (const symbol of [
      ...parsedFile.functions,
      ...parsedFile.classes,
      ...parsedFile.exports,
    ]) {
      this.addSymbol({
        name: symbol.name,
        type: symbol.type,
        filePath: parsedFile.path,
        range: symbol.range,
      });
    }
  }

  private addSymbol(symbol: Symbol): void {
    const existing = this.symbols.get(symbol.name) ?? [];

    existing.push(symbol);

    this.symbols.set(symbol.name, existing);
  }

  find(name: string): Symbol[] {
    return this.symbols.get(name) ?? [];
  }

  removeFile(filePath: string): void {
    for (const [name, symbols] of this.symbols) {
      const remaining = symbols.filter(
        (symbol) => symbol.filePath !== filePath,
      );

      if (remaining.length === 0) {
        this.symbols.delete(name);
      } else {
        this.symbols.set(name, remaining);
      }
    }
  }

  clear(): void {
    this.symbols.clear();
  }

  getAll(): Symbol[] {
    return Array.from(this.symbols.values()).flat();
  }
}