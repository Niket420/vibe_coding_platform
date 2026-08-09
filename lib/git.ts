import git from "isomorphic-git";
import http from "isomorphic-git/http/web";

import { getWebContainer } from "@/lib/webcontainer";
import { gitFs } from "@/lib/git-fs";

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export async function initGit() {
  await getWebContainer();

  await git.init({
    fs: gitFs,
    dir: ".",
    defaultBranch: "main",
  });
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

export async function getGitStatus() {
  await getWebContainer();

  return await git.statusMatrix({
    fs: gitFs,
    dir: ".",
  });
}

/* -------------------------------------------------------------------------- */
/* Staging                                                                     */
/* -------------------------------------------------------------------------- */

export async function stageFile(path: string) {
  await getWebContainer();

  await git.add({
    fs: gitFs,
    dir: ".",
    filepath: path,
  });
}

export async function stageAll() {
  await getWebContainer();

  const status = await getGitStatus();

  for (const [filepath] of status) {
    await git.add({
      fs: gitFs,
      dir: ".",
      filepath,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Unstaging                                                                   */
/* -------------------------------------------------------------------------- */

export async function unstageFile(path: string) {
  await getWebContainer();

  await git.resetIndex({
    fs: gitFs,
    dir: ".",
    filepath: path,
  });
}

export async function unstageAll() {
  await getWebContainer();

  const status = await getGitStatus();

  for (const [filepath] of status) {
    await git.resetIndex({
      fs: gitFs,
      dir: ".",
      filepath,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Commit                                                                      */
/* -------------------------------------------------------------------------- */

export async function commitChanges(
  message: string,
  author: {
    name: string;
    email: string;
  }
) {
  await getWebContainer();

  return await git.commit({
    fs: gitFs,
    dir: ".",
    message,
    author,
  });
}

/* -------------------------------------------------------------------------- */
/* Log                                                                         */
/* -------------------------------------------------------------------------- */

export async function getGitLog(depth = 20) {
  await getWebContainer();

  return await git.log({
    fs: gitFs,
    dir: ".",
    depth,
  });
}

/* -------------------------------------------------------------------------- */
/* Diff                                                                        */
/* -------------------------------------------------------------------------- */

export async function getDiff() {
  await getWebContainer();

  return await git.diff({
    fs: gitFs,
    dir: ".",
  });
}

/* -------------------------------------------------------------------------- */
/* Branches                                                                    */
/* -------------------------------------------------------------------------- */

export async function getBranches() {
  await getWebContainer();

  return await git.listBranches({
    fs: gitFs,
    dir: ".",
  });
}

export async function createBranch(branchName: string) {
  await getWebContainer();

  await git.branch({
    fs: gitFs,
    dir: ".",
    ref: branchName,
  });
}

export async function checkoutBranch(branchName: string) {
  await getWebContainer();

  await git.checkout({
    fs: gitFs,
    dir: ".",
    ref: branchName,
  });
}

export async function deleteBranch(branchName: string) {
  await getWebContainer();

  await git.deleteBranch({
    fs: gitFs,
    dir: ".",
    ref: branchName,
  });
}

/* -------------------------------------------------------------------------- */
/* Remote                                                                      */
/* -------------------------------------------------------------------------- */

export async function getRemotes() {
  await getWebContainer();

  return await git.listRemotes({
    fs: gitFs,
    dir: ".",
  });
}

export async function addRemote(
  name: string,
  url: string
) {
  await getWebContainer();

  await git.addRemote({
    fs: gitFs,
    dir: ".",
    remote: name,
    url,
  });
}

export async function deleteRemote(name: string) {
  await getWebContainer();

  await git.deleteRemote({
    fs: gitFs,
    dir: ".",
    remote: name,
  });
}

/* -------------------------------------------------------------------------- */
/* Fetch                                                                       */
/* -------------------------------------------------------------------------- */

export async function fetchRemote(
  remote = "origin"
) {
  await getWebContainer();

  return await git.fetch({
    fs: gitFs,
    http,
    dir: ".",
    remote,
  });
}

/* -------------------------------------------------------------------------- */
/* Pull                                                                        */
/* -------------------------------------------------------------------------- */

export async function pullRemote(
  remote = "origin",
  ref?: string
) {
  await getWebContainer();

  return await git.pull({
    fs: gitFs,
    http,
    dir: ".",
    remote,
    ref,
    singleBranch: true,
  });
}

/* -------------------------------------------------------------------------- */
/* Push                                                                        */
/* -------------------------------------------------------------------------- */

export async function pushRemote(
  remote = "origin",
  ref?: string
) {
  await getWebContainer();

  return await git.push({
    fs: gitFs,
    http,
    dir: ".",
    remote,
    ref,
  });
}

/* -------------------------------------------------------------------------- */
/* Clone                                                                       */
/* -------------------------------------------------------------------------- */

export async function cloneRepository(
  url: string,
  dir = "."
) {
  await getWebContainer();

  return await git.clone({
    fs: gitFs,
    http,
    dir,
    url,
    singleBranch: false,
  });
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                        */
/* -------------------------------------------------------------------------- */

export async function getTags() {
  await getWebContainer();

  return await git.listTags({
    fs: gitFs,
    dir: ".",
  });
}

export async function createTag(tag: string) {
  await getWebContainer();

  await git.annotatedTag({
    fs: gitFs,
    dir: ".",
    ref: tag,
    message: tag,
    tagger: {
      name: "CodeForge",
      email: "codeforge@example.com",
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Current branch                                                             */
/* -------------------------------------------------------------------------- */

export async function getCurrentBranch() {
  await getWebContainer();

  return await git.currentBranch({
    fs: gitFs,
    dir: ".",
    fullname: false,
  });
}