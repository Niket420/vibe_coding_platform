import type { WebContainer } from "@webcontainer/api";

// WebContainer's FileSystemAPI has no `stat` — existence/type has to be
// inferred by listing the parent directory and matching the entry.
export async function statPath(
  webcontainer: WebContainer,
  filePath: string,
): Promise<{ exists: boolean; isDirectory: boolean }> {
  const normalized = filePath.replace(/^\.\/+/, "").replace(/\/+$/, "");
  const lastSlash = normalized.lastIndexOf("/");
  const parentDir = lastSlash === -1 ? "." : normalized.slice(0, lastSlash);
  const name = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);

  try {
    const entries = await webcontainer.fs.readdir(parentDir, { withFileTypes: true });
    const match = entries.find((entry) => entry.name === name);

    if (!match) return { exists: false, isDirectory: false };
    return { exists: true, isDirectory: match.isDirectory() };
  } catch {
    return { exists: false, isDirectory: false };
  }
}
