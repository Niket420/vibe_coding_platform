"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Ellipsis,
  File,
  FileCode2,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  RefreshCw,
} from "lucide-react";
import { FileTreeNode } from "@/types/file-tree";

type TreeNodeProps = {
  node: FileTreeNode;
  level: number;
  activeFilePath: string;
  onOpenFile: (path: string) => Promise<void>;
};

type FileExplorerProps = {
  fileTree: FileTreeNode[];
  activeFilePath: string;
  onRefresh: () => Promise<void>;
  onCreateFolder: (path: string) => Promise<void>;
  onCreateFile: (path: string) => Promise<void>;
  onOpenFile: (path: string) => Promise<void>;
};

function fileColor(name: string) {
  if (/\.(tsx?|jsx?)$/i.test(name)) return "text-[#4fc1ff]";
  if (/\.css$/i.test(name)) return "text-[#c586c0]";
  if (/\.json$/i.test(name)) return "text-[#e3b341]";
  return "text-[#8b949e]";
}

function TreeNode({ node, level, activeFilePath, onOpenFile }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isDirectory = node.type === "directory";
  const isActive = !isDirectory && node.path === activeFilePath;

  if (node.name === "node_modules") return null;

  return (
    <div>
      <button
        type="button"
        className={`flex h-7 w-full items-center gap-1.5 px-2 text-left text-[13px] transition ${
          isActive
            ? "bg-[#1f6feb]/25 text-[#f0f6fc]"
            : "text-[#b1bac4] hover:bg-[#21262d] hover:text-[#e6edf3]"
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        onClick={async () => {
          if (isDirectory) {
            setExpanded((isCurrentlyExpanded) => !isCurrentlyExpanded);
            return;
          }

          await onOpenFile(node.path);
        }}
      >
        {isDirectory ? (
          expanded ? <ChevronDown size={14} className="shrink-0 text-[#8b949e]" /> : <ChevronRight size={14} className="shrink-0 text-[#8b949e]" />
        ) : (
          <span className="w-[14px] shrink-0" />
        )}

        {isDirectory ? (
          expanded ? <FolderOpen size={15} className="shrink-0 text-[#e3b341]" /> : <Folder size={15} className="shrink-0 text-[#e3b341]" />
        ) : (
          <File size={15} className={`shrink-0 ${fileColor(node.name)}`} />
        )}

        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          level={level + 1}
          activeFilePath={activeFilePath}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
}

export default function FileExplorer({
  fileTree,
  activeFilePath,
  onRefresh,
  onCreateFolder,
  onCreateFile,
  onOpenFile,
}: FileExplorerProps) {
  async function handleCreateFile() {
    const name = prompt("File name");
    if (name) await onCreateFile(name);
  }

  async function handleCreateFolder() {
    const name = prompt("Folder name");
    if (name) await onCreateFolder(name);
  }

  return (
    <aside className="flex h-full min-w-0 flex-col bg-[#11161d]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#30363d] px-3">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-[#c9d1d9]">EXPLORER</span>
        <div className="flex items-center gap-0.5 text-[#8b949e]">
          <button type="button" title="New file" aria-label="New file" onClick={handleCreateFile} className="grid h-6 w-6 place-items-center rounded hover:bg-[#30363d] hover:text-white">
            <FilePlus2 size={15} />
          </button>
          <button type="button" title="New folder" aria-label="New folder" onClick={handleCreateFolder} className="grid h-6 w-6 place-items-center rounded hover:bg-[#30363d] hover:text-white">
            <FolderPlus size={15} />
          </button>
          <button type="button" title="Refresh explorer" aria-label="Refresh explorer" onClick={onRefresh} className="grid h-6 w-6 place-items-center rounded hover:bg-[#30363d] hover:text-white">
            <RefreshCw size={14} />
          </button>
          <button type="button" title="More actions" aria-label="More actions" className="grid h-6 w-6 place-items-center rounded hover:bg-[#30363d] hover:text-white">
            <Ellipsis size={15} />
          </button>
        </div>
      </div>

      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-[#30363d] px-3 text-[11px] font-medium text-[#c9d1d9]">
        <ChevronDown size={14} className="text-[#8b949e]" />
        <FolderOpen size={14} className="text-[#e3b341]" />
        WORKSPACE
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {fileTree.length > 0 ? (
          fileTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              activeFilePath={activeFilePath}
              onOpenFile={onOpenFile}
            />
          ))
        ) : (
          <div className="flex h-full min-h-44 flex-col items-center justify-center px-5 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-[#30363d] bg-[#161b22] text-[#4fc1ff]">
              <FileCode2 size={18} />
            </span>
            <p className="mt-3 text-xs font-medium text-[#c9d1d9]">Your workspace is empty</p>
            <p className="mt-1 text-[11px] leading-5 text-[#6e7681]">Create a file or folder to begin building.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
