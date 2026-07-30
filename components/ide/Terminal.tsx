"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getWebContainer } from "@/lib/webcontainer";
import { WebContainerProcess } from "@webcontainer/api";
import "@xterm/xterm/css/xterm.css";

let activeProcess: WebContainerProcess | null = null;
let processInputWriter: WritableStreamDefaultWriter<string> | null = null;

type IDETerminalProps = {
  onFilesystemChange: () => Promise<void>;
};

export default function IDETerminal({ onFilesystemChange }: IDETerminalProps) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const filesystemChangeRef = useRef(onFilesystemChange);

  useEffect(() => {
    filesystemChangeRef.current = onFilesystemChange;
  }, [onFilesystemChange]);

  useEffect(() => {
    if (!terminalRef.current) return;

    let term: Terminal | null = null;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      const webcontainer = await getWebContainer();
      if (cancelled || !terminalRef.current) return;

      let currentCommand = "";
      term = new Terminal({
        cursorBlink: true,
        fontFamily: "var(--font-geist-mono), Menlo, Monaco, Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.35,
        theme: {
          background: "#0d1117",
          black: "#0d1117",
          brightBlack: "#6e7681",
          cursor: "#e6edf3",
          foreground: "#c9d1d9",
          green: "#3fb950",
          red: "#ff7b72",
          selectionBackground: "#1f6feb66",
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      requestAnimationFrame(() => {
        if (cancelled) return;
        fitAddon.fit();
        term?.focus();
      });

      resizeObserver = new ResizeObserver(() => fitAddon.fit());
      resizeObserver.observe(terminalRef.current);

      term.writeln("\x1b[1;34mCodeForge terminal\x1b[0m  —  your browser workspace is ready.");
      term.writeln("\x1b[90mRun a command to get started.\x1b[0m");
      term.write("\x1b[32m❯\x1b[0m ");

      term.onData(async (data) => {
        if (!term) return;

        if (activeProcess) {
          await processInputWriter?.write(data);
          return;
        }

        if (data === "\r") {
          term.writeln("");

          const [command, ...args] = currentCommand.trim().split(" ");
          if (!command) {
            term.write("\x1b[32m❯\x1b[0m ");
            currentCommand = "";
            return;
          }

          try {
            activeProcess = await webcontainer.spawn(command, args);
            processInputWriter = activeProcess.input.getWriter();

            void activeProcess.output.pipeTo(new WritableStream({
              write(output) {
                term?.write(output);
              },
            }));

            const exitCode = await activeProcess.exit;
            await filesystemChangeRef.current();

            processInputWriter?.releaseLock();
            processInputWriter = null;
            activeProcess = null;
            term.writeln("");
            term.writeln(`\x1b[90mProcess exited with code ${exitCode}\x1b[0m`);
          } catch (error) {
            term.writeln(`\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m`);
            activeProcess = null;
            processInputWriter = null;
          }

          currentCommand = "";
          term.write("\x1b[32m❯\x1b[0m ");
          return;
        }

        if (data === "\x7f") {
          if (currentCommand.length > 0) {
            currentCommand = currentCommand.slice(0, -1);
            term.write("\b \b");
          }
          return;
        }

        if (data.startsWith("\x1b")) return;

        currentCommand += data;
        term.write(data);
      });
    }

    void init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      processInputWriter?.releaseLock();
      term?.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="h-full w-full bg-[#0d1117] p-1" />;
}
