"use client";

import { useEffect,useRef } from "react";
import { getWebContainer } from "@/lib/webcontainer";
import IDEHeader from "@/components/ide/IDEHeader";
import FileExplorer from "@/components/ide/FileExplorer";
import Editor from "@/components/ide/Editor";
import Preview from "@/components/ide/Preview";
import Terminal from "@/components/ide/Terminal";

export default function PlaygroundPage() {
  const booted = useRef(false);

  useEffect(() => {

    if (booted.current) return;

    booted.current = true;

    async function bootContainer() {

      console.log("Booting WebContainer...");

      const wc = await getWebContainer();

      console.log("WebContainer Ready!", wc);

    }

    bootContainer();

  }, []);
  
  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      <IDEHeader />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-zinc-800">
          <FileExplorer />
        </div>

        <div className="flex-1 border-r border-zinc-800">
          <Editor />
        </div>

        <div className="w-[420px]">
          <Preview />
        </div>
      </div>

      <div className="h-56 border-t border-zinc-800">
        <Terminal />
      </div>
    </div>
  );
}