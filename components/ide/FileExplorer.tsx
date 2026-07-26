"use client";

import {
  ChevronDown,
  FilePlus,
  FolderPlus,
  RefreshCw,
  ChevronsDown,
} from "lucide-react";

export default function FileExplorer() {
  function handleNewFile() {
    console.log("New File");
  }

  function handleNewFolder() {
    console.log("New Folder");
  }

  function handleRefresh() {
    console.log("Refresh");
  }

  function handleCollapseAll() {
    console.log("Collapse All");
  }

  return (
    <div className="h-full bg-[#181818] text-gray-300 border-r border-zinc-800">
      {/* Explorer Header */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-zinc-800">
        <h2 className="text-xs font-semibold tracking-wider text-gray-400">
          EXPLORER
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewFile}
            className="p-1 rounded hover:bg-zinc-700"
          >
            <FilePlus size={16} />
          </button>

          <button
            onClick={handleNewFolder}
            className="p-1 rounded hover:bg-zinc-700"
          >
            <FolderPlus size={16} />
          </button>

          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-zinc-700"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleCollapseAll}
            className="p-1 rounded hover:bg-zinc-700"
          >
            <ChevronsDown size={16} />
          </button>
        </div>
      </div>

      {/* Project Header */}
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800">
        <ChevronDown size={16} />

        <span className="font-medium text-[15px]">my-app</span>
      </div>

      {/* Tree will come here */}
    </div>
  );
}