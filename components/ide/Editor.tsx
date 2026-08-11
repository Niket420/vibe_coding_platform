"use client";

import { useCallback, useEffect, useState } from "react";
import MonacoEditor, { DiffEditor } from "@monaco-editor/react";
import { FileCode2, GitCompare, X } from "lucide-react";
import { WebContainer } from "@webcontainer/api";
import SaveDialog from "./SaveDialog";

type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

export type DiffTab = {
  id: string;
  path: string;
  label: string;
  original: string;
  modified: string;
};

type EditorProps = {
  webcontainer: WebContainer | null;
  openedFiles: OpenFile[];
  setOpenedFiles: React.Dispatch<React.SetStateAction<OpenFile[]>>;
  activeFilePath: string;
  setActiveFilePath: React.Dispatch<React.SetStateAction<string>>;
  diffTabs: DiffTab[];
  setDiffTabs: React.Dispatch<React.SetStateAction<DiffTab[]>>;
  activeDiffId: string | null;
  setActiveDiffId: React.Dispatch<React.SetStateAction<string | null>>;
};

const languagesByExtension: Record<string, string> = {
  css: "css",
  html: "html",
  js: "javascript",
  json: "json",
  jsx: "javascript",
  md: "markdown",
  ts: "typescript",
  tsx: "typescript",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
};

function languageForPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return languagesByExtension[extension] ?? "plaintext";
}

