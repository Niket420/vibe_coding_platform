"use client";

import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import { getWebContainer } from "@/lib/webcontainer";
import { readDirectory } from "@/lib/filesystem";

import { FileTreeNode } from "@/types/file-tree";

import IDEHeader from "@/components/ide/IDEHeader";
import FileExplorer from "@/components/ide/FileExplorer";
import Editor from "@/components/ide/Editor";
import Preview from "@/components/ide/Preview";
import IDETerminal from "@/components/ide/Terminal";

import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";

type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

export default function PlaygroundPage() {
  const [webcontainer, setWebcontainer] =
    useState<WebContainer | null>(null);

  const [fileTree, setFileTree] =
    useState<FileTreeNode[]>([]);

  const [openedFiles, setOpenedFiles] =
    useState<OpenFile[]>([]);

  const [activeFilePath, setActiveFilePath] =
    useState("");

  const [bottomPanel, setBottomPanel] = useState<
    "terminal" | "preview"
  >("terminal");

  async function refreshFileTree(wc: WebContainer) {
    const tree = await readDirectory(wc, ".");
    setFileTree(tree);
  }

  async function createFolder(path: string) {
    if (!webcontainer) return;

    await webcontainer.fs.mkdir(path);
    await refreshFileTree(webcontainer);
  }

  async function createFile(path: string) {
    if (!webcontainer) return;

    await webcontainer.fs.writeFile(path, "");
    await refreshFileTree(webcontainer);
  }

  async function openFile(path: string) {
    if (!webcontainer) return;

    const existing = openedFiles.find(
      (file) => file.path === path
    );

    if (existing) {
      setActiveFilePath(path);
      return;
    }

    const content = await webcontainer.fs.readFile(
      path,
      "utf-8"
    );

    const file: OpenFile = {
      path,
      content,
      isDirty: false,
    };

    setOpenedFiles((prev) => [...prev, file]);
    setActiveFilePath(path);
  }

  useEffect(() => {
    async function init() {
      const wc = await getWebContainer();

      setWebcontainer(wc);

      await refreshFileTree(wc);
    }

    init();
  }, []);

  if (!webcontainer) {
    return <div>Loading IDE...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1e1e1e]">
      {/* Header */}
      <div className="h-12 shrink-0 border-b border-zinc-800">
        <IDEHeader />
      </div>

      {/* IDE */}
      <Group
        orientation="vertical"
        className="flex-1"
      >
        {/* Top Section */}
        <Panel defaultSize={75}>
          <Group>
            {/* Explorer */}
            <Panel defaultSize={18} minSize={12}>
              <FileExplorer
                fileTree={fileTree}
                onRefresh={() =>
                  refreshFileTree(webcontainer)
                }
                onCreateFolder={createFolder}
                onCreateFile={createFile}
                onOpenFile={openFile}
              />
            </Panel>

            <Separator className="w-[2px] bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize" />

            {/* Editor */}
            <Panel defaultSize={82} minSize={20}>
              <Editor
                webcontainer={webcontainer}
                openedFiles={openedFiles}
                setOpenedFiles={setOpenedFiles}
                activeFilePath={activeFilePath}
                setActiveFilePath={setActiveFilePath}
              />
            </Panel>
          </Group>
        </Panel>

        <Separator className="h-[2px] bg-zinc-800 hover:bg-blue-500 transition-colors cursor-row-resize" />

        {/* Bottom Section */}
        <Panel defaultSize={25} minSize={12}>
          <div className="h-full flex flex-col bg-[#181818]">
            {/* Tabs */}
            <div className="h-9 flex items-center border-b border-zinc-800 bg-[#252526]">
              <button
                onClick={() =>
                  setBottomPanel("terminal")
                }
                className={`px-4 h-full text-sm transition-colors ${
                  bottomPanel === "terminal"
                    ? "bg-[#1e1e1e] text-white border-t-2 border-blue-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Terminal
              </button>

              <button
                onClick={() =>
                  setBottomPanel("preview")
                }
                className={`px-4 h-full text-sm transition-colors ${
                  bottomPanel === "preview"
                    ? "bg-[#1e1e1e] text-white border-t-2 border-blue-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {bottomPanel === "terminal" ? (
                <IDETerminal
                  onFilesystemChange={() =>
                    refreshFileTree(webcontainer)
                  }
                />
              ) : (
                <Preview />
              )}
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}