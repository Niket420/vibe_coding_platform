"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Blocks,
  BookOpen,
  ChevronRight,
  Clock3,
  Code2,
  Command,
  FileCode2,
  FolderOpen,
  GitBranch,
  Grid2X2,
  LayoutPanelLeft,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import TemplateSelector from "@/components/dashboard/TemplateSelector";

const activityItems = [
  { label: "Explorer", icon: LayoutPanelLeft },
  { label: "Search", icon: Search },
  { label: "Source Control", icon: GitBranch },
  { label: "Extensions", icon: Blocks },
];

const projects = [
  {
    name: "portfolio-studio",
    description: "Personal portfolio redesign",
    language: "TypeScript",
    updated: "Edited 2h ago",
  },
  {
    name: "ai-chat-interface",
    description: "Streaming assistant workspace",
    language: "React",
    updated: "Edited yesterday",
  },
  {
    name: "expense-tracker",
    description: "A simple finance dashboard",
    language: "Next.js",
    updated: "Edited 3d ago",
  },
];

export default function DashboardPage() {
  const [activeActivity, setActiveActivity] = useState("Explorer");
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();

  function requireAuth(action: () => void) {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    action();
  }

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#000000] text-[#e6edf3]">
      <aside className="z-20 flex w-12 shrink-0 flex-col items-center border-r border-[#262626] bg-[#0a0a0a] py-3">
        <div className="mb-5 grid h-8 w-8 place-items-center rounded-md bg-white text-black shadow-lg shadow-black/40">
          <Code2 size={18} />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {activityItems.map(({ label, icon: Icon }) => {
            const isActive = label === activeActivity;

            return (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setActiveActivity(label)}
                className={`group relative grid h-11 w-11 place-items-center rounded-md transition ${
                  isActive
                    ? "text-white"
                    : "text-[#7d8590] hover:bg-[#1a1a1a] hover:text-[#c9d1d9]"
                }`}
              >
                {isActive && <span className="absolute left-0 h-7 w-0.5 rounded-r-full bg-white" />}
                <Icon size={21} strokeWidth={1.8} />
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          className="grid h-11 w-11 place-items-center rounded-md text-[#7d8590] transition hover:bg-[#1a1a1a] hover:text-[#c9d1d9]"
        >
          <Settings size={20} strokeWidth={1.8} />
        </button>
      </aside>

      <aside className="hidden w-64 shrink-0 border-r border-[#262626] bg-[#0a0a0a] lg:flex lg:flex-col">
        <div className="flex h-12 items-center border-b border-[#262626] px-4">
          <span className="text-xs font-semibold tracking-[0.12em] text-[#c9d1d9]">EXPLORER</span>
          <MoreHorizontal size={18} className="ml-auto text-[#8b949e]" />
        </div>

        <div className="px-3 py-4">
          <p className="px-2 text-[10px] font-semibold tracking-[0.14em] text-[#8b949e]">WORKSPACE</p>
          <button className="mt-2 flex w-full items-center gap-2 rounded-md bg-[#1a1a1a] px-2 py-2 text-left text-sm text-[#f0f6fc]">
            <FolderOpen size={16} className="text-[#e3b341]" />
            codeforge-projects
          </button>
          <div className="mt-1 space-y-0.5">
            {projects.map((project) => (
              <button
                key={project.name}
                onClick={() => requireAuth(() => router.push("/playground"))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#8b949e] transition hover:bg-[#1a1a1a] hover:text-[#c9d1d9]"
              >
                <FileCode2 size={15} className="text-[#8b949e]" />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-[#262626] p-3">
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-[#8b949e] transition hover:bg-[#1a1a1a] hover:text-[#c9d1d9]">
            <BookOpen size={16} />
            Learn CodeForge
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#262626] bg-[#0a0a0a] px-3 sm:px-5">
          <button
            type="button"
            aria-label="Open menu"
            className="grid h-8 w-8 place-items-center rounded-md text-[#8b949e] hover:bg-[#1a1a1a] hover:text-[#c9d1d9] lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[#8b949e]">
            <Grid2X2 size={16} className="text-[#8b949e]" />
            <span className="hidden sm:inline">CodeForge</span>
            <ChevronRight size={14} className="hidden sm:inline" />
            <span className="truncate text-[#c9d1d9]">Workspace overview</span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-8 w-8 place-items-center rounded-md text-[#8b949e] hover:bg-[#1a1a1a] hover:text-[#c9d1d9]"
          >
            <Bell size={17} />
          </button>
          {isSignedIn ? (
            <UserButton />
          ) : (
            <button
              onClick={() => openSignIn()}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-[#c9d1d9] transition hover:bg-[#1a1a1a] hover:text-white"
            >
              Sign in
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
            <div className="cf-fade-up flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#0a0a0a] px-3 py-1 text-xs font-medium text-[#c9d1d9]">
                  <Sparkles size={13} />
                  Your development command center
                </div>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Welcome back.</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#8b949e] sm:text-base">
                  Pick up where you left off, start a fresh workspace, or bring an existing repository into CodeForge.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                <Command size={14} />
                <span>Everything is ready.</span>
              </div>
            </div>

            <section className="cf-fade-up mt-10 grid gap-4 md:grid-cols-2" style={{ animationDelay: "80ms" }}>
              <button
                onClick={() => requireAuth(() => setTemplateSelectorOpen(true))}
                className="group relative overflow-hidden rounded-xl border border-[#333333] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 text-left shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:border-[#525252] hover:shadow-white/5 sm:p-7"
              >
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5 blur-2xl transition group-hover:bg-white/10" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-black shadow-lg shadow-black/40">
                    <Plus size={22} />
                  </span>
                  <ArrowUpRight />
                </div>
                <h2 className="relative mt-7 text-xl font-semibold text-white">New project</h2>
                <p className="relative mt-2 max-w-sm text-sm leading-6 text-[#8b949e]">Begin with a clean template for your next product idea.</p>
              </button>

              <button
                onClick={() => requireAuth(() => router.push("/playground"))}
                className="group rounded-xl border border-[#262626] bg-[#121212] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#59636e] hover:bg-[#1a1a1a] sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-[#333333] bg-[#1a1a1a] text-[#c9d1d9]">
                    <GitBranch size={21} />
                  </span>
                  <ArrowUpRight className="text-[#8b949e] transition group-hover:text-white" />
                </div>
                <h2 className="mt-7 text-xl font-semibold text-white">Import repository</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#8b949e]">Open an existing codebase and continue from exactly where you stopped.</p>
              </button>
            </section>

            <section className="mt-12">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent work</h2>
                  <p className="mt-1 text-sm text-[#8b949e]">Your most recently opened workspaces.</p>
                </div>
                <button className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-[#c9d1d9] transition hover:bg-[#1a1a1a] hover:text-white sm:flex">
                  View all
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#121212]">
                {projects.map((project, index) => (
                  <button
                    key={project.name}
                    onClick={() => requireAuth(() => router.push("/playground"))}
                    className={`group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[#1a1a1a] sm:px-5 ${
                      index !== projects.length - 1 ? "border-b border-[#262626]" : ""
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#262626] bg-[#1a1a1a] text-white">
                      <FileCode2 size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#e6edf3]">{project.name}</span>
                      <span className="mt-1 block truncate text-xs text-[#8b949e]">{project.description}</span>
                    </span>
                    <span className="hidden items-center gap-2 text-xs text-[#8b949e] sm:flex">
                      <span className="rounded-full bg-[#1a1a1a] px-2 py-1 text-[#a8b1bb]">{project.language}</span>
                      <Clock3 size={14} />
                      {project.updated}
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-[#6e7681] transition group-hover:translate-x-0.5 group-hover:text-[#c9d1d9]" />
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8 flex flex-col gap-4 rounded-xl border border-[#262626] bg-[#0a0a0a] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#1a1a1a] text-white">
                  <Star size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#e6edf3]">Make this workspace yours</p>
                  <p className="mt-0.5 text-xs text-[#8b949e]">Pin important projects and return to them in a click.</p>
                </div>
              </div>
              <button className="self-start rounded-md border border-[#333333] px-3 py-2 text-xs font-medium text-[#c9d1d9] transition hover:bg-[#1a1a1a] sm:self-auto">Explore shortcuts</button>
            </section>
          </div>
        </div>

        <footer className="flex h-6 shrink-0 items-center justify-between bg-[#f5f5f5] px-3 text-[10px] font-medium text-black">
          <span className="flex items-center gap-1.5"><GitBranch size={12} /> main</span>
          <span className="hidden sm:inline">CodeForge workspace</span>
          <span>Ln 1, Col 1</span>
        </footer>
      </div>

      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onCreate={() => {
          setTemplateSelectorOpen(false);
          router.push("/playground");
        }}
      />
    </main>
  );
}
