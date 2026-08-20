"use client";

import { ChevronRight, X } from "lucide-react";
import { AI_PROVIDERS, type AIProvider } from "./types";

type AIProviderSelectorProps = {
  onSelect: (provider: AIProvider) => void;
  onCancel?: () => void;
};

export default function AIProviderSelector({ onSelect, onCancel }: AIProviderSelectorProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between px-3 pt-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[#e6edf3]">Choose an AI provider</h3>
          <p className="mt-0.5 text-[11px] leading-4 text-[#8b949e]">
            Connect a provider to start chatting with CodeForge AI.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            title="Cancel"
            onClick={onCancel}
            className="grid h-6 w-6 shrink-0 place-items-center rounded text-[#8b949e] transition hover:bg-[#21262d] hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-auto border-t border-[#30363d]">
        {AI_PROVIDERS.map((provider) => {
          const Icon = provider.icon;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider)}
              className="flex w-full items-center gap-3 border-b border-[#1c2128] px-3 py-2.5 text-left transition hover:bg-[#21262d]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#30363d] bg-[#161b22] text-[#a371f7]">
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-[#e6edf3]">
                  {provider.name}
                </span>
                <span className="block truncate text-[11px] text-[#6e7681]">
                  {provider.description}
                </span>
              </span>
              <ChevronRight size={14} className="shrink-0 text-[#6e7681]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
