import type { WebContainer } from "@webcontainer/api";

import type { Candidate } from "../retrieval/CandidateScorer";

/**
 * Represents a piece of source code selected for
 * the final LLM context.
 */
export type ContextItem = {
  path: string;
  content: string;
  score: number;
};

/**
 * Selects the most relevant code from ranked candidates
 * for inclusion in the LLM context.
 */
export class ContextSelector {
  /**
   * Selects the highest-ranked candidates and reads
   * their source code from the workspace.
   */
  async select(
    webcontainer: WebContainer,
    candidates: Candidate[],
    maxFiles = 10,
  ): Promise<ContextItem[]> {
    const selectedCandidates = candidates.slice(0, maxFiles);

    const context: ContextItem[] = [];

    for (const candidate of selectedCandidates) {
      try {
        const content = await webcontainer.fs.readFile(
          candidate.path,
          "utf-8",
        );

        context.push({
          path: candidate.path,
          content,
          score: candidate.score,
        });
      } catch {
        // Ignore files that are no longer available.
      }
    }

    return context;
  }
}