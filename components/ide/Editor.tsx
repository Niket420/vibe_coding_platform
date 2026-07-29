"use client";

import MonacoEditor from "@monaco-editor/react";

type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

type EditorProps = {
  currentFile: OpenFile;
  setCurrentFile: React.Dispatch<
    React.SetStateAction<OpenFile>
  >;
};

export default function Editor({
  currentFile,
  setCurrentFile,
}: EditorProps) {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Tab */}
      <div className="h-9 shrink-0 border-b border-zinc-800 flex items-center px-4 text-sm bg-[#252526]">
        <span className="text-zinc-200">
          {currentFile.path
            ? currentFile.path.split("/").pop()
            : "No file selected"}
        </span>

        {currentFile.isDirty && (
          <span className="ml-2 text-zinc-400">●</span>
        )}
      </div>

      {/* Monaco */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={currentFile.content}
          onChange={(value) =>
            setCurrentFile({
              ...currentFile,
              content: value ?? "",
              isDirty: true,
            })
          }
          options={{
            minimap: {
              enabled: false,
            },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}