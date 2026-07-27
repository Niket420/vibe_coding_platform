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

export default function IDETerminal({

  onFilesystemChange,

}: IDETerminalProps) {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let term: Terminal;
    let cancelled = false;

    async function init() {
      const webcontainer = await getWebContainer();

      // Stop if this component has already been cleaned up
      if (cancelled) return;

      let currentCommand = "";

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        theme: {
          background: "#1e1e1e",
        },
      });

      const fitAddon = new FitAddon();

      term.loadAddon(fitAddon);

      term.open(terminalRef.current!);

      requestAnimationFrame(() => {
        if (cancelled) return;

        fitAddon.fit();

        term.focus();
        term.writeln("Welcome to Codeforge 🚀");
        term.write("$ ");

        term.onData(async (data) => {
          // ENTER
          if (activeProcess) {
            await processInputWriter?.write(data);
            return;
          }

          if (data === "\r") {
            term.writeln("");

            const args = currentCommand.trim().split(" ");
            const command = args.shift();

            if (!command) {
              term.write("$ ");
              currentCommand = "";
              return;
            }

            try {

      activeProcess = await webcontainer.spawn(command, args);

      processInputWriter = activeProcess.input.getWriter();

      activeProcess.output.pipeTo(

        new WritableStream({

          write(data) {

            term.write(data);

          },

        })

      );

      const exitCode = await activeProcess.exit;
      await onFilesystemChange();

      processInputWriter.releaseLock();

      processInputWriter = null;

      activeProcess = null;

      term.writeln("");

      term.writeln(`Process exited with code ${exitCode}`);

    } catch (err) {

      term.writeln(`Error: ${err}`);

      activeProcess = null;

      processInputWriter = null;

    }

            currentCommand = "";
            term.write("$ ");
          }

          // BACKSPACE
          else if (data === "\x7f") {
            if (currentCommand.length > 0) {
              currentCommand = currentCommand.slice(0, -1);
              term.write("\b \b");
            }
          }

          // Ignore arrow keys
          else if (data.startsWith("\x1b")) {
            return;
          }

          // Normal character
          else {
            currentCommand += data;
            term.write(data);
          }
        });
      });
    }

    init();

    return () => {
      cancelled = true;
      processInputWriter?.releaseLock();
      term?.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="h-full w-full" />;
}