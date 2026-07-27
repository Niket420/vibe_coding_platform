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

type FileExplorerProps = {
  fileTree: FileTreeNode[];
};

type TreeNodeProps = {
  node: FileTreeNode;
  level: number;
};

function TreeNode({ node, level }: TreeNodeProps) {
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
        onClick={() => {
          if (isDirectory) {
            setExpanded(!expanded);
          }
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
            key={child.name}
            node={child}
            level={level + 1}
          />
        ))}
    </div>
  );
}

export default function FileExplorer({
  fileTree,
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
          />

          <FolderPlus
            size={16}
            className="cursor-pointer hover:text-white"
          />

          <RefreshCw
            size={16}
            className="cursor-pointer hover:text-white"
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
            key={node.name}
            node={node}
            level={0}
          />
        ))}

      </div>

    </div>
  );
}