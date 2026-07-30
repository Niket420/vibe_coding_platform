import { ExternalLink, Globe2, Play } from "lucide-react";

export default function Preview() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-auto bg-[#0d1117] p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-[#30363d] bg-[#f6f8fa] shadow-xl shadow-black/25">
        <div className="flex h-9 items-center gap-2 border-b border-[#d0d7de] bg-[#ffffff] px-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[#f1f3f5] px-2 py-1 text-[10px] text-[#57606a]">
            <Globe2 size={12} />
            <span className="truncate">http://localhost:3000</span>
          </span>
          <ExternalLink size={13} className="text-[#57606a]" />
        </div>

        <div className="flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center sm:min-h-56">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ddf4ff] text-[#0969da]">
            <Play size={18} fill="currentColor" />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#24292f]">Your live preview will appear here</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-[#57606a]">Start a development server in the terminal, then switch back to this panel to inspect your app.</p>
        </div>
      </div>
    </div>
  );
}
