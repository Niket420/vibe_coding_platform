export type SourceRange = {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
};

export type ParsedSymbol = {
  name: string;
  type: "function" | "class" | "export";
  range: SourceRange;
};

export type ParsedFile = {
  path: string;

  functions: ParsedSymbol[];
  classes: ParsedSymbol[];
  exports: ParsedSymbol[];

  imports: string[];
};