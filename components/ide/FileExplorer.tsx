// "use client";

// import {
//   ChevronDown,
//   FilePlus,
//   FolderPlus,
//   RefreshCw,
//   ChevronsDown,
// } from "lucide-react";

// export default function FileExplorer() {
//   function handleNewFile() {
//     console.log("New File");
//   }

//   function handleNewFolder() {
//     console.log("New Folder");
//   }

//   function handleRefresh() {
//     console.log("Refresh");
//   }

//   function handleCollapseAll() {
//     console.log("Collapse All");
//   }

//   return (
//     <div className="h-full bg-[#181818] text-gray-300 border-r border-zinc-800">
//       {/* Explorer Header */}
//       <div className="flex items-center justify-between h-10 px-3 border-b border-zinc-800">
//         <h2 className="text-xs font-semibold tracking-wider text-gray-400">
//           EXPLORER
//         </h2>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleNewFile}
//             className="p-1 rounded hover:bg-zinc-700"
//           >
//             <FilePlus size={16} />
//           </button>

//           <button
//             onClick={handleNewFolder}
//             className="p-1 rounded hover:bg-zinc-700"
//           >
//             <FolderPlus size={16} />
//           </button>

//           <button
//             onClick={handleRefresh}
//             className="p-1 rounded hover:bg-zinc-700"
//           >
//             <RefreshCw size={16} />
//           </button>

//           <button
//             onClick={handleCollapseAll}
//             className="p-1 rounded hover:bg-zinc-700"
//           >
//             <ChevronsDown size={16} />
//           </button>
//         </div>
//       </div>

//       {/* Project Header */}
//       <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800">
//         <ChevronDown size={16} />

//         <span className="font-medium text-[15px]">Projects</span>
//       </div>

//       {/* Tree will come here */}
//     </div>
//   );
// }
import { FileTreeNode } from "@/types/file-tree";

type FileExplorerProps = {
  fileTree: FileTreeNode[];
};

function Tree({ nodes, level = 0 }: { nodes: FileTreeNode[]; level?: number }) {
  const filteredNodes = nodes.filter(
  (node) => node.name !== "node_modules"
);
  return (
    <>
      {filteredNodes.map((node) => (
        <div key={`${level}-${node.name}`}>
          <div
            style={{ paddingLeft: `${level * 16}px` }}
            className="py-1"
          >
            {node.type === "directory" ? "📁" : "📄"} {node.name}
          </div>

          {node.type === "directory" &&
            node.children &&
            node.children.length > 0 && (
              <Tree
                nodes={node.children}
                level={level + 1}
              />
            )}
        </div>
      ))}
    </>
  );
}

export default function FileExplorer({
  fileTree,
}: FileExplorerProps) {
  return (
    <div className="h-full overflow-auto text-sm text-white p-2">
      <Tree nodes={fileTree} />
    </div>
  );
}