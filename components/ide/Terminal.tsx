"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getWebContainer } from "@/lib/webcontainer";
import { WebContainerProcess } from "@webcontainer/api";
import "@xterm/xterm/css/xterm.css";

// Kept at module scope so the jsh session (and anything running inside it,
// e.g. a dev server) survives this component unmounting when the user
// switches to the Preview tab.
let shellProcess: WebContainerProcess | null = null;
let shellInput: WritableStreamDefaultWriter<string> | null = null;
let attachedTerminal: Terminal | null = null;

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

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const term = new Terminal({
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

    async function init() {
      const webcontainer = await getWebContainer();
      if (cancelled) return;

      requestAnimationFrame(() => {
        if (cancelled) return;
        fitAddon.fit();
        term.focus();
        shellProcess?.resize({ cols: term.cols, rows: term.rows });
      });

      resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
        shellProcess?.resize({ cols: term.cols, rows: term.rows });
      });
      resizeObserver.observe(terminalRef.current!);

      attachedTerminal = term;

      if (!shellProcess) {
        shellProcess = await webcontainer.spawn("jsh", {
          terminal: { cols: term.cols, rows: term.rows },
        });
        shellInput = shellProcess.input.getWriter();

        void shellProcess.output.pipeTo(
          new WritableStream({
            write(chunk) {
              attachedTerminal?.write(chunk);
            },
          }),
        );

        void shellProcess.exit.then(() => {
          attachedTerminal?.writeln("\r\n\x1b[90mShell exited.\x1b[0m");
          shellProcess = null;
          shellInput = null;
        });
      }

      term.onData((data) => {
        void shellInput?.write(data);
      });

      webcontainer.fs.watch(".", { recursive: true }, () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => void filesystemChangeRef.current(), 400);
      });
    }

    void init();

    return () => {
      cancelled = true;
      clearTimeout(refreshTimeout);
      resizeObserver?.disconnect();
      if (attachedTerminal === term) attachedTerminal = null;
      term.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="h-full w-full bg-[#0d1117] p-1" />;
}
