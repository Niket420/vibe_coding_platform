import type { WebContainer } from "@webcontainer/api";

/**
 * Represents a lexical match found inside a source file.
 */
export type LexicalResult = {
  path: string;
  line: number;
  content: string;
  score: number;
};

/**
 * Searches source-code text for occurrences of a query.
 *
 * Lexical retrieval is useful when the requested concept
 * is present in code but is not represented by a symbol.
 */
export class LexicalRetriever {
  /**
   * Searches the provided source files for the query.
   */
  async retrieve(
    webcontainer: WebContainer,
    filePaths: string[],
    query: string,
  ): Promise<LexicalResult[]> {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const results: LexicalResult[] = [];

    for (const filePath of filePaths) {
      const content = await webcontainer.fs.readFile(
        filePath,
        "utf-8",
      );

      const lines = content.split("\n");

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const normalizedLine = line.toLowerCase();

        if (!normalizedLine.includes(normalizedQuery)) {
          continue;
        }

        results.push({
          path: filePath,
          line: index + 1,
          content: line.trim(),
          score: this.calculateScore(
            normalizedQuery,
            normalizedLine,
          ),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculates a basic lexical relevance score.
   */
  private calculateScore(
    query: string,
    line: string,
  ): number {
    // Exact line match is strongest.
    if (line.trim() === query) {
      return 1;
    }

    // A line starting with the query is highly relevant.
    if (line.trim().startsWith(query)) {
      return 0.8;
    }

    // A line containing the query is still relevant.
    return 0.5;
  }
}