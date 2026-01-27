import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();

/**
 * Extract ticket ID from a string (branch name, folder name, etc.)
 * Matches patterns like NFOR-225, ABC-123, etc.
 */
export function extractTicketId(str: string): string | null {
  const match = str.match(/([A-Z]+-\d+)/);
  return match ? match[1] : null;
}

/**
 * Get the current git branch name
 */
export async function getCurrentBranch(): Promise<string> {
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim();
}

/**
 * Get ticket ID from current branch
 */
export async function getTicketFromBranch(): Promise<string | null> {
  try {
    const branch = await getCurrentBranch();
    return extractTicketId(branch);
  } catch {
    return null;
  }
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

/**
 * Get the root directory of the git repository
 */
export async function getRepoRoot(): Promise<string> {
  const root = await git.revparse(['--show-toplevel']);
  return root.trim();
}

/**
 * Get the current commit hash (short form)
 */
export async function getCurrentCommitHash(): Promise<string> {
  const hash = await git.revparse(['--short', 'HEAD']);
  return hash.trim();
}

/**
 * Get the current commit hash (full form)
 */
export async function getCurrentCommitHashFull(): Promise<string> {
  const hash = await git.revparse(['HEAD']);
  return hash.trim();
}

/**
 * Check if a commit exists in the current branch's history
 */
export async function commitExistsInBranch(commitHash: string): Promise<boolean> {
  try {
    // Check if commit is an ancestor of HEAD by seeing if merge-base returns the commit itself
    const mergeBase = await git.raw(['merge-base', commitHash, 'HEAD']);
    const resolvedCommit = await git.raw(['rev-parse', '--short', commitHash]);
    const resolvedMergeBase = await git.raw(['rev-parse', '--short', mergeBase.trim()]);

    // If merge-base equals the commit, then commit is an ancestor of HEAD
    return resolvedMergeBase.trim() === resolvedCommit.trim();
  } catch {
    return false;
  }
}

/**
 * Check if there are uncommitted changes in a specific path
 */
export async function hasUncommittedChanges(path?: string): Promise<boolean> {
  try {
    const status = await git.status(path ? [path] : []);
    return !status.isClean();
  } catch {
    return false;
  }
}

/**
 * Count how many commits HEAD is ahead of a given commit
 * Returns 0 if the commit is the same as HEAD or ahead of HEAD
 */
export async function commitsAhead(baseCommit: string): Promise<number> {
  try {
    // Check if baseCommit exists in repo first
    const exists = await commitExistsInBranch(baseCommit);
    if (!exists) {
      return -1; // Commit not in current branch
    }

    // Count commits between baseCommit and HEAD
    const result = await git.raw(['rev-list', '--count', `${baseCommit}..HEAD`]);
    return parseInt(result.trim(), 10);
  } catch {
    return -1;
  }
}
