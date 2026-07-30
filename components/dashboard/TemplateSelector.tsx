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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#3b434b] bg-[#161b22] shadow-2xl shadow-black/60">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-[#30363d] p-5 sm:p-6">

          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-[0.15em] text-[#8bc7f3]">
              NEW WORKSPACE
            </p>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Create New Project
            </h2>

            <p className="mt-1 text-sm text-[#8b949e]">
              Choose a starting point for your next build.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-2 text-[#8b949e] transition hover:bg-[#21262d] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}

        <div className="p-5 sm:p-6">

          <div className="relative">

            <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8b949e]" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search frameworks..."
              className="w-full rounded-md border border-[#3b434b] bg-[#0d1117] py-3 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[#6e7681] focus:border-[#007acc] focus:ring-2 focus:ring-[#007acc]/20"
            />

          </div>

          {/* Frontend */}

          <div className="mt-8">

            <h3 className="mb-3 text-sm font-semibold text-[#c9d1d9]">
              Frontend
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">

              {frontend.map((template) => (

                <button
                  key={template.id}
                  onClick={() => setSelected(template.id)}
                  className={`rounded-lg border p-4 text-left transition

                  ${
                    selected === template.id
                      ? "border-[#007acc] bg-[#102235] shadow-[0_0_0_1px_rgba(0,122,204,0.2)]"
                      : "border-[#30363d] bg-[#11161d] hover:border-[#59636e] hover:bg-[#1c2128]"
                  }`}
                >

                  <div className="text-2xl">{template.icon}</div>

                  <h4 className="mt-3 text-base font-semibold text-white">
                    {template.name}
                  </h4>

                  <p className="mt-1 text-sm text-[#8b949e]">
                    {template.description}
                  </p>

                </button>

              ))}

            </div>

          </div>

          {/* Backend */}

          <div className="mt-8">

            <h3 className="mb-3 text-sm font-semibold text-[#c9d1d9]">
              Backend
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">

              {backend.map((template) => (

                <button
                  key={template.id}
                  onClick={() => setSelected(template.id)}
                  className={`rounded-lg border p-4 text-left transition

                  ${
                    selected === template.id
                      ? "border-[#007acc] bg-[#102235] shadow-[0_0_0_1px_rgba(0,122,204,0.2)]"
                      : "border-[#30363d] bg-[#11161d] hover:border-[#59636e] hover:bg-[#1c2128]"
                  }`}
                >

                  <div className="text-2xl">{template.icon}</div>

                  <h4 className="mt-3 text-base font-semibold text-white">
                    {template.name}
                  </h4>

                  <p className="mt-1 text-sm text-[#8b949e]">
                    {template.description}
                  </p>

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex items-center justify-end gap-3 border-t border-[#30363d] p-5 sm:p-6">

          <button
            onClick={onClose}
            className="rounded-md border border-[#3b434b] px-4 py-2 text-sm text-[#c9d1d9] transition hover:bg-[#21262d]"
          >
            Cancel
          </button>

          <button
            disabled={!selected}
            onClick={() => onCreate(selected)}
            className="rounded-md bg-[#007acc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1685d1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create Project
          </button>

        </div>

      </div>
    </div>
  );
}
