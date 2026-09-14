"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FolderGit2, Link2, Loader2 } from "lucide-react";
import { cloneRepository, type CloneProgress } from "@/lib/git";
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

// Accepts a full URL ("https://github.com/owner/repo", optionally with
// ".git"), an SSH remote ("git@github.com:owner/repo.git"), or the
// "owner/repo" shorthand, and normalizes it to a clonable https URL.
function normalizeRepoUrl(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");

  const sshMatch = trimmed.match(/^git@([^:]+):(.+)$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }

  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}`;
  }

  return trimmed;
}

function repoInfoFromUrl(url: string): Pick<Repository, "name" | "fullName"> {
  const cleaned = url.replace(/\.git$/, "").replace(/\/$/, "");
  const segments = cleaned.split("/");

  return {
    name: segments[segments.length - 1] || cleaned,
    fullName: segments.slice(-2).join("/") || cleaned,
  };
}

function formatCloneProgress(progress: CloneProgress | null): string {
  if (!progress) return "Cloning…";

  const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : null;
  return pct !== null ? `${progress.phase}… ${pct}%` : `${progress.phase}…`;
}

export default function GitHubRepositories({ onCloned }: GitHubRepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cloningId, setCloningId] = useState<number | null>(null);

  const [urlInput, setUrlInput] = useState("");
  const [cloningUrl, setCloningUrl] = useState(false);

  const [cloneProgress, setCloneProgress] = useState<CloneProgress | null>(null);

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

      await cloneRepository(repo.cloneUrl, data.token, ".", {
        force,
        onProgress: setCloneProgress,
      });

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
      setCloneProgress(null);
    }
  }

  async function handleCloneUrl(force = false) {
    const url = normalizeRepoUrl(urlInput);
    if (!url) return;

    const { name, fullName } = repoInfoFromUrl(url);

    try {
      setCloningUrl(true);

      // No GitHub App / installation token involved — this is a plain,
      // unauthenticated clone, exactly like `git clone <url>`. It only works
      // for public repos; private repos still need a picked repository above.
      await cloneRepository(url, undefined, ".", {
        force,
        onProgress: setCloneProgress,
      });

      pushToast({
        tone: "success",
        title: "Repository cloned",
        description: fullName,
      });

      setUrlInput("");
      await onCloned?.({ id: -1, name, fullName, cloneUrl: url });
    } catch (error) {
      const conflictFiles = (error as { data?: { filepaths?: string[] } })?.data?.filepaths;

      if (!force && conflictFiles && conflictFiles.length > 0) {
        const preview = conflictFiles.slice(0, 8).join(", ") + (conflictFiles.length > 8 ? ", …" : "");
        const shouldOverwrite = confirm(
          `Cloning "${fullName}" would overwrite local changes to:\n${preview}\n\nOverwrite these files and continue?`,
        );

        if (shouldOverwrite) {
          await handleCloneUrl(true);
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
        description:
          error instanceof Error
            ? error.message
            : "Could not clone this repository. Make sure it's public and the URL is correct.",
      });
    } finally {
      setCloningUrl(false);
      setCloneProgress(null);
    }
  }

  function renderInstallationRepos() {
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
          YOUR GITHUB REPOSITORIES
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
                  className="flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-3 text-[11px] font-semibold text-black transition hover:bg-[#d4d4d4] disabled:opacity-50"
                >
                  {isCloning && <Loader2 size={12} className="animate-spin" />}
                  {isCloning ? formatCloneProgress(cloneProgress) : "Clone"}
                </button>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-[11px] font-semibold tracking-[0.08em] text-[#8b949e]">
          CLONE BY URL
        </h2>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Link2
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7681]"
            />
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && urlInput.trim() && !cloningUrl) {
                  void handleCloneUrl();
                }
              }}
              placeholder="https://github.com/owner/repo"
              spellCheck={false}
              autoComplete="off"
              className="h-8 w-full rounded border border-[#262626] bg-[#000000] pl-8 pr-2.5 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#525252]"
            />
          </div>

          <button
            type="button"
            disabled={!urlInput.trim() || cloningUrl}
            onClick={() => handleCloneUrl()}
            className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-3 text-[11px] font-semibold text-black transition hover:bg-[#d4d4d4] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cloningUrl && <Loader2 size={12} className="animate-spin" />}
            {cloningUrl ? formatCloneProgress(cloneProgress) : "Clone"}
          </button>
        </div>

        <p className="text-[10px] leading-4 text-[#6e7681]">
          Works for any public repository — no GitHub App access needed, just like{" "}
          <code className="text-[#8b949e]">git clone</code>.
        </p>
      </div>

      {renderInstallationRepos()}
    </div>
  );
}
