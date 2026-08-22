"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FolderGit2, Loader2 } from "lucide-react";
import { cloneRepository } from "@/lib/git";
import { useToast } from "@/components/ui/toast";

type Repository = {
  id: number;
  name: string;
  fullName: string;
  cloneUrl: string;
};

type GitHubRepositoriesProps = {
  onCloned?: (repository: Repository) => void | Promise<void>;
};

export default function GitHubRepositories({ onCloned }: GitHubRepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cloningId, setCloningId] = useState<number | null>(null);
  const { push: pushToast } = useToast();

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

  async function handleClone(repo: Repository, force = false) {
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
        throw new Error(data.error || "Failed to create GitHub token");
      }

      await cloneRepository(repo.cloneUrl, data.token, ".", { force });

      pushToast({
        tone: "success",
        title: "Repository cloned",
        description: repo.fullName,
      });

      await onCloned?.(repo);
    } catch (error) {
      const conflictFiles = (error as { data?: { filepaths?: string[] } })?.data?.filepaths;

      if (!force && conflictFiles && conflictFiles.length > 0) {
        const preview = conflictFiles.slice(0, 8).join(", ") + (conflictFiles.length > 8 ? ", …" : "");
        const shouldOverwrite = confirm(
          `Cloning "${repo.fullName}" would overwrite local changes to:\n${preview}\n\nOverwrite these files and continue?`,
        );

        if (shouldOverwrite) {
          await handleClone(repo, true);
          return;
        }

        pushToast({
          tone: "info",
          title: "Clone cancelled",
          description: "Local changes were kept.",
        });
        return;
      }

      console.error("Clone failed:", error);
      pushToast({
        tone: "error",
        title: "Clone failed",
        description: error instanceof Error ? error.message : "Could not clone this repository.",
      });
    } finally {
      setCloningId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-[12px] text-[#8b949e]">
        <Loader2 size={14} className="animate-spin" />
        Loading GitHub repositories…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-[#5d3234] bg-[#2d1d20] p-3 text-[12px] text-[#f85149]">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-[#8b949e]">
        GITHUB REPOSITORIES
      </h2>

      {repositories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FolderGit2 size={20} className="text-[#6e7681]" />
          <p className="text-[12px] text-[#8b949e]">No repositories available.</p>
        </div>
      ) : (
        repositories.map((repo) => {
          const isCloning = cloningId === repo.id;

          return (
            <div
              key={repo.id}
              className="flex items-center justify-between gap-3 rounded-md border border-[#262626] bg-[#000000] p-3 transition hover:border-[#333333]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#121212] text-[#8b949e]">
                  <FolderGit2 size={14} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[#e6edf3]">{repo.name}</div>
                  <div className="truncate text-[11px] text-[#8b949e]">{repo.fullName}</div>
                </div>
              </div>

              <button
                type="button"
                disabled={cloningId !== null}
                onClick={() => handleClone(repo)}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-white px-3 text-[11px] font-semibold text-black transition hover:bg-[#d4d4d4] disabled:opacity-50"
              >
                {isCloning && <Loader2 size={12} className="animate-spin" />}
                {isCloning ? "Cloning repository…" : "Clone"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
