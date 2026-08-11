"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  GitCommit,
  History,
  Loader2,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";

import { getWebContainer } from "@/lib/webcontainer";
import {
  initGit,
  cloneRepository,
  getGitStatus,
  stageFile,
  stageAll,
  unstageFile,
  unstageAll,
  commitChanges,
  getGitLog,
  getBranches,
  getCurrentBranch,
  checkoutBranch,
  createBranch,
  deleteBranch,
  getRemotes,
  addRemote,
  deleteRemote,
  getTags,
  createTag,
  fetchRemote,
  pullRemote,
  pushRemote,
  type GitLogEntry,
} from "@/lib/git";

type GitStatusRow = [string, number, number, number];
type Tone = "info" | "success" | "error";
type MoreView = "root" | "delete-branch" | "remotes" | "tags";

type GitSourceControlProps = {
  onRefreshExplorer?: () => Promise<void>;
  onOpenDiff?: (entry: GitLogEntry, filepath: string) => void;
};

// Mirrors isomorphic-git's statusMatrix table: [HEAD, WORKDIR, STAGE] each 0/1/2(/3).
function unstagedBadge(head: number, workdir: number) {
  if (head === 0 && workdir === 2) return { letter: "U", className: "text-[#3fb950]" };
  if (head === 1 && workdir === 2) return { letter: "M", className: "text-[#e3b341]" };
  if (head === 1 && workdir === 0) return { letter: "D", className: "text-[#f85149]" };
  return null;
}

function stagedBadge(head: number, stage: number) {
  if (head === 0) return { letter: "A", className: "text-[#3fb950]" };
  if (head === 1 && stage === 0) return { letter: "D", className: "text-[#f85149]" };
  if (head === 1) return { letter: "M", className: "text-[#e3b341]" };
  return null;
}

// commit.changes tuples are [newOid, oldOid, filepath]; an added/removed file
// has a null old/new oid respectively.
function changeBadge(newOid: string | null, oldOid: string | null) {
  if (newOid === null) return { letter: "D", className: "text-[#f85149]" };
  if (oldOid === null) return { letter: "A", className: "text-[#3fb950]" };
  return { letter: "M", className: "text-[#e3b341]" };
}

function splitPath(path: string) {
  const parts = path.split("/");
  return { name: parts.pop()!, dir: parts.join("/") };
}

