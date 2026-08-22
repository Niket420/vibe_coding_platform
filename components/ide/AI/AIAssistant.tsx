"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  Plug,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Unplug,
} from "lucide-react";
import AIProviderSelector from "./AIProviderSelector";
import AIProviderSettings from "./AIProviderSettings";
import AIChat from "./AIChat";
import AIInput from "./AIInput";
import { AI_PROVIDERS, type ChatMessage, type ContextMode, type ProviderConfig } from "./types";

type AIAssistantProps = {
  activeFilePath?: string;
};

let messageCounter = 0;
function nextMessageId() {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

function contextLabel(mode: ContextMode, activeFilePath?: string) {
  switch (mode) {
    case "current-file":
      return activeFilePath ? activeFilePath.split("/").pop()! : "No file open";
    case "selected-code":
      return "No selection";
    case "open-files":
      return "All open files";
    case "workspace":
      return "Entire workspace";
  }
}

export default function AIAssistant({ activeFilePath }: AIAssistantProps) {
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [savedConnections, setSavedConnections] = useState<ProviderConfig[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>("current-file");
  const [inputFocusToken, setInputFocusToken] = useState(0);

  const replyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (replyTimeout.current) clearTimeout(replyTimeout.current);
  }, []);

  // Provider connections are already persisted server-side (encrypted) once configured —
  // hydrate from there so a page refresh doesn't drop back to the empty state.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/ai/providers");
        const data = await response.json();

        if (!cancelled && response.ok && data.success && Array.isArray(data.providers)) {
          const connections: ProviderConfig[] = data.providers.map(
            (entry: { provider: string; model: string; endpoint: string | null }) => ({
              providerId: entry.provider as ProviderConfig["providerId"],
              model: entry.model,
              endpoint: entry.endpoint ?? undefined,
            }),
          );

          setSavedConnections(connections);
          if (connections.length > 0) setConfig(connections[0]);
        }
      } catch {
        // No saved connections reachable — fall back to the empty "configure" state.
      } finally {
        if (!cancelled) setLoadingConnections(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentProvider = config ? AI_PROVIDERS.find((p) => p.id === config.providerId) : undefined;
  const pendingProvider = pendingProviderId
    ? AI_PROVIDERS.find((p) => p.id === pendingProviderId)
    : undefined;
  const unconfiguredProviders = useMemo(
    () => AI_PROVIDERS.filter((p) => !savedConnections.some((c) => c.providerId === p.id)),
    [savedConnections],
  );

  function clearMessages() {
    if (replyTimeout.current) {
      clearTimeout(replyTimeout.current);
      replyTimeout.current = null;
    }
    setIsGenerating(false);
    setMessages([]);
  }

  function handleNewConversation() {
    clearMessages();
    setContextMode("current-file");
    setMoreMenuOpen(false);
  }

  function handleDisconnect() {
    clearMessages();
    setConfig(null);
    setMoreMenuOpen(false);
  }

  function handleProviderConnected(providerId: string, model: string, endpoint?: string) {
    const newConfig: ProviderConfig = { providerId: providerId as ProviderConfig["providerId"], model, endpoint };
    setConfig(newConfig);
    setSavedConnections((previous) => [
      ...previous.filter((connection) => connection.providerId !== newConfig.providerId),
      newConfig,
    ]);
    setPendingProviderId(null);
    setPickerOpen(false);
  }

  async function handleSend() {
      const text = draft.trim();

      if (!text || isGenerating || !config) return;

      const userMessage: ChatMessage = {
        id: nextMessageId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];

      setMessages(updatedMessages);
      setDraft("");
      setIsGenerating(true);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: config.providerId,
            model: config.model,
            messages: updatedMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "AI request failed.");
        }

        setMessages((previous) => [
          ...previous,
          {
            id: nextMessageId(),
            role: "assistant",
            content: data.message,
            createdAt: Date.now(),
          },
        ]);
      } catch (error) {
        console.error("AI request error:", error);

        setMessages((previous) => [
          ...previous,
          {
            id: nextMessageId(),
            role: "assistant",
            content:
              error instanceof Error
                ? `Error: ${error.message}`
                : "Sorry, the AI request failed.",
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
}

  function handleStop() {
    if (replyTimeout.current) {
      clearTimeout(replyTimeout.current);
      replyTimeout.current = null;
    }
    setIsGenerating(false);
  }

  return (
    <aside className="flex h-full min-w-0 flex-col bg-[#0a0a0a] text-[#c9d1d9]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#262626] px-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em]">
          <Sparkles size={13} className="text-[#a371f7]" />
          CODEFORGE AI
        </span>

        {config && !pendingProviderId && !pickerOpen && (
          <div className="flex items-center gap-0.5 text-[#8b949e]">
            <button
              type="button"
              title="New conversation"
              onClick={handleNewConversation}
              className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#262626] hover:text-white"
            >
              <MessageSquarePlus size={14} />
            </button>
            <button
              type="button"
              title="Configure provider"
              onClick={() => setPendingProviderId(config.providerId)}
              className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#262626] hover:text-white"
            >
              <Settings2 size={14} />
            </button>
            <div className="relative">
              <button
                type="button"
                title="More actions"
                onClick={() => setMoreMenuOpen((open) => !open)}
                className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#262626] hover:text-white"
              >
                <MoreHorizontal size={14} />
              </button>

              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-[#262626] bg-[#121212] py-1 shadow-xl shadow-black/40">
                    <button
                      type="button"
                      disabled={messages.length === 0}
                      onClick={() => {
                        clearMessages();
                        setMoreMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#1a1a1a] disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      Clear Conversation
                    </button>
                    <div className="my-1 h-px bg-[#262626]" />
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#ff7b72] transition hover:bg-[#1a1a1a]"
                    >
                      <Unplug size={13} />
                      Disconnect Provider
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {loadingConnections ? (
        <div className="grid flex-1 place-items-center text-[#6e7681]">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : pendingProviderId && pendingProvider ? (
        <AIProviderSettings
          provider={pendingProvider}
          initialModel={config?.providerId === pendingProvider.id ? config.model : undefined}
          initialEndpoint={config?.providerId === pendingProvider.id ? config.endpoint : undefined}
          onBack={() => setPendingProviderId(null)}
          onCancel={() => setPendingProviderId(null)}
          onConnect={({ model, endpoint }) => handleProviderConnected(pendingProvider.id, model, endpoint)}
        />
      ) : pickerOpen ? (
        <AIProviderSelector
          providers={config ? unconfiguredProviders : AI_PROVIDERS}
          heading={config ? "Add another provider" : "Choose an AI provider"}
          subheading={
            config
              ? "Connect an additional provider to switch between them from the chat header."
              : "Connect a provider to start chatting with CodeForge AI."
          }
          onSelect={(provider) => {
            setPickerOpen(false);
            setPendingProviderId(provider.id);
          }}
          onCancel={() => setPickerOpen(false)}
        />
      ) : !config ? (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#262626] bg-[#121212] text-[#a371f7] shadow-lg shadow-black/20">
            <Sparkles size={20} />
          </span>
          <p className="mt-4 text-sm font-medium text-[#e6edf3]">Configure your AI model</p>
          <p className="mt-1 max-w-[240px] text-xs leading-5 text-[#6e7681]">
            Connect an AI provider to start using CodeForge AI inside your workspace.
          </p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-5 flex h-8 items-center gap-2 rounded-md bg-white px-4 text-xs font-semibold text-black transition hover:bg-[#d4d4d4]"
          >
            <Plug size={13} />
            Configure AI
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex h-9 shrink-0 items-center border-b border-[#262626] px-2">
            <button
              type="button"
              onClick={() => setSwitcherOpen((open) => !open)}
              className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-xs transition hover:bg-[#1a1a1a]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3fb950]" />
              {currentProvider && <currentProvider.icon size={13} className="shrink-0 text-[#a371f7]" />}
              <span className="truncate font-medium text-[#e6edf3]">{currentProvider?.name}</span>
              <span className="truncate text-[#6e7681]">· {config.model}</span>
              <ChevronDown size={12} className="shrink-0 text-[#6e7681]" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                <div className="cf-dropdown absolute left-2 top-full z-50 mt-1 w-72 overflow-hidden rounded-md border border-[#262626] bg-[#121212] shadow-xl shadow-black/40">
                  <div className="max-h-64 overflow-auto py-1">
                    {savedConnections.map((connection) => {
                      const provider = AI_PROVIDERS.find((p) => p.id === connection.providerId);
                      if (!provider) return null;

                      const isActive =
                        config.providerId === connection.providerId && config.model === connection.model;

                      return (
                        <button
                          key={connection.providerId}
                          type="button"
                          onClick={() => {
                            setConfig(connection);
                            setSwitcherOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-[#1a1a1a]"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-[#3fb950]" : "bg-transparent"}`}
                          />
                          <provider.icon size={13} className="shrink-0 text-[#a371f7]" />
                          <span className={isActive ? "font-medium text-[#e6edf3]" : "text-[#c9d1d9]"}>
                            {provider.name}
                          </span>
                          <span className="ml-auto min-w-0 truncate text-[#6e7681]">{connection.model}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="my-1 h-px bg-[#262626]" />
                  <button
                    type="button"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setPickerOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-white transition hover:bg-[#1a1a1a]"
                  >
                    <Plus size={13} />
                    Configure provider
                  </button>
                </div>
              </>
            )}
          </div>

          <AIChat
            messages={messages}
            isGenerating={isGenerating}
            modelLabel={`${currentProvider?.name ?? "your provider"} · ${config.model}`}
            onSuggestion={(prompt) => {
              setDraft(prompt);
              setInputFocusToken((token) => token + 1);
            }}
          />

          <AIInput
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            onStop={handleStop}
            isGenerating={isGenerating}
            contextMode={contextMode}
            onContextModeChange={setContextMode}
            contextLabel={contextLabel(contextMode, activeFilePath)}
            focusToken={inputFocusToken}
          />
        </>
      )}
    </aside>
  );
}