export default function Editor({
  webcontainer,
  openedFiles,
  setOpenedFiles,
  activeFilePath,
  setActiveFilePath,
  diffTabs,
  setDiffTabs,
  activeDiffId,
  setActiveDiffId,
}: EditorProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [pendingClosePath, setPendingClosePath] = useState<string | null>(null);
  const activeDiff = diffTabs.find((diff) => diff.id === activeDiffId) ?? null;
  const currentFile = activeDiff ? null : openedFiles.find((file) => file.path === activeFilePath) ?? null;

  function closeDiffTab(id: string) {
    setDiffTabs((previousDiffs) => previousDiffs.filter((diff) => diff.id !== id));
    if (activeDiffId === id) setActiveDiffId(null);
  }

  const saveFile = useCallback(async (path: string) => {
    if (!webcontainer) return;

    const file = openedFiles.find((openedFile) => openedFile.path === path);
    if (!file) return;

    await webcontainer.fs.writeFile(path, file.content);
    setOpenedFiles((previousFiles) => previousFiles.map((openedFile) => (
      openedFile.path === path ? { ...openedFile, isDirty: false } : openedFile
    )));
  }, [openedFiles, setOpenedFiles, webcontainer]);

  function closeTab(path: string) {
    const file = openedFiles.find((openedFile) => openedFile.path === path);
    if (!file) return;

    if (file.isDirty) {
      setPendingClosePath(path);
      return;
    }

    forceCloseTab(path);
  }

  function forceCloseTab(path: string) {
    const remainingFiles = openedFiles.filter((file) => file.path !== path);
    setOpenedFiles(remainingFiles);

    if (activeFilePath !== path) return;

    if (remainingFiles.length === 0) {
      setActiveFilePath("");
      return;
    }

    const closedIndex = openedFiles.findIndex((file) => file.path === path);
    const nextFile = remainingFiles[closedIndex] ?? remainingFiles[closedIndex - 1];
    setActiveFilePath(nextFile.path);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;

      event.preventDefault();
      if (activeFilePath && !activeDiffId) void saveFile(activeFilePath);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFilePath, activeDiffId, saveFile]);

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#0d1117]">
      <div className="flex h-9 shrink-0 overflow-x-auto border-b border-[#30363d] bg-[#161b22]">
        {openedFiles.length === 0 && diffTabs.length === 0 ? (
          <span className="flex items-center px-3 text-[11px] text-[#6e7681]">No open editors</span>
        ) : (
          <>
            {openedFiles.map((file) => {
              const isActive = !activeDiff && file.path === activeFilePath;

              return (
                <div
                  key={file.path}
                  onClick={() => {
                    setActiveDiffId(null);
                    setActiveFilePath(file.path);
                  }}
                  onMouseEnter={() => setHoveredTab(file.path)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`group relative flex h-full min-w-[140px] max-w-[220px] cursor-pointer items-center gap-2 border-r border-[#30363d] px-3 text-[12px] transition ${
                    isActive
                      ? "bg-[#0d1117] text-[#e6edf3]"
                      : "bg-[#161b22] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#c9d1d9]"
                  }`}
                >
                  {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-[#007acc]" />}
                  <FileCode2 size={14} className="shrink-0 text-[#4fc1ff]" />
                  <span className="min-w-0 flex-1 truncate">{file.path.split("/").pop()}</span>
                  <span className="grid h-4 w-4 shrink-0 place-items-center">
                    {hoveredTab === file.path ? (
                      <button
                        type="button"
                        aria-label={`Close ${file.path.split("/").pop()}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          closeTab(file.path);
                        }}
                        className="grid h-4 w-4 place-items-center rounded text-[#8b949e] hover:bg-[#30363d] hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    ) : file.isDirty ? (
                      <span className="text-[10px] text-[#c9d1d9]">●</span>
                    ) : null}
                  </span>
                </div>
              );
            })}

            {diffTabs.map((diff) => {
              const isActive = diff.id === activeDiffId;

              return (
                <div
                  key={diff.id}
                  onClick={() => setActiveDiffId(diff.id)}
                  onMouseEnter={() => setHoveredTab(diff.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`group relative flex h-full min-w-[140px] max-w-[220px] cursor-pointer items-center gap-2 border-r border-[#30363d] px-3 text-[12px] transition ${
                    isActive
                      ? "bg-[#0d1117] text-[#e6edf3]"
                      : "bg-[#161b22] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#c9d1d9]"
                  }`}
                >
                  {isActive && <span className="absolute inset-x-0 top-0 h-0.5 bg-[#a371f7]" />}
                  <GitCompare size={14} className="shrink-0 text-[#a371f7]" />
                  <span className="min-w-0 flex-1 truncate">{diff.label}</span>
                  <button
                    type="button"
                    aria-label={`Close ${diff.label}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeDiffTab(diff.id);
                    }}
                    className="grid h-4 w-4 shrink-0 place-items-center rounded text-[#8b949e] opacity-0 hover:bg-[#30363d] hover:text-white group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 bg-[#0d1117]">
        {activeDiff ? (
          <DiffEditor
            height="100%"
            language={languageForPath(activeDiff.path)}
            theme="vs-dark"
            original={activeDiff.original}
            modified={activeDiff.modified}
            options={{
              automaticLayout: true,
              fontFamily: "var(--font-geist-mono), Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
              minimap: { enabled: false },
              readOnly: true,
              renderSideBySide: true,
            }}
          />
        ) : currentFile ? (
          <MonacoEditor
            height="100%"
            language={languageForPath(currentFile.path)}
            theme="vs-dark"
            value={currentFile.content}
            onChange={(value) => {
              setOpenedFiles((previousFiles) => previousFiles.map((file) => (
                file.path === activeFilePath
                  ? { ...file, content: value ?? "", isDirty: true }
                  : file
              )));
            }}
            options={{
              automaticLayout: true,
              fontFamily: "var(--font-geist-mono), Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
              lineHeight: 22,
              minimap: { enabled: false },
              padding: { top: 14 },
              smoothScrolling: true,
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#30363d] bg-[#161b22] text-[#4fc1ff] shadow-lg shadow-black/20">
              <FileCode2 size={22} />
            </span>
            <p className="mt-4 text-sm font-medium text-[#c9d1d9]">Ready for your next file</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-[#6e7681]">Select a file in Explorer or create a new one to start coding.</p>
            <kbd className="mt-5 rounded border border-[#30363d] bg-[#161b22] px-2 py-1 font-mono text-[10px] text-[#8b949e]">⌘ P</kbd>
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
            await saveFile(pendingClosePath);
            forceCloseTab(pendingClosePath);
            setPendingClosePath(null);
          }}
        />
      )}
    </section>
  );
}
