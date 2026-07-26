"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getWebContainer } from "@/lib/webcontainer";

import "@xterm/xterm/css/xterm.css";

export default function IDETerminal() {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let term: Terminal;

    async function init() {
      const webcontainer = await getWebContainer();

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
        fitAddon.fit();

        term.focus();
        term.writeln("Welcome to CodeForge 🚀");
        term.write("$ ");

        term.onData(async (data) => {
          // ENTER
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
              const process = await webcontainer.spawn(command, args);

              process.output.pipeTo(
                new WritableStream({
                  write(data) {
                    term.write(data);
                  },
                })
              );

              const exitCode = await process.exit;

              term.writeln("");
              term.writeln(`Process exited with code ${exitCode}`);
            } catch (err) {
              term.writeln(`Error: ${err}`);
            }

            currentCommand = "";
            term.write("$ ");
            return;
          }

          // BACKSPACE
          if (data === "\x7f") {
            if (currentCommand.length > 0) {
              currentCommand = currentCommand.slice(0, -1);
              term.write("\b \b");
            }
            return;
          }

          // Ignore arrow keys and other escape sequences
          if (data.startsWith("\x1b")) {
            return;
          }

          // Normal character
          currentCommand += data;
          term.write(data);
        });
      });
    }

    init();

    return () => {
      term?.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="h-full w-full" />;
}