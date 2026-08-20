"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  MessageSquarePlus,
  MoreHorizontal,
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

  const currentProvider = config ? AI_PROVIDERS.find((p) => p.id === config.providerId) : undefined;
  const pendingProvider = pendingProviderId
    ? AI_PROVIDERS.find((p) => p.id === pendingProviderId)
    : undefined;

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

  function handleSend() {
    const text = draft.trim();
    if (!text || isGenerating || !config) return;

    setMessages((previous) => [
      ...previous,
      { id: nextMessageId(), role: "user", content: text, createdAt: Date.now() },
    ]);
    setDraft("");
    setIsGenerating(true);

    replyTimeout.current = setTimeout(() => {
      setMessages((previous) => [
        ...previous,
        {
          id: nextMessageId(),
          role: "assistant",
          content:
            "This is a placeholder response — CodeForge AI isn't wired up to a real model yet. The chat, provider switching, and context controls are ready for the backend to plug into.",
          createdAt: Date.now(),
        },
      ]);
      setIsGenerating(false);
      replyTimeout.current = null;
    }, 900);
  }

  function handleStop() {
    if (replyTimeout.current) {
      clearTimeout(replyTimeout.current);
      replyTimeout.current = null;
    }
    setIsGenerating(false);
  }

  return (
    <aside className="flex h-full min-w-0 flex-col bg-[#11161d] text-[#c9d1d9]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#30363d] px-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em]">
          <Sparkles size={13} className="text-[#a371f7]" />
          CODEFORGE AI
        </span>

        {config && !pendingProviderId && (
          <div className="flex items-center gap-0.5 text-[#8b949e]">
            <button
              type="button"
              title="New conversation"
              onClick={handleNewConversation}
              className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white"
            >
              <MessageSquarePlus size={14} />
            </button>
            <button
              type="button"
              title="Configure provider"
              onClick={() => setPendingProviderId(config.providerId)}
              className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white"
            >
              <Settings2 size={14} />
            </button>
            <div className="relative">
              <button
                type="button"
                title="More actions"
                onClick={() => setMoreMenuOpen((open) => !open)}
                className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white"
              >
                <MoreHorizontal size={14} />
              </button>

              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-[#30363d] bg-[#161b22] py-1 shadow-xl shadow-black/40">
                    <button
                      type="button"
                      disabled={messages.length === 0}
                      onClick={() => {
                        clearMessages();
                        setMoreMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d] disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                      Clear Conversation
                    </button>
                    <div className="my-1 h-px bg-[#30363d]" />
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#ff7b72] transition hover:bg-[#21262d]"
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

      {pendingProviderId && pendingProvider ? (
        <AIProviderSettings
          provider={pendingProvider}
          initialModel={config?.providerId === pendingProvider.id ? config.model : undefined}
          initialEndpoint={config?.providerId === pendingProvider.id ? config.endpoint : undefined}
          onBack={() => setPendingProviderId(null)}
          onCancel={() => setPendingProviderId(null)}
          onConnect={({ model, endpoint }) => {
            setConfig({ providerId: pendingProvider.id, model, endpoint });
            setPendingProviderId(null);
          }}
        />
      ) : !config ? (
        <AIProviderSelector onSelect={(provider) => setPendingProviderId(provider.id)} />
      ) : (
        <>
          <div className="relative flex h-9 shrink-0 items-center border-b border-[#30363d] px-2">
            <button
              type="button"
              onClick={() => setSwitcherOpen((open) => !open)}
              className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-xs transition hover:bg-[#21262d]"
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
                <div className="absolute left-2 top-full z-50 mt-1 max-h-80 w-72 overflow-hidden rounded-md border border-[#30363d] bg-[#161b22] shadow-xl shadow-black/40">
                  <AIProviderSelector
                    onSelect={(provider) => {
                      setSwitcherOpen(false);
                      setPendingProviderId(provider.id);
                    }}
                    onCancel={() => setSwitcherOpen(false)}
                  />
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
