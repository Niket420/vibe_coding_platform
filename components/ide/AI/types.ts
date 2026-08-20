import type { LucideIcon } from "lucide-react";
import { Bot, Brain, Cpu, Globe, Server, Sparkles, Zap } from "lucide-react";

export type ProviderId =
  | "xai"
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "custom"
  | "local";

export type AIProvider = {
  id: ProviderId;
  name: string;
  description: string;
  icon: LucideIcon;
  models: string[];
  isLocal?: boolean;
  supportsCustomEndpoint?: boolean;
  defaultEndpoint?: string;
};

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "xai",
    name: "Grok / xAI",
    description: "Grok 4 and the xAI model family",
    icon: Zap,
    models: ["grok-4.1", "grok-4-fast", "grok-3"],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5.1 and the OpenAI model family",
    icon: Sparkles,
    models: ["gpt-5.1", "gpt-5.1-mini", "gpt-4.1"],
  },
  {
    id: "anthropic",
    name: "Anthropic / Claude",
    description: "Claude Opus, Sonnet, and Haiku",
    icon: Brain,
    models: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4.5"],
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini Pro and Flash",
    icon: Bot,
    models: ["gemini-3-pro", "gemini-3-flash"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Route to any model through one API key",
    icon: Globe,
    models: ["openrouter/auto", "anthropic/claude-sonnet-5", "openai/gpt-5.1"],
    supportsCustomEndpoint: true,
    defaultEndpoint: "https://openrouter.ai/api/v1",
  },
  {
    id: "custom",
    name: "Custom OpenAI-compatible",
    description: "Any endpoint that speaks the OpenAI API shape",
    icon: Cpu,
    models: [],
    supportsCustomEndpoint: true,
  },
  {
    id: "local",
    name: "Local Model",
    description: "A model running on your own machine",
    icon: Server,
    models: [],
    isLocal: true,
    defaultEndpoint: "http://localhost:11434",
  },
];

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type ContextMode = "current-file" | "selected-code" | "workspace" | "open-files";

export type ProviderConfig = {
  providerId: ProviderId;
  model: string;
  endpoint?: string;
};
