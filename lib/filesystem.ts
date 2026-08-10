import { WebContainer } from "@webcontainer/api";
import { FileTreeNode } from "@/types/file-tree";

const IGNORED_DIRS = new Set(["node_modules", ".git"]);

export async function readDirectory(
  webcontainer: WebContainer,
  path: string
): Promise<FileTreeNode[]> {
  const entries = await webcontainer.fs.readdir(path, {
    withFileTypes: true,
  });

  const tree: FileTreeNode[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;

    const fullPath =
      path === "."
        ? entry.name
        : `${path}/${entry.name}`;

    const node: FileTreeNode = {
      name: entry.name,
      path: fullPath,
      type: entry.isDirectory() ? "directory" : "file",
    };

    if (entry.isDirectory()) {
      node.children = await readDirectory(
        webcontainer,
        fullPath
      );
    }

    tree.push(node);
  }

  return tree;
}