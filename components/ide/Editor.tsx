"use client";

import MonacoEditor from "@monaco-editor/react";

type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

type EditorProps = {
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
  openedFiles,
  setOpenedFiles,
  activeFilePath,
  setActiveFilePath,
}: EditorProps) {
  const currentFile =
    openedFiles.find(
      (file) => file.path === activeFilePath
    ) ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="h-9 flex border-b border-zinc-800 bg-[#252526] overflow-x-auto">
        {openedFiles.map((file) => (
          <div
            key={file.path}
            onClick={() => setActiveFilePath(file.path)}
            className={`flex items-center gap-2 px-4 cursor-pointer border-r border-zinc-800 text-sm whitespace-nowrap ${
              file.path === activeFilePath
                ? "bg-[#1e1e1e] text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>{file.path.split("/").pop()}</span>

            {file.isDirty && (
              <span className="text-zinc-400">●</span>
            )}
          </div>
        ))}
      </div>

      {/* Monaco */}
      <div className="flex-1">
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
    </div>
  );
}