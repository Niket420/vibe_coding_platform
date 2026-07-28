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
};

export default function PlaygroundPage() {
  const [webcontainer, setWebcontainer] =
    useState<WebContainer | null>(null);

  const [fileTree, setFileTree] =
    useState<FileTreeNode[]>([]);

  const [currentFile, setCurrentFile] =
    useState<OpenFile>({
      path: "",
      content: "",
    });

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

    const content = await webcontainer.fs.readFile(
      path,
      "utf-8"
    );

    setCurrentFile({
      path,
      content,
    });
  }

  useEffect(() => {
    async function init() {
      const wc = await getWebContainer();

      setWebcontainer(wc);

      await refreshFileTree(wc);
    }

    init();
  }, []);

  useEffect(() => {
    console.log(currentFile);
  }, [currentFile]);

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
      <Group orientation="vertical" className="flex-1">
        {/* Top */}
        <Panel defaultSize="75%">
          <Group>
            {/* Explorer */}
            <Panel defaultSize="18%" minSize="12%">
              <FileExplorer
                fileTree={fileTree}
                onRefresh={() => refreshFileTree(webcontainer)}
                onCreateFolder={createFolder}
                onCreateFile={createFile}
                onOpenFile={openFile}
              />
            </Panel>

            <Separator className="w-[2px] bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize" />

            {/* Editor */}
            <Panel defaultSize="52%" minSize="20%">
              <Editor value={currentFile.content} />
            </Panel>

            <Separator className="w-[2px] bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize" />

            {/* Preview */}
            <Panel defaultSize="30%" minSize="20%">
              <Preview />
            </Panel>
          </Group>
        </Panel>

        <Separator className="h-[2px] bg-zinc-800 hover:bg-blue-500 transition-colors cursor-row-resize" />

        {/* Terminal */}
        <Panel defaultSize="25%" minSize="12%">
          <IDETerminal
            onFilesystemChange={() =>
              refreshFileTree(webcontainer)
            }
          />
        </Panel>
      </Group>
    </div>
  );
}