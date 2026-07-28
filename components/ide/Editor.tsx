"use client";

import MonacoEditor from "@monaco-editor/react";

type EditorProps = {
  value: string;
};

export default function Editor({
  value,
}: EditorProps) {
  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={value}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          automaticLayout: true,
        }}
      />
    </div>
  );
}