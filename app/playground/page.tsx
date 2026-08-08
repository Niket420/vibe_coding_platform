"use client";

import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import {
  Blocks,
  Code2,
  Files,
  GitBranch,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { getWebContainer } from "@/lib/webcontainer";
import { readDirectory } from "@/lib/filesystem";
import { FileTreeNode } from "@/types/file-tree";
import IDEHeader from "@/components/ide/IDEHeader";
import FileExplorer from "@/components/ide/FileExplorer";
import Editor from "@/components/ide/Editor";
import Preview from "@/components/ide/Preview";
import IDETerminal from "@/components/ide/Terminal";

type OpenFile = {
  path: string;
  content: string;
  isDirty: boolean;
};

const activityItems = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "source-control", label: "Source Control", icon: GitBranch },
  { id: "extensions", label: "Extensions", icon: Blocks },
  { id: "assistant", label: "Assistant", icon: Sparkles },
];

export default function PlaygroundPage() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [openedFiles, setOpenedFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState("");
  const [activeActivity, setActiveActivity] = useState("explorer");
  const [bottomPanel, setBottomPanel] = useState<"terminal" | "preview">(
    "terminal",
  );
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedType, setSelectedType] = useState<"file" | "directory" | "">(
    "",
  );

  async function refreshFileTree(wc: WebContainer) {
    const tree = await readDirectory(wc, ".");
    setFileTree(tree);
  }

  async function createFolder(path: string) {
    if (!webcontainer) return;

    await webcontainer.fs.mkdir(path, { recursive: true });
    await refreshFileTree(webcontainer);
  }

  async function createFile(path: string) {
    if (!webcontainer) return;

    await webcontainer.fs.writeFile(path, "");
    await refreshFileTree(webcontainer);
  }

  function closePathsUnder(path: string) {
    setOpenedFiles((previousFiles) =>
      previousFiles.filter(
        (file) => file.path !== path && !file.path.startsWith(`${path}/`),
      ),
    );
    setActiveFilePath((current) =>
      current === path || current.startsWith(`${path}/`) ? "" : current,
    );
  }

  async function deletePath(path: string) {
    if (!webcontainer) return;

    await webcontainer.fs.rm(path, { recursive: true, force: true });
    closePathsUnder(path);
    await refreshFileTree(webcontainer);
  }

  async function renamePath(oldPath: string, newPath: string) {
    if (!webcontainer) return;

    await webcontainer.fs.rename(oldPath, newPath);

    const remap = (path: string) =>
      path === oldPath
        ? newPath
        : path.startsWith(`${oldPath}/`)
          ? newPath + path.slice(oldPath.length)
          : path;

    setOpenedFiles((previousFiles) =>
      previousFiles.map((file) => ({ ...file, path: remap(file.path) })),
    );
    setActiveFilePath((current) => remap(current));
    await refreshFileTree(webcontainer);
  }

  async function openFile(path: string) {
    if (!webcontainer) return;

    const existing = openedFiles.find((file) => file.path === path);

    if (existing) {
      setActiveFilePath(path);
      return;
    }

    const content = await webcontainer.fs.readFile(path, "utf-8");

    setOpenedFiles((previousFiles) => [
      ...previousFiles,
      { path, content, isDirty: false },
    ]);
    setActiveFilePath(path);
  }

  useEffect(() => {
    async function init() {
      const wc = await getWebContainer();
      wc.on("server-ready", (port, url) => {
        console.log(port, url);
        setPreviewUrl(url);
      });
      setWebcontainer(wc);
      await refreshFileTree(wc);
    }

    init();
  }, []);

  if (!webcontainer) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d1117] text-[#c9d1d9]">
        <div className="flex flex-col items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#007acc] text-white shadow-xl shadow-[#007acc]/25">
            <Code2 size={25} />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              Preparing your workspace
            </p>
            <p className="mt-1 text-xs text-[#8b949e]">
              Booting the browser development environment…
            </p>
          </div>
          <span className="h-1 w-32 overflow-hidden rounded-full bg-[#21262d]">
            <span className="block h-full w-2/3 animate-pulse rounded-full bg-[#007acc]" />
          </span>
        </div>
      </main>
    );
  }
  console.log("Playground previewUrl:", previewUrl);
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#0d1117] font-sans text-[#e6edf3]">
      <header className="h-12 shrink-0 border-b border-[#30363d]">
        <IDEHeader onRun={() => setBottomPanel("terminal")} />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="z-10 flex w-12 shrink-0 flex-col items-center border-r border-[#30363d] bg-[#11161d] py-3">
          <div className="mb-4 grid h-8 w-8 place-items-center rounded-md bg-[#007acc] text-white shadow-lg shadow-[#007acc]/25">
            <Code2 size={18} />
          </div>

          <nav className="flex flex-1 flex-col items-center gap-1">
            {activityItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeActivity === id;

              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => setActiveActivity(id)}
                  className={`relative grid h-10 w-10 place-items-center rounded-md transition ${
                    isActive
                      ? "text-white"
                      : "text-[#7d8590] hover:bg-[#21262d] hover:text-[#c9d1d9]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 h-6 w-0.5 rounded-r-full bg-[#007acc]" />
                  )}
                  <Icon size={20} strokeWidth={1.8} />
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            title="Manage"
            aria-label="Manage"
            className="grid h-10 w-10 place-items-center rounded-md text-[#7d8590] transition hover:bg-[#21262d] hover:text-[#c9d1d9]"
          >
            <Settings2 size={19} strokeWidth={1.8} />
          </button>
        </aside>

        <Group orientation="vertical" className="min-h-0 flex-1">
          <Panel defaultSize={74} minSize={35}>
            <Group>
              <Panel defaultSize={20} minSize={14}>
                <FileExplorer
                  fileTree={fileTree}
                  activeFilePath={activeFilePath}
                  onRefresh={() => refreshFileTree(webcontainer)}
                  onCreateFolder={createFolder}
                  onCreateFile={createFile}
                  onOpenFile={openFile}
                  onDeletePath={deletePath}
                  onRenamePath={renamePath}
                  selectedPath={selectedPath}
                  setSelectedPath={setSelectedPath}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                />
              </Panel>

              <Separator className="w-px bg-[#30363d] transition-colors hover:bg-[#007acc]" />

              <Panel defaultSize={80} minSize={28}>
                <Editor
                  webcontainer={webcontainer}
                  openedFiles={openedFiles}
                  setOpenedFiles={setOpenedFiles}
                  activeFilePath={activeFilePath}
                  setActiveFilePath={setActiveFilePath}
                />
              </Panel>
            </Group>
          </Panel>

          <Separator className="h-px bg-[#30363d] transition-colors hover:bg-[#007acc]" />

          <Panel defaultSize={26} minSize={13}>
            <section className="flex h-full flex-col bg-[#11161d]">
              <div className="flex h-9 shrink-0 items-center border-b border-[#30363d] bg-[#161b22] px-1">
                <button
                  onClick={() => setBottomPanel("terminal")}
                  className={`relative h-full px-3 text-xs font-medium transition ${
                    bottomPanel === "terminal"
                      ? "text-[#e6edf3]"
                      : "text-[#8b949e] hover:text-[#c9d1d9]"
                  }`}
                >
                  TERMINAL
                  {bottomPanel === "terminal" && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#007acc]" />
                  )}
                </button>
                <button
                  onClick={() => setBottomPanel("preview")}
                  className={`relative h-full px-3 text-xs font-medium transition ${
                    bottomPanel === "preview"
                      ? "text-[#e6edf3]"
                      : "text-[#8b949e] hover:text-[#c9d1d9]"
                  }`}
                >
                  PREVIEW
                  {bottomPanel === "preview" && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#007acc]" />
                  )}
                </button>
                <span className="ml-auto pr-3 text-[10px] text-[#6e7681]">
                  webcontainer
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
  <div className={bottomPanel === "terminal" ? "h-full" : "hidden"}>
    <IDETerminal
      onFilesystemChange={() => refreshFileTree(webcontainer)}
    />
  </div>

  <div className={bottomPanel === "preview" ? "h-full" : "hidden"}>
    <Preview previewUrl={previewUrl} />
  </div>
</div>

            </section>
          </Panel>
        </Group>
      </div>

      <footer className="flex h-6 shrink-0 items-center justify-between bg-[#007acc] px-3 text-[10px] font-medium text-white">
        <span className="flex items-center gap-1.5">
          <GitBranch size={12} /> main
        </span>
        <span className="hidden sm:inline">No problems detected</span>
        <span>Spaces: 2 &nbsp; UTF-8</span>
      </footer>
    </main>
  );
}