function relativeTime(unixSeconds: number) {
  const minutes = Math.floor((Date.now() - unixSeconds * 1000) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function GitSourceControl({ onRefreshExplorer, onOpenDiff }: GitSourceControlProps) {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GitStatusRow[]>([]);
  const [history, setHistory] = useState<GitLogEntry[]>([]);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [currentBranch, setCurrentBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<Tone>("info");

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreView, setMoreView] = useState<MoreView>("root");
  const [remotes, setRemotes] = useState<{ remote: string; url: string }[]>([]);
  const [newRemoteName, setNewRemoteName] = useState("");
  const [newRemoteUrl, setNewRemoteUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  function notify(text: string, nextTone: Tone = "info") {
    setMessage(text);
    setTone(nextTone);
  }

  async function refreshGit() {
    try {
      const result = await getGitStatus();
      setStatus(result as GitStatusRow[]);
      setInitialized(true);

      try {
        setCurrentBranch((await getCurrentBranch()) || "");
      } catch {
        setCurrentBranch("");
      }

      try {
        setBranches(await getBranches());
      } catch {
        setBranches([]);
      }

      try {
        setHistory(await getGitLog(20));
      } catch {
        setHistory([]);
      }
    } catch {
      setInitialized(false);
    }
  }

  // Initial load, plus a live filesystem watch so edits made in the Editor,
  // Terminal, or File Explorer show up under Changes without a manual refresh.
  useEffect(() => {
    refreshGit();

    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let watcher: { close(): void } | undefined;

    (async () => {
      const wc = await getWebContainer();
      if (cancelled) return;

      watcher = wc.fs.watch(".", { recursive: true }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => void refreshGit(), 400);
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      watcher?.close();
    };
  }, []);

  async function handleInitGit() {
    try {
      setInitializing(true);
      await initGit();
      await refreshGit();
    } catch (error) {
      console.error("Git init error:", error);
      notify("Git initialization failed.", "error");
    } finally {
      setInitializing(false);
    }
  }

  async function handleClone() {
    const url = prompt("Repository URL to clone");
    if (!url?.trim()) return;

    try {
      setInitializing(true);
      await cloneRepository(url.trim());
      await refreshGit();
      await onRefreshExplorer?.();
      notify("Repository cloned.", "success");
    } catch (error) {
      console.error("Clone error:", error);
      notify("Clone failed — GitHub needs a CORS proxy for browser access.", "error");
    } finally {
      setInitializing(false);
    }
  }

  async function handleStage(path: string) {
    try {
      await stageFile(path);
      await refreshGit();
    } catch (error) {
      console.error("Stage error:", error);
      notify(`Could not stage ${path}`, "error");
    }
  }

  async function handleUnstage(path: string) {
    try {
      await unstageFile(path);
      await refreshGit();
    } catch (error) {
      console.error("Unstage error:", error);
      notify(`Could not unstage ${path}`, "error");
    }
  }

  async function handleStageAll() {
    try {
      setLoading(true);
      await stageAll();
      await refreshGit();
      notify("Staged all changes.", "success");
    } catch (error) {
      console.error("Stage all error:", error);
      notify("Could not stage all changes.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnstageAll() {
    try {
      setLoading(true);
      await unstageAll();
      await refreshGit();
      notify("Unstaged all changes.", "success");
    } catch (error) {
      console.error("Unstage all error:", error);
      notify("Could not unstage all changes.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!commitMessage.trim()) {
      notify("Enter a commit message first.");
      return;
    }

    try {
      setLoading(true);

      await commitChanges(commitMessage.trim(), {
        name: "Niket",
        email: "niket@example.com",
      });

      setCommitMessage("");
      notify("Commit created.", "success");

      await refreshGit();
      await onRefreshExplorer?.();
    } catch (error) {
      console.error("Commit error:", error);
      notify("Commit failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetch() {
    try {
      setLoading(true);
      await fetchRemote("origin");
      notify("Fetch completed.", "success");
      await refreshGit();
    } catch (error) {
      console.error("Fetch error:", error);
      notify("Fetch failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePull() {
    try {
      setLoading(true);
      await pullRemote("origin");
      notify("Pull completed.", "success");
      await refreshGit();
      await onRefreshExplorer?.();
    } catch (error) {
      console.error("Pull error:", error);
      notify("Pull failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePush() {
    try {
      setLoading(true);
      await pushRemote("origin");
      notify("Push completed.", "success");
    } catch (error) {
      console.error("Push error:", error);
      notify("Push failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(branch: string) {
    setBranchMenuOpen(false);

    try {
      setLoading(true);
      await checkoutBranch(branch);
      await refreshGit();
      await onRefreshExplorer?.();
      notify(`Switched to ${branch}.`, "success");
    } catch (error) {
      console.error("Checkout error:", error);
      notify(`Could not switch to ${branch}.`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBranch() {
    const name = newBranchName.trim();
    if (!name) return;

    try {
      setCreatingBranch(true);
      await createBranch(name);
      await checkoutBranch(name);
      setNewBranchName("");
      setBranchMenuOpen(false);
      await refreshGit();
      notify(`Created ${name}. Push to publish it to origin.`, "success");
    } catch (error) {
      console.error("Create branch error:", error);
      notify(`Could not create branch "${name}".`, "error");
    } finally {
      setCreatingBranch(false);
    }
  }

  async function handleDeleteBranch(branch: string) {
    if (!confirm(`Delete branch "${branch}"? This cannot be undone.`)) return;

    try {
      await deleteBranch(branch);
      await refreshGit();
      notify(`Deleted ${branch}.`, "success");
    } catch (error) {
      console.error("Delete branch error:", error);
      notify(`Could not delete ${branch}.`, "error");
    }
  }

  async function loadRemotes() {
    try {
      setRemotes(await getRemotes());
    } catch {
      setRemotes([]);
    }
  }

  async function handleAddRemote() {
    const name = newRemoteName.trim();
    const url = newRemoteUrl.trim();
    if (!name || !url) return;

    try {
      await addRemote(name, url);
      setNewRemoteName("");
      setNewRemoteUrl("");
      await loadRemotes();
      notify(`Added remote "${name}".`, "success");
    } catch (error) {
      console.error("Add remote error:", error);
      notify(`Could not add remote "${name}".`, "error");
    }
  }

  async function handleDeleteRemote(name: string) {
    if (!confirm(`Remove remote "${name}"?`)) return;

    try {
      await deleteRemote(name);
      await loadRemotes();
      notify(`Removed remote "${name}".`, "success");
    } catch (error) {
      console.error("Delete remote error:", error);
      notify(`Could not remove remote "${name}".`, "error");
    }
  }

  async function loadTags() {
    try {
      setTags(await getTags());
    } catch {
      setTags([]);
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;

    try {
      await createTag(name);
      setNewTagName("");
      await loadTags();
      notify(`Created tag "${name}".`, "success");
    } catch (error) {
      console.error("Create tag error:", error);
      notify(`Could not create tag "${name}".`, "error");
    }
  }

  function openMoreView(view: MoreView) {
    setMoreView(view);
    if (view === "remotes") void loadRemotes();
    if (view === "tags") void loadTags();
  }

  function closeMoreMenu() {
    setMoreMenuOpen(false);
    setMoreView("root");
  }

  // statusMatrix rows are [filepath, HEAD, WORKDIR, STAGE].
  // A file is changed when WORKDIR differs from HEAD but hasn't been staged yet;
  // it's staged once STAGE no longer matches HEAD.
  const changedFiles = status.filter(([, head, workdir, stage]) => workdir !== head && stage === head);
  const stagedFiles = status.filter(([, head, , stage]) => stage !== head);

  return (
    <aside className="flex h-full min-w-0 flex-col bg-[#11161d] text-[#c9d1d9]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#30363d] px-3">
        <span className="text-[11px] font-semibold tracking-[0.12em]">SOURCE CONTROL</span>

        <div className="flex items-center gap-0.5 text-[#8b949e]">
          <button
            type="button"
            title="Refresh"
            onClick={refreshGit}
            className="grid h-6 w-6 place-items-center rounded hover:bg-[#30363d] hover:text-white"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {initialized === false ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#30363d] bg-[#161b22] text-[#8b949e]">
            <GitBranch size={18} />
          </span>
          <div>
            <p className="text-[13px] font-medium text-[#e6edf3]">No Git repository</p>
            <p className="mt-1 max-w-[210px] text-[11px] leading-5 text-[#6e7681]">
              Initialize a repository to track changes and commit your work.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={initializing}
              onClick={handleInitGit}
              className="flex h-8 items-center gap-2 rounded-md bg-[#007acc] px-3.5 text-xs font-semibold text-white transition hover:bg-[#1685d1] disabled:opacity-50"
            >
              {initializing && <Loader2 size={13} className="animate-spin" />}
              Initialize Repository
            </button>
            <button
              type="button"
              disabled={initializing}
              onClick={handleClone}
              className="flex h-8 items-center gap-2 rounded-md border border-[#30363d] px-3.5 text-xs font-semibold text-[#c9d1d9] transition hover:bg-[#21262d] disabled:opacity-50"
            >
              Clone Repository
            </button>
          </div>
          {message && <p className="text-[11px] text-[#f85149]">{message}</p>}
        </div>
      ) : initialized === null ? (
        <div className="grid flex-1 place-items-center text-[11px] text-[#6e7681]">Checking repository…</div>
      ) : (
        <>
          <div className="relative flex items-center justify-between border-b border-[#30363d] px-2 py-1.5">
            <button
              type="button"
              title="Branches"
              onClick={() => setBranchMenuOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition hover:bg-[#21262d]"
            >
              <GitBranch size={13} className="text-[#8b949e]" />
              <span className="font-medium text-[#e6edf3]">{currentBranch || "detached"}</span>
              <ChevronDown size={12} className="text-[#6e7681]" />
            </button>

            <div className="flex items-center gap-0.5 text-[#8b949e]">
              <button
                type="button"
                onClick={handlePull}
                disabled={loading}
                title="Pull"
                className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white disabled:opacity-40"
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                onClick={handlePush}
                disabled={loading}
                title="Push"
                className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white disabled:opacity-40"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={handleFetch}
                disabled={loading}
                title="Fetch"
                className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white disabled:opacity-40"
              >
                <Upload size={13} />
              </button>
              <button
                type="button"
                onClick={() => setMoreMenuOpen((open) => !open)}
                title="More actions"
                className="grid h-6 w-6 place-items-center rounded transition hover:bg-[#30363d] hover:text-white"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>

            {branchMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBranchMenuOpen(false)} />
                <div className="absolute left-2 top-full z-50 mt-1 w-56 overflow-hidden rounded-md border border-[#30363d] bg-[#161b22] shadow-xl shadow-black/40">
                  <div className="max-h-48 overflow-auto py-1">
                    {branches.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-[#6e7681]">No branches yet</div>
                    ) : (
                      branches.map((branch) => {
                        const isCurrent = branch === currentBranch;

                        return (
                          <button
                            key={branch}
                            type="button"
                            disabled={loading || isCurrent}
                            onClick={() => handleCheckout(branch)}
                            title={isCurrent ? undefined : `Switch to ${branch}`}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-[#21262d] disabled:cursor-default"
                          >
                            <span className="grid w-3.5 shrink-0 place-items-center">
                              {isCurrent && <Check size={12} className="text-[#58a6ff]" />}
                            </span>
                            <span className={isCurrent ? "font-medium text-[#58a6ff]" : "text-[#c9d1d9]"}>
                              {branch}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 border-t border-[#30363d] p-2">
                    <input
                      value={newBranchName}
                      onChange={(event) => setNewBranchName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleCreateBranch();
                      }}
                      placeholder="New branch name"
                      className="h-7 min-w-0 flex-1 rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#007acc]"
                    />
                    <button
                      type="button"
                      title="Create branch"
                      disabled={creatingBranch || !newBranchName.trim()}
                      onClick={handleCreateBranch}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#007acc] text-white transition hover:bg-[#1685d1] disabled:opacity-40"
                    >
                      {creatingBranch ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {moreMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeMoreMenu} />
                <div className="absolute right-2 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-[#30363d] bg-[#161b22] shadow-xl shadow-black/40">
                  {moreView === "root" && (
                    <div className="py-1">
                      <button
                        type="button"
                        disabled={changedFiles.length === 0}
                        onClick={() => {
                          closeMoreMenu();
                          handleStageAll();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d] disabled:opacity-40"
                      >
                        <Plus size={13} />
                        Stage All Changes
                      </button>
                      <button
                        type="button"
                        disabled={stagedFiles.length === 0}
                        onClick={() => {
                          closeMoreMenu();
                          handleUnstageAll();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d] disabled:opacity-40"
                      >
                        <Minus size={13} />
                        Unstage All Changes
                      </button>

                      <div className="my-1 h-px bg-[#30363d]" />

                      <button
                        type="button"
                        onClick={() => openMoreView("delete-branch")}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d]"
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 size={13} />
                          Delete Branch
                        </span>
                        <ChevronRight size={13} className="text-[#6e7681]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openMoreView("remotes")}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d]"
                      >
                        <span className="flex items-center gap-2">
                          <GitBranch size={13} />
                          Remotes
                        </span>
                        <ChevronRight size={13} className="text-[#6e7681]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openMoreView("tags")}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-[#c9d1d9] transition hover:bg-[#21262d]"
                      >
                        <span className="flex items-center gap-2">
                          <Tag size={13} />
                          Tags
                        </span>
                        <ChevronRight size={13} className="text-[#6e7681]" />
                      </button>
                    </div>
                  )}

                  {moreView !== "root" && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setMoreView("root")}
                        className="flex w-full items-center gap-1.5 border-b border-[#30363d] px-3 py-2 text-left text-[11px] font-semibold text-[#c9d1d9] hover:bg-[#21262d]"
                      >
                        <ChevronLeft size={13} />
                        {moreView === "delete-branch" && "DELETE BRANCH"}
                        {moreView === "remotes" && "REMOTES"}
                        {moreView === "tags" && "TAGS"}
                      </button>

                      {moreView === "delete-branch" && (
                        <div className="max-h-48 overflow-auto py-1">
                          {branches.filter((b) => b !== currentBranch).length === 0 ? (
                            <div className="px-3 py-2 text-[11px] text-[#6e7681]">No other branches</div>
                          ) : (
                            branches
                              .filter((branch) => branch !== currentBranch)
                              .map((branch) => (
                                <div
                                  key={branch}
                                  className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#21262d]"
                                >
                                  <span className="min-w-0 flex-1 truncate text-xs text-[#c9d1d9]">{branch}</span>
                                  <button
                                    type="button"
                                    title={`Delete ${branch}`}
                                    onClick={() => handleDeleteBranch(branch)}
                                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#f85149] opacity-0 hover:bg-[#30363d] group-hover:opacity-100"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      )}

                      {moreView === "remotes" && (
                        <>
                          <div className="max-h-40 overflow-auto py-1">
                            {remotes.length === 0 ? (
                              <div className="px-3 py-2 text-[11px] text-[#6e7681]">No remotes configured</div>
                            ) : (
                              remotes.map((remote) => (
                                <div
                                  key={remote.remote}
                                  className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[#21262d]"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs text-[#e6edf3]">{remote.remote}</p>
                                    <p className="truncate text-[10px] text-[#6e7681]">{remote.url}</p>
                                  </div>
                                  <button
                                    type="button"
                                    title={`Remove ${remote.remote}`}
                                    onClick={() => handleDeleteRemote(remote.remote)}
                                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#f85149] opacity-0 hover:bg-[#30363d] group-hover:opacity-100"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 border-t border-[#30363d] p-2">
                            <input
                              value={newRemoteName}
                              onChange={(event) => setNewRemoteName(event.target.value)}
                              placeholder="Name (e.g. origin)"
                              className="h-7 rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#007acc]"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                value={newRemoteUrl}
                                onChange={(event) => setNewRemoteUrl(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") handleAddRemote();
                                }}
                                placeholder="Repository URL"
                                className="h-7 min-w-0 flex-1 rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#007acc]"
                              />
                              <button
                                type="button"
                                title="Add remote"
                                disabled={!newRemoteName.trim() || !newRemoteUrl.trim()}
                                onClick={handleAddRemote}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#007acc] text-white transition hover:bg-[#1685d1] disabled:opacity-40"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {moreView === "tags" && (
                        <>
                          <div className="max-h-40 overflow-auto py-1">
                            {tags.length === 0 ? (
                              <div className="px-3 py-2 text-[11px] text-[#6e7681]">No tags yet</div>
                            ) : (
                              tags.map((tagName) => (
                                <div key={tagName} className="flex items-center gap-2 px-3 py-1.5">
                                  <Tag size={12} className="shrink-0 text-[#8b949e]" />
                                  <span className="truncate text-xs text-[#c9d1d9]">{tagName}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 border-t border-[#30363d] p-2">
                            <input
                              value={newTagName}
                              onChange={(event) => setNewTagName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") handleCreateTag();
                              }}
                              placeholder="New tag name"
                              className="h-7 min-w-0 flex-1 rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#007acc]"
                            />
                            <button
                              type="button"
                              title="Create tag"
                              disabled={!newTagName.trim()}
                              onClick={handleCreateTag}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#007acc] text-white transition hover:bg-[#1685d1] disabled:opacity-40"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-b border-[#30363d] p-3">
            <textarea
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  handleCommit();
                }
              }}
              placeholder="Message (required)"
              className="h-16 w-full resize-none rounded border border-[#30363d] bg-[#0d1117] p-2 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#007acc]"
            />
            <div className="mt-1 text-right text-[10px] text-[#484f58]">⌘ Enter to commit</div>

            <button
              type="button"
              disabled={loading || stagedFiles.length === 0}
              onClick={handleCommit}
              title={stagedFiles.length === 0 ? "Stage changes before committing" : "Commit"}
              className="flex h-7 w-full items-center justify-center gap-2 rounded bg-[#007acc] text-xs font-medium text-white transition hover:bg-[#1685d1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Commit{stagedFiles.length > 0 ? ` (${stagedFiles.length})` : ""}
            </button>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 border-b border-[#30363d] px-3 py-2 text-[11px] ${
                tone === "error" ? "text-[#f85149]" : tone === "success" ? "text-[#3fb950]" : "text-[#8b949e]"
              }`}
            >
              {tone === "error" ? (
                <AlertCircle size={12} className="shrink-0" />
              ) : tone === "success" ? (
                <CheckCircle2 size={12} className="shrink-0" />
              ) : null}
              <span className="truncate">{message}</span>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto">
            <section>
              <div className="flex h-8 items-center gap-1.5 px-3 text-[11px] font-semibold text-[#c9d1d9]">
                <span>CHANGES</span>
                {changedFiles.length > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#30363d] px-1 text-[10px] font-medium text-[#c9d1d9]">
                    {changedFiles.length}
                  </span>
                )}
              </div>

              {changedFiles.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#6e7681]">No changes</div>
              ) : (
                changedFiles.map(([path, head, workdir]) => {
                  const badge = unstagedBadge(head, workdir);
                  const { name, dir } = splitPath(path);

                  return (
                    <div key={path} className="group flex h-7 items-center gap-2 px-3 hover:bg-[#21262d]">
                      <span className="min-w-0 flex-1 truncate text-xs" title={path}>
                        <span className="text-[#e6edf3]">{name}</span>
                        {dir && <span className="ml-1.5 text-[#6e7681]">{dir}</span>}
                      </span>
                      {badge && (
                        <span className={`shrink-0 text-[11px] font-semibold ${badge.className}`}>
                          {badge.letter}
                        </span>
                      )}
                      <button
                        type="button"
                        title="Stage changes"
                        onClick={() => handleStage(path)}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded opacity-0 hover:bg-[#30363d] group-hover:opacity-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </section>

            <section className="border-t border-[#30363d]">
              <div className="flex h-8 items-center gap-1.5 px-3 text-[11px] font-semibold text-[#c9d1d9]">
                <span>STAGED CHANGES</span>
                {stagedFiles.length > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#30363d] px-1 text-[10px] font-medium text-[#c9d1d9]">
                    {stagedFiles.length}
                  </span>
                )}
              </div>

              {stagedFiles.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#6e7681]">No staged changes</div>
              ) : (
                stagedFiles.map(([path, head, , stage]) => {
                  const badge = stagedBadge(head, stage);
                  const { name, dir } = splitPath(path);

                  return (
                    <div key={path} className="group flex h-7 items-center gap-2 px-3 hover:bg-[#21262d]">
                      <span className="min-w-0 flex-1 truncate text-xs" title={path}>
                        <span className="text-[#e6edf3]">{name}</span>
                        {dir && <span className="ml-1.5 text-[#6e7681]">{dir}</span>}
                      </span>
                      {badge && (
                        <span className={`shrink-0 text-[11px] font-semibold ${badge.className}`}>
                          {badge.letter}
                        </span>
                      )}
                      <button
                        type="button"
                        title="Unstage changes"
                        onClick={() => handleUnstage(path)}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded opacity-0 hover:bg-[#30363d] group-hover:opacity-100"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </section>

            <section className="border-t border-[#30363d]">
              <div className="flex h-8 items-center gap-1.5 px-3 text-[11px] font-semibold text-[#c9d1d9]">
                <History size={13} />
                HISTORY
              </div>

              {history.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#6e7681]">No commits yet</div>
              ) : (
                history.map((entry) => {
                  const isExpanded = expandedCommit === entry.oid;
                  const changes = entry.commit.changes ?? [];

                  return (
                    <div key={entry.oid} className="border-b border-[#1c2128] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setExpandedCommit(isExpanded ? null : entry.oid)}
                        className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-[#21262d]"
                      >
                        <GitCommit size={13} className="mt-0.5 shrink-0 text-[#8b949e]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-[#e6edf3]">{entry.commit.message.split("\n")[0]}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#6e7681]">
                            <span className="font-mono text-[#79c0ff]">{entry.oid.slice(0, 7)}</span>
                            <span>{entry.commit.author.name}</span>
                            <span>·</span>
                            <span>{relativeTime(entry.commit.author.timestamp)}</span>
                          </p>
                        </div>
                        <ChevronDown
                          size={12}
                          className={`mt-1 shrink-0 text-[#6e7681] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="pb-2 pl-8 pr-3">
                          {changes.length === 0 ? (
                            <p className="py-1 text-[11px] text-[#6e7681]">No file changes recorded.</p>
                          ) : (
                            changes.map(([newOid, oldOid, filepath]) => {
                              const badge = changeBadge(newOid as string | null, oldOid as string | null);
                              const { name, dir } = splitPath(filepath as string);

                              return (
                                <button
                                  type="button"
                                  key={filepath as string}
                                  onClick={() => onOpenDiff?.(entry, filepath as string)}
                                  title="View diff"
                                  className="flex w-full items-center gap-2 rounded py-0.5 text-left hover:bg-[#21262d]"
                                >
                                  <span className="min-w-0 flex-1 truncate text-[11px]">
                                    <span className="text-[#c9d1d9]">{name}</span>
                                    {dir && <span className="ml-1 text-[#6e7681]">{dir}</span>}
                                  </span>
                                  <span className={`shrink-0 text-[11px] font-semibold ${badge.className}`}>
                                    {badge.letter}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </section>
          </div>
        </>
      )}
    </aside>
  );
}
