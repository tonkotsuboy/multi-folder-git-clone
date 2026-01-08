import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  popToRoot,
} from '@raycast/api';
import { useState, useEffect } from 'react';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

type Preferences = {
  cloneBasePath: string;
  useOrgDirectory: boolean;
  numberingSeparator: string;
};

type FormValues = {
  repositoryUrl: string;
  cloneCount: string;
};

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [cloneCount, setCloneCount] = useState('1');
  const [cloneCountError, setCloneCountError] = useState<string | undefined>();
  const [previewPaths, setPreviewPaths] = useState<string[]>([]);
  const preferences = getPreferenceValues<Preferences>();

  const basePath = preferences.cloneBasePath.replace(/^~/, process.env.HOME ?? '');
  const examplePath = preferences.useOrgDirectory ? `${basePath}/org/repo` : `${basePath}/repo`;

  // Handle clone count input (numbers only)
  const handleCloneCountChange = (value: string) => {
    // Allow empty string
    if (value === '') {
      setCloneCount('');
      setCloneCountError(undefined);
      return;
    }

    // Allow only digits
    if (!/^\d+$/.test(value)) {
      setCloneCountError('Please enter a number');
      return;
    }

    const num = parseInt(value, 10);
    if (num < 1 || num > 10) {
      setCloneCountError('Clone count must be between 1 and 10');
    } else {
      setCloneCountError(undefined);
    }

    setCloneCount(value);
  };

  // Generate preview paths (async to check existing directories)
  useEffect(() => {
    const updatePreviewPaths = async () => {
      if (!repositoryUrl) {
        setPreviewPaths([]);
        return;
      }

      const match = repositoryUrl.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/);
      if (!match) {
        setPreviewPaths([]);
        return;
      }

      const [, org, repo] = match;
      const separator = preferences.numberingSeparator ?? '-';
      const count = parseInt(cloneCount, 10);

      if (isNaN(count) || count < 1 || count > 10) {
        setPreviewPaths([]);
        return;
      }

      let targetPath: string;

      if (preferences.useOrgDirectory) {
        targetPath = path.join(basePath, org, repo);
      } else {
        targetPath = path.join(basePath, repo);
      }

      // Determine actual clone paths (same logic as handleSubmit)
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

      setPreviewPaths(paths);
    };

    updatePreviewPaths();
  }, [repositoryUrl, cloneCount, basePath, preferences.useOrgDirectory, preferences.numberingSeparator]);

  async function handleSubmit(values: FormValues) {
    const { repositoryUrl, cloneCount: cloneCountStr } = values;

    if (!repositoryUrl) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Error',
        message: 'Repository URL is required',
      });
      return;
    }

    const count = parseInt(cloneCountStr, 10);
    if (isNaN(count) || count < 1 || count > 10) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Error',
        message: 'Clone count must be between 1 and 10',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Extract org/repo from URL or use direct format
      const match = repositoryUrl.match(
        /^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/
      );

      if (!match) {
        throw new Error("Invalid repository format. Use 'org/repo' or full GitHub URL");
      }

      const [, org, repo] = match;
      const separator = preferences.numberingSeparator ?? '-';

      // Determine base paths
      let targetPath: string;
      let parentPath: string;

      if (preferences.useOrgDirectory) {
        parentPath = path.join(basePath, org);
        targetPath = path.join(parentPath, repo);
      } else {
        parentPath = basePath;
        targetPath = path.join(basePath, repo);
      }

      // Create parent directory
      await fs.mkdir(parentPath, { recursive: true });

      // Pre-determine all clone paths (sequential to avoid race conditions)
      const clonePaths: string[] = [];
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

        clonePaths.push(finalPath);
        usedPaths.add(finalPath);
      }

      // Show initial toast
      const progressToast = await showToast({
        style: Toast.Style.Animated,
        title: `Cloning ${count} ${count === 1 ? 'repository' : 'repositories'}...`,
        message: 'Running in parallel',
      });

      // Clone repositories in parallel
      const clonePromises = clonePaths.map(async (finalPath, index) => {
        try {
          await execAsync(`git clone https://github.com/${org}/${repo} "${finalPath}"`);
          return { path: finalPath, success: true, index };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { path: finalPath, success: false, error: errorMessage, index };
        }
      });

      const results = await Promise.all(clonePromises);

      // Show final summary
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      progressToast.style = successCount === count ? Toast.Style.Success : Toast.Style.Failure;
      progressToast.title = `Clone complete: ${successCount}/${count} succeeded`;
      progressToast.message =
        failureCount > 0
          ? `${failureCount} failed`
          : `All ${count} ${count === 1 ? 'repository' : 'repositories'} cloned successfully`;

      // Add action to open first successful clone
      const firstSuccess = results.find((r) => r.success);
      if (firstSuccess) {
        progressToast.primaryAction = {
          title: 'Open in Finder',
          onAction: async () => {
            await execAsync(`open "${firstSuccess.path}"`);
          },
        };
      }

      // Show individual results if there were failures
      if (failureCount > 0) {
        for (const result of results) {
          if (!result.success) {
            await showToast({
              style: Toast.Style.Failure,
              title: `Failed: ${path.basename(result.path)}`,
              message: result.error ?? 'Unknown error',
            });
          }
        }
      }

      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Clone failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Clone Repository" />
          <Action.OpenInBrowser
            title="Open Extension Settings"
            url="raycast://extensions/tonkotsuboy/git-clone-helper"
            shortcut={{ modifiers: ['cmd'], key: ',' }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        text={`Repositories will be cloned to: ${examplePath}\n\nTo change settings, press ⌘ + , or select "Open Extension Settings" from Actions`}
      />
      <Form.TextField
        id="repositoryUrl"
        title="Repository"
        placeholder="org/repo or https://github.com/org/repo"
        info="Enter GitHub repository in 'org/repo' format or full URL"
        value={repositoryUrl}
        onChange={setRepositoryUrl}
      />
      <Form.TextField
        id="cloneCount"
        title="Clone Count"
        placeholder="1"
        info="Number of clones to create (1-10). Clones run in parallel for faster execution."
        value={cloneCount}
        onChange={handleCloneCountChange}
        error={cloneCountError}
      />
      {previewPaths.length > 1 && (
        <>
          <Form.Separator />
          <Form.Description
            text={`Will clone ${previewPaths.length} copies in parallel:\n${previewPaths.map((p, i) => `${i + 1}. ${p}`).join('\n')}`}
          />
        </>
      )}
    </Form>
  );
}
