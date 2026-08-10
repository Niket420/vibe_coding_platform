"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GitBranch,
  Minus,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  getGitStatus,
  stageFile,
  unstageFile,
  commitChanges,
  getGitLog,
  getBranches,
  getCurrentBranch,
  fetchRemote,
  pullRemote,
  pushRemote,
} from "@/lib/git";

type GitStatusRow = [string, number, number, number];

type GitSourceControlProps = {
  onRefreshExplorer?: () => Promise<void>;
};

export default function GitSourceControl({
  onRefreshExplorer,
}: GitSourceControlProps) {
  const [status, setStatus] = useState<GitStatusRow[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [currentBranch, setCurrentBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshGit() {
    try {
      const result = await getGitStatus();
      setStatus(result as GitStatusRow[]);

      const branch = await getCurrentBranch();

      if (branch) {
        setCurrentBranch(branch);
      }

      const branchList = await getBranches();
      setBranches(branchList);
    } catch (error) {
      console.error("Git refresh error:", error);
      setMessage("Unable to read Git status.");
    }
  }

  useEffect(() => {
    refreshGit();
  }, []);

  async function handleStage(path: string) {
    try {
      await stageFile(path);
      await refreshGit();
    } catch (error) {
      console.error("Stage error:", error);
      setMessage(`Could not stage ${path}`);
    }
  }

  async function handleUnstage(path: string) {
    try {
      await unstageFile(path);
      await refreshGit();
    } catch (error) {
      console.error("Unstage error:", error);
      setMessage(`Could not unstage ${path}`);
    }
  }

  async function handleCommit() {
    if (!commitMessage.trim()) {
      setMessage("Enter a commit message first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await commitChanges(commitMessage.trim(), {
        name: "Niket",
        email: "niket@example.com",
      });

      setCommitMessage("");
      setMessage("Commit created.");

      await refreshGit();
      await onRefreshExplorer?.();
    } catch (error) {
      console.error("Commit error:", error);
      setMessage("Commit failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetch() {
    try {
      setLoading(true);
      await fetchRemote("origin");
      setMessage("Fetch completed.");
      await refreshGit();
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Fetch failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePull() {
    try {
      setLoading(true);
      await pullRemote("origin");
      setMessage("Pull completed.");
      await refreshGit();
      await onRefreshExplorer?.();
    } catch (error) {
      console.error("Pull error:", error);
      setMessage("Pull failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePush() {
    try {
      setLoading(true);
      await pushRemote("origin");
      setMessage("Push completed.");
    } catch (error) {
      console.error("Push error:", error);
      setMessage("Push failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLog() {
    try {
      const log = await getGitLog(10);
      console.log("Git log:", log);
      setMessage("Git log printed to console.");
    } catch (error) {
      console.error("Log error:", error);
      setMessage("Could not read Git log.");
    }
  }

  /*
   * statusMatrix:
   *
   * [filepath, HEAD, WORKDIR, STAGE]
   *
   * A file is considered staged when the STAGE value
   * differs from the HEAD value.
   */
  const changedFiles = status.filter(
    ([, head, workdir, stage]) =>
      workdir !== head && stage === head
  );

  const stagedFiles = status.filter(
    ([, head, , stage]) =>
      stage !== head
  );

  return (
    <aside className="flex h-full min-w-0 flex-col bg-[#11161d] text-[#c9d1d9]">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#30363d] px-3">
        <span className="text-[11px] font-semibold tracking-[0.12em]">
          SOURCE CONTROL
        </span>

        <button
          type="button"
          title="Refresh Git"
          onClick={refreshGit}
          className="grid h-6 w-6 place-items-center rounded hover:bg-[#30363d]"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Branch */}
      <div className="border-b border-[#30363d] px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <GitBranch size={14} />
          <span>{currentBranch || "No branch"}</span>
        </div>
      </div>

      {/* Commit box */}
      <div className="border-b border-[#30363d] p-3">
        <textarea
          value={commitMessage}
          onChange={(event) => setCommitMessage(event.target.value)}
          placeholder="Message (required)"
          className="h-16 w-full resize-none rounded border border-[#30363d] bg-[#0d1117] p-2 text-xs text-[#e6edf3] outline-none placeholder:text-[#6e7681] focus:border-[#58a6ff]"
        />

        <button
          type="button"
          disabled={loading}
          onClick={handleCommit}
          className="mt-2 flex h-7 w-full items-center justify-center gap-2 rounded bg-[#238636] text-xs font-medium text-white hover:bg-[#2ea043] disabled:opacity-50"
        >
          <Check size={14} />
          Commit
        </button>
      </div>

      {/* Remote actions */}
      <div className="flex gap-1 border-b border-[#30363d] p-2">
        <button
          type="button"
          onClick={handlePull}
          disabled={loading}
          title="Pull"
          className="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs hover:bg-[#21262d]"
        >
          <ArrowDown size={13} />
          Pull
        </button>

        <button
          type="button"
          onClick={handlePush}
          disabled={loading}
          title="Push"
          className="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs hover:bg-[#21262d]"
        >
          <ArrowUp size={13} />
          Push
        </button>

        <button
          type="button"
          onClick={handleFetch}
          disabled={loading}
          title="Fetch"
          className="grid w-8 place-items-center rounded hover:bg-[#21262d]"
        >
          <Upload size={13} />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="border-b border-[#30363d] px-3 py-2 text-[11px] text-[#8b949e]">
          {message}
        </div>
      )}

      {/* Files */}
      <div className="min-h-0 flex-1 overflow-auto">
        {/* Changes */}
        <section>
          <div className="flex h-8 items-center justify-between px-3 text-[11px] font-semibold">
            <span>CHANGES</span>

            {changedFiles.length > 0 && (
              <span className="text-[#8b949e]">
                {changedFiles.length}
              </span>
            )}
          </div>

          {changedFiles.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-[#6e7681]">
              No changes
            </div>
          ) : (
            changedFiles.map(([path]) => (
              <div
                key={path}
                className="group flex h-7 items-center gap-2 px-3 hover:bg-[#21262d]"
              >
                <span className="min-w-0 flex-1 truncate text-xs">
                  {path}
                </span>

                <button
                  type="button"
                  title="Stage"
                  onClick={() => handleStage(path)}
                  className="grid h-5 w-5 place-items-center rounded opacity-0 hover:bg-[#30363d] group-hover:opacity-100"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))
          )}
        </section>

        {/* Staged */}
        <section className="border-t border-[#30363d]">
          <div className="flex h-8 items-center justify-between px-3 text-[11px] font-semibold">
            <span>STAGED CHANGES</span>

            {stagedFiles.length > 0 && (
              <span className="text-[#8b949e]">
                {stagedFiles.length}
              </span>
            )}
          </div>

          {stagedFiles.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-[#6e7681]">
              No staged changes
            </div>
          ) : (
            stagedFiles.map(([path]) => (
              <div
                key={path}
                className="group flex h-7 items-center gap-2 px-3 hover:bg-[#21262d]"
              >
                <span className="min-w-0 flex-1 truncate text-xs">
                  {path}
                </span>

                <button
                  type="button"
                  title="Unstage"
                  onClick={() => handleUnstage(path)}
                  className="grid h-5 w-5 place-items-center rounded opacity-0 hover:bg-[#30363d] group-hover:opacity-100"
                >
                  <Minus size={14} />
                </button>
              </div>
            ))
          )}
        </section>

        {/* Branches */}
        <section className="border-t border-[#30363d]">
          <div className="flex h-8 items-center gap-2 px-3 text-[11px] font-semibold">
            <GitBranch size={13} />
            BRANCHES
          </div>

          {branches.map((branch) => (
            <div
              key={branch}
              className={`px-3 py-1.5 text-xs ${
                branch === currentBranch
                  ? "bg-[#1f6feb]/20 text-[#58a6ff]"
                  : "text-[#8b949e]"
              }`}
            >
              {branch}
            </div>
          ))}
        </section>

        {/* Debug for now */}
        <button
          type="button"
          onClick={handleLog}
          className="m-3 flex items-center gap-2 rounded border border-[#30363d] px-2 py-1.5 text-[11px] hover:bg-[#21262d]"
        >
          <GitBranch size={13} />
          Print Git Log
        </button>
      </div>
    </aside>
  );
}