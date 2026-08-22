"use client";

import { AlertTriangle, FileCode2 } from "lucide-react";

type SaveDialogProps = {
  fileName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export default function SaveDialog({ fileName, onSave, onDiscard, onCancel }: SaveDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#3b434b] bg-[#121212] shadow-2xl shadow-black/70">
        <div className="flex gap-4 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#5d4625] bg-[#2d2515] text-[#e3b341]">
            <AlertTriangle size={19} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">Save your changes?</h2>
            <p className="mt-2 text-sm leading-6 text-[#8b949e]">
              Changes to <span className="font-medium text-[#e6edf3]">{fileName}</span> will be lost if you do not save them.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded bg-[#1a1a1a] px-2 py-1 text-[11px] text-[#aeb8c2]">
              <FileCode2 size={13} className="text-[#4fc1ff]" />
              Unsaved editor
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#262626] bg-[#0a0a0a] px-5 py-3.5">
          <button onClick={onCancel} className="rounded-md px-3 py-2 text-sm font-medium text-[#c9d1d9] transition hover:bg-[#1a1a1a]">
            Cancel
          </button>
          <button onClick={onDiscard} className="rounded-md border border-[#5d3234] bg-[#2d1d20] px-3 py-2 text-sm font-medium text-[#ff7b72] transition hover:bg-[#3a2024]">
            Discard
          </button>
          <button onClick={onSave} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#d4d4d4]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
