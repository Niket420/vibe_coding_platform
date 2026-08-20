"use client";

import { Sparkles, User } from "lucide-react";
import type { ChatMessage } from "./types";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIMessage({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="px-3 py-2">
        <div className="rounded-md border border-[#30363d] bg-[#161b22] p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10.5px] text-[#6e7681]">
            <User size={11} />
            <span className="font-medium text-[#8b949e]">You</span>
            <span>{formatTime(message.createdAt)}</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[#e6edf3]">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 px-3 py-2">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#a371f7]/15 text-[#a371f7]">
        <Sparkles size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5 text-[10.5px] text-[#6e7681]">
          <span className="font-medium text-[#8b949e]">CodeForge AI</span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[#c9d1d9]">
          {message.content}
        </p>
      </div>
    </div>
  );
}
