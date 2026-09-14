import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Providers whose API already speaks the OpenAI chat-completions shape,
// and their default base URL when the user hasn't set a custom endpoint.
// "custom" and "local" have no default — they always rely on the user's endpoint.
const OPENAI_COMPATIBLE_PROVIDERS = new Set([
  "xai",
  "groq",
  "openai",
  "openrouter",
  "custom",
  "local",
]);

const OPENAI_COMPATIBLE_DEFAULT_ENDPOINTS: Record<string, string> = {
  xai: "https://api.x.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

function encoderChunk(content: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

// Anthropic's Messages API speaks a different shape (separate `system` field,
// "assistant"/"user" roles only, its own SSE event types). Translate its
// stream into the same OpenAI-style `choices[0].delta.content` chunks the
// frontend already knows how to consume.
function anthropicStreamToOpenAI(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();

      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);

          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            controller.enqueue(encoder.encode(encoderChunk(event.delta.text)));
          }
        } catch {
          // Ignore malformed/partial SSE lines.
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// Gemini's streamGenerateContent (alt=sse) sends whole GenerateContentResponse
// objects, not deltas — extract the incremental text piece from each one and
// re-emit it in the OpenAI shape.
function googleStreamToOpenAI(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();

      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);
          const text = event?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (typeof text === "string" && text.length > 0) {
            controller.enqueue(encoder.encode(encoderChunk(text)));
          }
        } catch {
          // Ignore malformed/partial SSE lines.
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

function splitSystemPrompt(messages: ChatMessage[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  const conversation = messages.filter((message) => message.role !== "system");

  return { system, conversation };
}

async function callAnthropic(apiKey: string, model: string, messages: ChatMessage[]) {
  const { system, conversation } = splitSystemPrompt(messages);

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: conversation.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
      stream: true,
    }),
  });
}

async function callGoogle(apiKey: string, model: string, messages: ChatMessage[]) {
  const { system, conversation } = splitSystemPrompt(messages);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: conversation.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    }),
  });
}

export async function POST(request: Request) {
  try {
    // 1. Identify the logged-in CodeForge user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    // 2. Get the request sent by the AI UI
    const body = await request.json();

    const {
      provider,
      model,
      messages,
    }: {
      provider?: string;
      model?: string;
      messages?: ChatMessage[];
    } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required." },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    // 3. Find this user's saved provider configuration
    const connection = await prisma.aIProviderConnection.findUnique({
      where: {
        clerkUserId_provider: {
          clerkUserId: userId,
          provider,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "This AI provider is not configured." },
        { status: 404 }
      );
    }

    // 4. Decrypt the API key ONLY on the server. Local models may have no key at all.
    // Trim defensively in case the key was saved before input trimming.
    const apiKey = connection.encryptedApiKey
      ? decrypt(connection.encryptedApiKey).trim()
      : "";

    // 5. Determine which model to use
    const selectedModel = model?.trim() || connection.model;

    let providerResponse: Response;
    let toOpenAIStream: (body: ReadableStream<Uint8Array>) => ReadableStream<Uint8Array> = (body) => body;

    if (OPENAI_COMPATIBLE_PROVIDERS.has(provider)) {
      // 6. Use the user's custom endpoint if provided, otherwise the provider's default.
      const endpoint = connection.endpoint?.trim() || OPENAI_COMPATIBLE_DEFAULT_ENDPOINTS[provider];

      if (!endpoint) {
        return NextResponse.json(
          { error: `No endpoint configured for provider "${provider}".` },
          { status: 400 }
        );
      }

      providerResponse = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          stream: true,
        }),
      });
    } else if (provider === "anthropic") {
      providerResponse = await callAnthropic(apiKey, selectedModel, messages);
      toOpenAIStream = anthropicStreamToOpenAI;
    } else if (provider === "google") {
      providerResponse = await callGoogle(apiKey, selectedModel, messages);
      toOpenAIStream = googleStreamToOpenAI;
    } else {
      return NextResponse.json(
        { error: `Provider "${provider}" is not implemented yet.` },
        { status: 400 }
      );
    }

    // 7. Handle provider errors
    if (!providerResponse.ok) {
      const errorText = await providerResponse.text();

      console.error(
        `${provider} API error:`,
        providerResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          error: "AI provider request failed.",
          providerStatus: providerResponse.status,
        },
        { status: 502 }
      );
    }

    // 8. Make sure the provider returned a stream
    if (!providerResponse.body) {
      return NextResponse.json(
        {
          error: "AI provider returned no response stream.",
        },
        { status: 502 }
      );
    }

    // 9. Forward the (possibly translated) stream to the browser
    return new Response(toOpenAIStream(providerResponse.body), {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // 10. Handle unexpected server errors
    console.error("AI chat error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process AI request.",
      },
      { status: 500 }
    );
  }
}
