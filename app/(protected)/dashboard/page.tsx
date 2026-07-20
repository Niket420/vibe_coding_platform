"use client";

import {
  Home,
  FolderOpen,
  History,
  Star,
  Plus,
  GitBranch,
  Code2,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#0d0d0d] text-white">

      {/* Sidebar */}

      <aside className="w-64 border-r border-zinc-800 bg-[#111111] flex flex-col">

        <div className="h-20 flex items-center px-6 border-b border-zinc-800">

          <Code2 className="w-8 h-8" />

          <span className="ml-3 text-2xl font-bold">
            CodeForge
          </span>

        </div>

        <nav className="flex-1 p-4 space-y-2">

          <button className="flex items-center gap-3 w-full rounded-lg px-4 py-3 hover:bg-zinc-800 transition">
            <Home size={20} />
            Home
          </button>

          <button className="flex items-center gap-3 w-full rounded-lg px-4 py-3 hover:bg-zinc-800 transition">
            <FolderOpen size={20} />
            Projects
          </button>

          <button className="flex items-center gap-3 w-full rounded-lg px-4 py-3 bg-zinc-800">
            <Star size={20} />
            Starred
          </button>

          <button className="flex items-center gap-3 w-full rounded-lg px-4 py-3 hover:bg-zinc-800 transition">
            <History size={20} />
            History
          </button>

        </nav>

      </aside>

      {/* Main */}

      <main className="flex-1 p-10">

        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="text-zinc-400 mt-2 mb-10">
          Welcome back to CodeForge
        </p>

        {/* Top Cards */}

        <div className="grid grid-cols-2 gap-6">

          <button className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-left hover:border-white transition">

            <Plus className="mb-6" size={40} />

            <h2 className="text-2xl font-semibold">
              Create New Project
            </h2>

            <p className="mt-3 text-zinc-400">
              Start with React, Next.js, Express, Hono and more.
            </p>

          </button>

          <button className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-left hover:border-white transition">

            <GitBranch className="mb-6" size={40} />

            <h2 className="text-2xl font-semibold">
              Import GitHub Repo
            </h2>

            <p className="mt-3 text-zinc-400">
              Clone an existing repository.
            </p>

          </button>

        </div>

        {/* Recent */}

        <div className="mt-12">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-semibold">
              Recently Viewed
            </h2>

            <button className="text-sm text-zinc-400 hover:text-white">
              View All
            </button>

          </div>

          <div className="space-y-4">

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 transition cursor-pointer">

              <h3 className="font-semibold">
                Portfolio Website
              </h3>

              <p className="text-zinc-500 text-sm mt-2">
                Opened 2 hours ago
              </p>

            </div>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 transition cursor-pointer">

              <h3 className="font-semibold">
                AI Chat App
              </h3>

              <p className="text-zinc-500 text-sm mt-2">
                Opened Yesterday
              </p>

            </div>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 transition cursor-pointer">

              <h3 className="font-semibold">
                Expense Tracker
              </h3>

              <p className="text-zinc-500 text-sm mt-2">
                Opened 3 days ago
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}