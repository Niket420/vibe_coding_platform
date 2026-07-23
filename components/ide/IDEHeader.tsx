import { Play } from "lucide-react";

export default function IDEHeader() {
  return (
    <div className="h-14 border-b border-zinc-800 bg-[#252526] flex items-center justify-between px-4">
      <h1 className="font-semibold text-white">
        CodeForge
      </h1>

      <div className="flex items-center gap-3">
        <span className="text-sm text-green-400">
          ● Running
        </span>

        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Play size={16} />
          Run
        </button>
      </div>
    </div>
  );
}