"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cloneRepository } from "@/lib/git";

type Repository = {
  id: number;
  name: string;
  fullName: string;
  cloneUrl: string;
};

export default function GitHubRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cloningId, setCloningId] = useState<number | null>(null);

  useEffect(() => {
    async function loadRepositories() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/github/repos");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load repositories");
        }

        setRepositories(data.repositories);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load repositories",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRepositories();
  }, []);

  if (loading) {
    return (
      <div className="py-6 text-center text-[12px] text-[#8b949e]">
        Loading GitHub repositories…
      </div>
    );
  }

  if (error) {
    return <div className="text-[12px] text-[#f85149]">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-[#8b949e]">
        GITHUB REPOSITORIES
      </h2>

      {repositories.length === 0 ? (
        <p className="text-[12px] text-[#8b949e]">No repositories available.</p>
      ) : (
        repositories.map((repo) => (
          <div
            key={repo.id}
            className="flex items-center justify-between rounded-md border border-[#30363d] bg-[#0d1117] p-3"
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[#e6edf3]">{repo.name}</div>
              <div className="truncate text-[11px] text-[#8b949e]">{repo.fullName}</div>
            </div>

            <button
              type="button"
              disabled={cloningId !== null}
              onClick={async () => {
                try {
                  setCloningId(repo.id);

                  const response = await fetch("/api/github/clone", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      cloneUrl: repo.cloneUrl,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok || !data.success) {
                    throw new Error(
                      data.error || "Failed to create GitHub token",
                    );
                  }

                  // Now use the temporary GitHub token to clone
                  await cloneRepository(repo.cloneUrl, data.token);

                  console.log("Repository cloned successfully");
                } catch (error) {
                  console.error("Clone failed:", error);
                } finally {
                  setCloningId(null);
                }
              }}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-[#007acc] px-3 text-[11px] font-semibold text-white transition hover:bg-[#1685d1] disabled:opacity-50"
            >
              {cloningId === repo.id && <Loader2 size={12} className="animate-spin" />}
              Clone
            </button>
          </div>
        ))
      )}
    </div>
  );
}
