import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Providers whose API speaks the OpenAI chat-completions shape, and their
// default base URL when the user hasn't set a custom endpoint.
const OPENAI_COMPATIBLE_ENDPOINTS: Record<string, string> = {
  xai: "https://api.x.ai/v1",
  groq: "https://api.groq.com/openai/v1",
};

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

    // 4. Decrypt the API key ONLY on the server
    // Trimmed defensively in case it was saved before input trimming was added.
    const apiKey = decrypt(connection.encryptedApiKey).trim();

    // 5. Determine which model to use
    const selectedModel = model?.trim() || connection.model;

    // 6. Currently we support OpenAI-compatible providers (xAI, Groq)
    const defaultEndpoint = OPENAI_COMPATIBLE_ENDPOINTS[provider];

    if (!defaultEndpoint) {
      return NextResponse.json(
        { error: `Provider "${provider}" is not implemented yet.` },
        { status: 400 }
      );
    }

    // 7. Call the provider's chat-completions endpoint
    const endpoint = connection.endpoint?.trim() || defaultEndpoint;

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
      }),
    });

    // 8. Handle an error returned by the provider
    if (!response.ok) {
      const errorText = await response.text();

      console.error(`${provider} API error:`, response.status, errorText);

      return NextResponse.json(
        {
          error: "AI provider request failed.",
          providerStatus: response.status,
        },
        { status: 502 }
      );
    }

    // 9. Parse the provider's response
    const data = await response.json();

    const assistantMessage = data?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "AI provider returned an empty response." },
        { status: 502 }
      );
    }

    // 10. Send only the useful response back to the browser
    return NextResponse.json({
      success: true,
      provider,
      model: selectedModel,
      message: assistantMessage,
    });
  } catch (error) {
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