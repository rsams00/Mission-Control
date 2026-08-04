// Thin wrapper around `git worktree` for Phase 4 (Parallelism). Every
// project gets its own local git repo under data/repos/<project-id> —
// separate from the Mission-Control repo itself — so Backend and Frontend
// can each work in a real worktree/branch during Build, and approving
// Build performs a real merge into that repo's main branch.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const REPOS_ROOT = path.resolve(here, "../../../data/repos");

export class MergeConflictError extends Error {
  constructor(
    public readonly branch: string,
    public readonly details: string,
  ) {
    super(`merge conflict merging '${branch}': ${details}`);
  }
}

async function git(cwd: string, args: string[]) {
  return execFileAsync("git", args, { cwd });
}

function repoPathFor(projectId: string) {
  return path.join(REPOS_ROOT, projectId);
}

function worktreePathFor(projectId: string, branch: string) {
  return path.join(REPOS_ROOT, projectId, ".worktrees", branch);
}

/** Idempotent: git-inits the project's repo on first call, returns its path. */
export async function ensureProjectRepo(projectId: string): Promise<string> {
  const repoPath = repoPathFor(projectId);
  if (existsSync(path.join(repoPath, ".git"))) return repoPath;

  await mkdir(repoPath, { recursive: true });
  await git(repoPath, ["init", "-b", "main"]);
  await git(repoPath, ["config", "user.email", "orchestrator@mission-control.local"]);
  await git(repoPath, ["config", "user.name", "Mission Control Orchestrator"]);
  await writeFile(
    path.join(repoPath, "README.md"),
    "# Project repo\n\nAuto-scaffolded by Mission Control on first entry to Build.\n",
  );
  // Worktrees live inside the repo path itself (.worktrees/<branch>) —
  // gitignore them so they never show up as untracked clutter or risk
  // being accidentally committed.
  await writeFile(path.join(repoPath, ".gitignore"), ".worktrees/\n");
  await git(repoPath, ["add", "README.md", ".gitignore"]);
  await git(repoPath, ["commit", "-m", "Initial commit"]);
  return repoPath;
}

/** Creates a worktree + branch off main for one coding session. */
export async function createWorktree(projectId: string, branch: string): Promise<string> {
  const repoPath = repoPathFor(projectId);
  const worktreePath = worktreePathFor(projectId, branch);
  await mkdir(path.dirname(worktreePath), { recursive: true });
  await git(repoPath, ["worktree", "add", "-b", branch, worktreePath, "main"]);
  return worktreePath;
}

/** Writes a file inside a worktree and commits it on that worktree's branch. */
export async function commitFileInWorktree(
  worktreePath: string,
  relativeFilePath: string,
  content: string,
  message: string,
): Promise<void> {
  const filePath = path.join(worktreePath, relativeFilePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
  await git(worktreePath, ["add", relativeFilePath]);
  await git(worktreePath, ["commit", "-m", message]);
}

/**
 * Merges a worktree branch into the project repo's main branch. Throws
 * MergeConflictError (never auto-resolves) if the merge doesn't apply
 * cleanly — the caller aborts the merge and leaves main untouched.
 */
export async function mergeBranchToMain(projectId: string, branch: string): Promise<void> {
  const repoPath = repoPathFor(projectId);
  await git(repoPath, ["checkout", "main"]);
  try {
    await git(repoPath, ["merge", "--no-ff", "-m", `Merge ${branch} into main`, branch]);
  } catch (err) {
    await git(repoPath, ["merge", "--abort"]).catch(() => {});
    const details = err instanceof Error ? err.message : String(err);
    throw new MergeConflictError(branch, details);
  }
}

/** Removes a worktree after its branch has been merged (or abandoned). */
export async function removeWorktree(projectId: string, branch: string): Promise<void> {
  const repoPath = repoPathFor(projectId);
  const worktreePath = worktreePathFor(projectId, branch);
  await git(repoPath, ["worktree", "remove", worktreePath, "--force"]).catch(() => {});
  await rm(worktreePath, { recursive: true, force: true });
}
