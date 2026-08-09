import git from "isomorphic-git";
import http from "isomorphic-git/http/web";

import { getWebContainer } from "@/lib/webcontainer";
import { gitFs } from "@/lib/git-fs";

export async function initGit() {
  await getWebContainer();

  await git.init({
    fs: gitFs,
    dir: ".",
    defaultBranch: "main",
  });
}


export async function getGitStatus() {
  await getWebContainer();
  const status = await git.statusMatrix({
    fs: gitFs,
    dir: ".",
  });
  return status;
}