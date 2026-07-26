"use client";

import { useEffect,useRef,useState } from "react";
import { getWebContainer } from "@/lib/webcontainer";
import IDEHeader from "@/components/ide/IDEHeader";
import FileExplorer from "@/components/ide/FileExplorer";
import Editor from "@/components/ide/Editor";
import Preview from "@/components/ide/Preview";
import Terminal from "@/components/ide/Terminal";
import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";

export default function PlaygroundPage() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);

  useEffect(() => {
    async function init() {
      const wc = await getWebContainer();
      setWebcontainer(wc);
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
    <Group orientation="vertical" className="flex-1">

      {/* Top */}
      <Panel defaultSize="75%">

        <Group>

          {/* Explorer */}
          <Panel defaultSize="18%" minSize="12%">
            <FileExplorer />
          </Panel>

          <Separator className="w-[2px] bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Editor */}
          <Panel defaultSize="52%" minSize="20%">
            <Editor />
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
        <Terminal />
      </Panel>

    </Group>

  </div>
);
}