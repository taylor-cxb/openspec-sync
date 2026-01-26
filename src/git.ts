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
