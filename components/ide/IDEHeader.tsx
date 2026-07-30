"use client";

import { Bell, ChevronDown, Command, Play, Share2, SquareTerminal } from "lucide-react";

type IDEHeaderProps = {
  onRun: () => void;
};

export default function IDEHeader({ onRun }: IDEHeaderProps) {
  return (
    <div className="flex h-full items-center gap-2 bg-[#11161d] px-3 text-[#c9d1d9]">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[#007acc] text-sm font-bold text-white shadow-md shadow-[#007acc]/20">&lt;/&gt;</span>
        <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">CodeForge</span>
      </div>

      <nav className="ml-2 hidden items-center gap-0.5 text-xs text-[#a5adb7] lg:flex">
        {["File", "Edit", "Selection", "View", "Go", "Run"].map((item) => (
          <button key={item} type="button" className="rounded px-2 py-1 hover:bg-[#21262d] hover:text-white">
            {item}
          </button>
        ))}
      </nav>

      <button
        type="button"
        aria-label="Search workspace"
        className="mx-auto hidden h-7 w-full max-w-md items-center justify-between rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 text-xs text-[#6e7681] transition hover:border-[#4b5563] hover:text-[#aeb8c2] md:flex"
      >
        <span className="flex items-center gap-2"><Command size={13} /> Search workspace</span>
        <span className="rounded border border-[#30363d] px-1 text-[10px]">⌘ P</span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden items-center gap-1.5 text-[11px] text-[#8b949e] xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
          Workspace ready
        </span>
        <button type="button" title="Share workspace" aria-label="Share workspace" className="grid h-7 w-7 place-items-center rounded-md text-[#8b949e] transition hover:bg-[#21262d] hover:text-white sm:flex">
          <Share2 size={15} />
        </button>
        <button type="button" title="Notifications" aria-label="Notifications" className="hidden h-7 w-7 place-items-center rounded-md text-[#8b949e] transition hover:bg-[#21262d] hover:text-white sm:grid">
          <Bell size={15} />
        </button>
        <button
          type="button"
          onClick={onRun}
          className="flex h-7 items-center gap-1.5 rounded-md bg-[#238636] px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2ea043]"
        >
          <Play size={13} fill="currentColor" />
          <span className="hidden sm:inline">Run</span>
          <ChevronDown size={12} />
        </button>
        <button type="button" title="Open terminal" aria-label="Open terminal" onClick={onRun} className="hidden h-7 w-7 place-items-center rounded-md text-[#8b949e] transition hover:bg-[#21262d] hover:text-white sm:grid">
          <SquareTerminal size={15} />
        </button>
      </div>
    </div>
  );
}
