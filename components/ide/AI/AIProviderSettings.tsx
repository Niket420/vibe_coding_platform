"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { AIProvider } from "./types";

type AIProviderSettingsProps = {
  provider: AIProvider;
  initialModel?: string;
  initialEndpoint?: string;
  onBack: () => void;
  onCancel: () => void;
  onConnect: (result: { model: string; endpoint?: string }) => void;
};

export default function AIProviderSettings({
  provider,
  initialModel,
  initialEndpoint,
  onBack,
  onCancel,
  onConnect,
}: AIProviderSettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState(initialModel ?? provider.models[0] ?? "");
  const [customModel, setCustomModel] = useState(
    provider.models.length === 0 ? (initialModel ?? "") : "",
  );
  const [endpoint, setEndpoint] = useState(
    initialEndpoint ?? provider.defaultEndpoint ?? "",
  );
  const [connecting, setConnecting] = useState(false);
  const { push: pushToast } = useToast();

  const Icon = provider.icon;
  const usesFreeTextModel = provider.models.length === 0;
  const resolvedModel = (usesFreeTextModel ? customModel : model).trim();

  const canConnect = provider.isLocal
    ? endpoint.trim().length > 0 && resolvedModel.length > 0
    : apiKey.trim().length > 0 && resolvedModel.length > 0;

  async function handleConnect() {
    if (!canConnect || connecting) return;

    setConnecting(true);

    try {
      const response = await fetch("/api/ai/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: provider.id,
          model: resolvedModel,
          apiKey: provider.isLocal ? undefined : apiKey.trim(),
          endpoint: endpoint.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save AI provider");
      }

      onConnect({
        model: resolvedModel,
        endpoint: endpoint.trim() || undefined,
      });

      pushToast({
        tone: "success",
        title: provider.isLocal
          ? "Local model configured"
          : "Provider configured",
        description: `${provider.name} · ${resolvedModel}`,
      });
    } catch (error) {
      console.error("AI provider connection error:", error);

      pushToast({
        tone: "error",
        title: "Connection failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to configure AI provider.",
      });
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-[#262626] px-3 py-2.5">
        <button
          type="button"
          title="Back"
          onClick={onBack}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-[#8b949e] transition hover:bg-[#1a1a1a] hover:text-white"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#262626] bg-[#121212] text-[#a371f7]">
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-[#e6edf3]">
            {provider.name}
          </p>
          <p className="truncate text-[10.5px] text-[#6e7681]">
            {provider.description}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto px-3 py-3.5">
        {provider.isLocal ? (
          <>
            <Field label="Endpoint">
              <input
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="http://localhost:11434"
                spellCheck={false}
                autoComplete="off"
                className={inputClass}
              />
            </Field>

            <Field label="Model name">
              <input
                value={customModel}
                onChange={(event) => setCustomModel(event.target.value)}
                placeholder="e.g. qwen2.5-coder:7b"
                spellCheck={false}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="API key">
              <div className="relative">
                <KeyRound
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]"
                />
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  type={showApiKey ? "text" : "password"}
                  placeholder="Paste your API key"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  className={`${inputClass} pl-8 pr-8`}
                />
                <button
                  type="button"
                  title={showApiKey ? "Hide key" : "Show key"}
                  onClick={() => setShowApiKey((value) => !value)}
                  className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-[#6e7681] transition hover:bg-[#262626] hover:text-white"
                >
                  {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-[#6e7681]">
                Stored only in this session's memory. Nothing is sent or saved
                until the backend is wired up.
              </p>
            </Field>

            {usesFreeTextModel ? (
              <Field label="Model">
                <input
                  value={customModel}
                  onChange={(event) => setCustomModel(event.target.value)}
                  placeholder="e.g. gpt-4o-mini or anthropic/claude-sonnet-5"
                  spellCheck={false}
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
            ) : (
              <Field label="Model">
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className={inputClass}
                >
                  {provider.models.map((modelId) => (
                    <option key={modelId} value={modelId}>
                      {modelId}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {provider.supportsCustomEndpoint && (
              <Field label="Custom endpoint (optional)">
                <input
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  placeholder={
                    provider.defaultEndpoint ?? "https://api.example.com/v1"
                  }
                  spellCheck={false}
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#262626] px-3 py-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-[#c9d1d9] transition hover:bg-[#1a1a1a]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canConnect || connecting}
          onClick={handleConnect}
          className="flex h-7 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-semibold text-black transition hover:bg-[#d4d4d4] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {connecting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Plug size={13} />
          )}
          {provider.isLocal ? "Test Connection" : "Save & Connect"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "h-8 w-full rounded border border-[#262626] bg-[#000000] px-2.5 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#525252]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-wide text-[#8b949e]">
        {label}
      </span>
      {children}
    </label>
  );
}
