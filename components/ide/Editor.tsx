"use client";

import { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { X } from "lucide-react";
import SaveDialog from "./SaveDialog";
import { WebContainer } from "@webcontainer/api";

type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

type EditorProps = {
  webcontainer: WebContainer | null;
  openedFiles: OpenFile[];
  setOpenedFiles: React.Dispatch<
    React.SetStateAction<OpenFile[]>
  >;
  activeFilePath: string;
  setActiveFilePath: React.Dispatch<
    React.SetStateAction<string>
  >;
};

export default function Editor({
  webcontainer,
  openedFiles,
  setOpenedFiles,
  activeFilePath,
  setActiveFilePath,
}: EditorProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [pendingClosePath, setPendingClosePath] =  useState<string | null>(null);

  const currentFile =
    openedFiles.find(
      (file) => file.path === activeFilePath
    ) ?? null;

   
  function closeTab(path: string) {
  const file = openedFiles.find((f) => f.path === path);

  if (!file) return;

  // Save dialog comes next.
  if (file.isDirty) {
    setPendingClosePath(path);
    return;
  }

  const remainingFiles = openedFiles.filter(
    (f) => f.path !== path
  );

  setOpenedFiles(remainingFiles);

  if (activeFilePath !== path) return;

  if (remainingFiles.length === 0) {
    setActiveFilePath("");
    return;
  }

  const closedIndex = openedFiles.findIndex(
    (f) => f.path === path
  );

  const nextFile =
    remainingFiles[closedIndex] ??
    remainingFiles[closedIndex - 1];

  setActiveFilePath(nextFile.path);
}

function forceCloseTab(path: string) {
  const remainingFiles = openedFiles.filter(
    (f) => f.path !== path
  );

  setOpenedFiles(remainingFiles);

  if (activeFilePath !== path) return;

  if (remainingFiles.length === 0) {
    setActiveFilePath("");
    return;
  }

  const closedIndex = openedFiles.findIndex(
    (f) => f.path === path
  );

  const nextFile =
    remainingFiles[closedIndex] ??
    remainingFiles[closedIndex - 1];

  setActiveFilePath(nextFile.path);
}

async function saveFile(path: string) {
  if (!webcontainer) return;

  const file = openedFiles.find((f) => f.path === path);

  if (!file) return;

  await webcontainer.fs.writeFile(path, file.content);

  setOpenedFiles((prev) =>
    prev.map((f) =>
      f.path === path
        ? {
            ...f,
            isDirty: false,
          }
        : f
    )
  );
}

useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "s"
    ) {
      e.preventDefault();

      if (!activeFilePath) return;

      saveFile(activeFilePath);
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };
}, [activeFilePath, openedFiles, webcontainer]);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="h-9 flex bg-[#252526] border-b border-zinc-800 overflow-x-auto overflow-y-hidden">
        {openedFiles.map((file) => {
          const isActive = file.path === activeFilePath;

          return (
            <div
              key={file.path}
              onClick={() => setActiveFilePath(file.path)}
              onMouseEnter={() => setHoveredTab(file.path)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`
                relative
                flex
                items-center
                justify-between
                min-w-[140px]
                max-w-[220px]
                h-full
                px-3
                border-r
                border-zinc-800
                cursor-pointer
                select-none
                transition-colors
                ${
                  isActive
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500 border-b-[#1e1e1e]"
                    : "bg-[#2d2d2d] text-zinc-400 hover:bg-[#252526] hover:text-white"
                }
              `}
            >
              <span className="truncate text-[13px]">
                {file.path.split("/").pop()}
              </span>

              <div className="w-4 flex items-center justify-center">
                {hoveredTab === file.path ? (
                  <X
  size={13}
  onClick={(e) => {
    e.stopPropagation();
    closeTab(file.path);
  }}
  className="text-zinc-400 hover:text-white"
/>
                ) : file.isDirty ? (
                  <span className="text-[10px] text-zinc-400">
                    ●
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monaco */}
      <div className="flex-1 bg-[#1e1e1e]">
        {currentFile ? (
          <MonacoEditor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={currentFile.content}
            onChange={(value) => {
              setOpenedFiles((prev) =>
                prev.map((file) =>
                  file.path === activeFilePath
                    ? {
                        ...file,
                        content: value ?? "",
                        isDirty: true,
                      }
                    : file
                )
              );
            }}
            options={{
              minimap: {
                enabled: false,
              },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            No file selected
          </div>
        )}
      </div>
      {pendingClosePath && (
  <SaveDialog
    fileName={pendingClosePath.split("/").pop()!}
    onCancel={() => setPendingClosePath(null)}
    onDiscard={() => {
      forceCloseTab(pendingClosePath);
      setPendingClosePath(null);
    }}
    onSave={async () => {
      if (!pendingClosePath) return;

      await saveFile(pendingClosePath);

      forceCloseTab(pendingClosePath);

      setPendingClosePath(null);
    }}
  />
)}
    </div>
    
  );
}