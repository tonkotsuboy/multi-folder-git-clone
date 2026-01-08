import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import type { Preferences, CloneResult } from '../types';

const execAsync = promisify(exec);

/**
 * Parse repository URL to extract org and repo names
 */
export function parseRepositoryUrl(url: string): { org: string; repo: string } | null {
  const match = url.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    return null;
  }
  const [, org, repo] = match;
  return { org, repo };
}

/**
 * Resolve clone paths with automatic numbering for duplicates
 */
export async function resolveClonePaths(
  org: string,
  repo: string,
  count: number,
  preferences: Preferences,
  basePath: string
): Promise<string[]> {
  const separator = preferences.numberingSeparator ?? '-';
  const targetPath = preferences.useOrgDirectory
    ? path.join(basePath, org, repo)
    : path.join(basePath, repo);

  const paths: string[] = [];
  const usedPaths = new Set<string>();

  for (let i = 0; i < count; i++) {
    let finalPath: string;

    if (i === 0) {
      // First clone: use original path or find next available number
      finalPath = targetPath;
      try {
        await fs.access(finalPath);
        // Directory exists, find next available number
        let counter = 2;
        while (true) {
          const numberedPath = `${targetPath}${separator}${counter}`;
          try {
            await fs.access(numberedPath);
            counter++;
          } catch {
            if (!usedPaths.has(numberedPath)) {
              finalPath = numberedPath;
              break;
            }
            counter++;
          }
        }
      } catch {
        // Directory doesn't exist, use original path
      }
    } else {
      // Subsequent clones: find next available numbered path
      let counter = 2;
      while (true) {
        const numberedPath = `${targetPath}${separator}${counter}`;
        try {
          await fs.access(numberedPath);
          counter++;
        } catch {
          if (!usedPaths.has(numberedPath)) {
            finalPath = numberedPath;
            break;
          }
          counter++;
        }
      }
    }

    paths.push(finalPath);
    usedPaths.add(finalPath);
  }

  return paths;
}

/**
 * Execute git clone for a single repository
 */
async function cloneSingleRepository(
  org: string,
  repo: string,
  targetPath: string,
  index: number
): Promise<CloneResult> {
  try {
    await execAsync(`git clone https://github.com/${org}/${repo} "${targetPath}"`);
    return { path: targetPath, success: true, index };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { path: targetPath, success: false, error: errorMessage, index };
  }
}

/**
 * Clone repositories in parallel to multiple paths
 */
export async function cloneRepositories(
  org: string,
  repo: string,
  paths: string[]
): Promise<CloneResult[]> {
  const clonePromises = paths.map((targetPath, index) =>
    cloneSingleRepository(org, repo, targetPath, index)
  );

  return Promise.all(clonePromises);
}

/**
 * Create parent directory if it doesn't exist
 */
export async function ensureParentDirectory(
  org: string,
  preferences: Preferences,
  basePath: string
): Promise<void> {
  const parentPath = preferences.useOrgDirectory ? path.join(basePath, org) : basePath;
  await fs.mkdir(parentPath, { recursive: true });
}
