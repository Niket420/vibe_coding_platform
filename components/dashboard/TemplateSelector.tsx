"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { templates } from "@/lib/templates";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (templateId: string) => void;
}

export default function TemplateSelector({
  open,
  onClose,
  onCreate,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");

  const filtered = useMemo(() => {
    return templates.filter((template) =>
      template.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const frontend = filtered.filter((t) => t.category === "Frontend");
  const backend = filtered.filter((t) => t.category === "Backend");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-[900px] rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-zinc-800 p-6">

          <div>
            <h2 className="text-2xl font-bold text-white">
              Create New Project
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Select a framework to get started.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-zinc-800"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Search */}

        <div className="p-6">

          <div className="relative">

            <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search frameworks..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 pl-12 pr-4 text-white outline-none transition focus:border-blue-500"
            />

          </div>

          {/* Frontend */}

          <div className="mt-8">

            <h3 className="mb-4 text-lg font-semibold text-white">
              Frontend
            </h3>

            <div className="grid grid-cols-2 gap-4">

              {frontend.map((template) => (

                <button
                  key={template.id}
                  onClick={() => setSelected(template.id)}
                  className={`rounded-2xl border p-5 text-left transition

                  ${
                    selected === template.id
                      ? "border-blue-500 bg-zinc-800"
                      : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800"
                  }`}
                >

                  <div className="text-3xl">{template.icon}</div>

                  <h4 className="mt-4 text-lg font-semibold text-white">
                    {template.name}
                  </h4>

                  <p className="mt-1 text-sm text-zinc-400">
                    {template.description}
                  </p>

                </button>

              ))}

            </div>

          </div>

          {/* Backend */}

          <div className="mt-8">

            <h3 className="mb-4 text-lg font-semibold text-white">
              Backend
            </h3>

            <div className="grid grid-cols-2 gap-4">

              {backend.map((template) => (

                <button
                  key={template.id}
                  onClick={() => setSelected(template.id)}
                  className={`rounded-2xl border p-5 text-left transition

                  ${
                    selected === template.id
                      ? "border-blue-500 bg-zinc-800"
                      : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800"
                  }`}
                >

                  <div className="text-3xl">{template.icon}</div>

                  <h4 className="mt-4 text-lg font-semibold text-white">
                    {template.name}
                  </h4>

                  <p className="mt-1 text-sm text-zinc-400">
                    {template.description}
                  </p>

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 p-6">

          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-5 py-2 text-zinc-300 transition hover:bg-zinc-800"
          >
            Cancel
          </button>

          <button
            disabled={!selected}
            onClick={() => onCreate(selected)}
            className="rounded-xl bg-white px-6 py-2 font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-200"
          >
            Create Project
          </button>

        </div>

      </div>
    </div>
  );
}