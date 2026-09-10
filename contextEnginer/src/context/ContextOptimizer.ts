import type { ContextRegion } from "./ContextBuilder";

export type OptimizedContext = {
  items: ContextRegion[];
};

export class ContextOptimizer {
  optimize(
    regions: ContextRegion[],
    maxTokens: number,
  ): OptimizedContext {
    const sorted = [...regions].sort(
      (a, b) => b.score - a.score,
    );

    const selected: ContextRegion[] = [];
    let estimatedTokens = 0;

    for (const region of sorted) {
      const tokens = this.estimateTokens(region.content);

      if (estimatedTokens + tokens > maxTokens) {
        continue;
      }

      selected.push(region);
      estimatedTokens += tokens;
    }

    return {
      items: selected,
    };
  }

  private estimateTokens(content: string): number {
    // Rough estimate.
    // A proper tokenizer can replace this later.
    return Math.ceil(content.length / 4);
  }
}