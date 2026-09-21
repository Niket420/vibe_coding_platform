import type { AgentEventHandler, AgentMessage, ToolContext } from "../types";
import { runModelTurn } from "../llm/AgentModelClient";
import { executeToolCall } from "../executor/ToolExecutor";

const DEFAULT_MAX_ITERATIONS = 12;

export type AgentLoopParams = {
  provider: string;
  model: string;
  /** Full initial message list — system prompt + any history + the user's task. */
  messages: AgentMessage[];
  toolContext: ToolContext;
  onEvent?: AgentEventHandler;
  maxIterations?: number;
};

/**
 * The think-act-observe loop: ask the model for the next step, and if it
 * responds with tool calls instead of a final answer, run them, feed the
 * results back as messages, and ask again — until the model gives a plain
 * answer, or the iteration cap is hit (a safety net against the model
 * looping on a task it can't complete).
 */
export async function runAgentLoop(params: AgentLoopParams): Promise<string> {
  const { provider, model, toolContext, onEvent } = params;
  const maxIterations = params.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  const messages: AgentMessage[] = [...params.messages];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let turn;
    try {
      turn = await runModelTurn({
        provider,
        model,
        messages,
        onTextDelta: (delta) => onEvent?.({ type: "text", delta }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Model request failed.";
      onEvent?.({ type: "error", message });
      return message;
    }

    if (turn.toolCalls.length === 0) {
      messages.push({ role: "assistant", content: turn.content });
      onEvent?.({ type: "done", finalText: turn.content });
      return turn.content;
    }

    messages.push({ role: "assistant", content: turn.content, toolCalls: turn.toolCalls });

    for (const call of turn.toolCalls) {
      onEvent?.({ type: "tool-call", call });

      const result = await executeToolCall(call, toolContext);

      onEvent?.({ type: "tool-result", call, result });

      messages.push({
        role: "tool",
        toolCallId: call.id,
        name: call.name,
        content: result.success ? result.output : `Error: ${result.error ?? "Tool failed."}`,
      });
    }
  }

  const message = `Stopped after ${maxIterations} steps without finishing — the task may be too large, or the agent may be stuck in a loop.`;
  onEvent?.({ type: "error", message });
  return message;
}
