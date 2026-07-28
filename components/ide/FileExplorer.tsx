"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FolderPlus,
  FilePlus2,
  RefreshCw,
  Ellipsis,
} from "lucide-react";

import { FileTreeNode } from "@/types/file-tree";

type TreeNodeProps = {
  node: FileTreeNode;
  level: number;
  onOpenFile: (path: string) => Promise<void>;
};

type FileExplorerProps = {
  fileTree: FileTreeNode[];
  onRefresh: () => Promise<void>;
  onCreateFolder: (path: string) => Promise<void>;
  onCreateFile: (path: string) => Promise<void>;
  onOpenFile: (path: string) => Promise<void>;
};

function TreeNode({
  node,
  level,
  onOpenFile,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  const isDirectory = node.type === "directory";

  // Hide node_modules
  if (node.name === "node_modules") {
    return null;
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 h-7 px-2 cursor-pointer hover:bg-zinc-800 select-none text-sm text-zinc-200"
        style={{
          paddingLeft: `${level * 16 + 8}px`,
        }}
        onClick={async () => {
          if (isDirectory) {
            setExpanded(!expanded);
            return;
          }

          await onOpenFile(node.path);
        }}
      >
        {isDirectory ? (
          expanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )
        ) : (
          <div className="w-4" />
        )}

        {isDirectory ? (
          expanded ? (
            <FolderOpen size={16} />
          ) : (
            <Folder size={16} />
          )
        ) : (
          <File size={16} />
        )}

        <span>{node.name}</span>
      </div>

      {isDirectory &&
        expanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            level={level + 1}
            onOpenFile={onOpenFile}
          />
        ))}
    </div>
  );
}

export default function FileExplorer({
  fileTree,
  onRefresh,
  onCreateFolder,
  onCreateFile,
  onOpenFile,
}: FileExplorerProps) {
  return (
    <div className="h-full bg-[#181818] border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-zinc-800">
        <span className="text-xs tracking-widest font-semibold text-zinc-400">
          EXPLORER
        </span>

        <div className="flex items-center gap-2 text-zinc-400">
          <FilePlus2
            size={16}
            className="cursor-pointer hover:text-white"
            onClick={async () => {
              const name = prompt("File name");

              if (!name) return;

              await onCreateFile(name);
            }}
          />

          <FolderPlus
            size={16}
            className="cursor-pointer hover:text-white"
            onClick={async () => {
              const name = prompt("Folder name");

              if (!name) return;

              await onCreateFolder(name);
            }}
          />

          <RefreshCw
            size={16}
            className="cursor-pointer hover:text-white"
            onClick={onRefresh}
          />

          <Ellipsis
            size={16}
            className="cursor-pointer hover:text-white"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="overflow-auto py-2">
        {fileTree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  );
}