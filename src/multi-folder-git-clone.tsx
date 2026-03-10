import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  popToRoot,
} from '@raycast/api';
import { useState, useMemo, useCallback } from 'react';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import type { Preferences, FormValues } from './types';
import {
  parseRepositoryUrl,
  resolveClonePaths,
  cloneRepositories,
  ensureParentDirectory,
} from './lib/clone-helper';
import { useCloneCountValidation } from './hooks/useCloneCountValidation';
import { useClonePreview } from './hooks/useClonePreview';

const execAsync = promisify(exec);

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const preferences = getPreferenceValues<Preferences>();

  const basePath = useMemo(
    () => preferences.cloneBasePath.replace(/^~/, process.env.HOME ?? ''),
    [preferences.cloneBasePath]
  );

  const examplePath = useMemo(
    () => (preferences.useOrgDirectory ? `${basePath}/org/repo` : `${basePath}/repo`),
    [basePath, preferences.useOrgDirectory]
  );

  const { cloneCount, cloneCountError, handleCloneCountChange, parsedCount } =
    useCloneCountValidation('1');

  const previewPaths = useClonePreview(repositoryUrl, parsedCount, preferences, basePath);

  const handleSubmit = useCallback(async (values: FormValues) => {
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
      const parsed = parseRepositoryUrl(repositoryUrl);
      if (!parsed) {
        throw new Error("Invalid repository format. Use 'org/repo' or full GitHub URL");
      }

      const { org, repo } = parsed;

      // Create parent directory
      await ensureParentDirectory(org, preferences, basePath);

      // Resolve all clone paths
      const clonePaths = await resolveClonePaths(org, repo, count, preferences, basePath);

      // Show initial toast
      const progressToast = await showToast({
        style: Toast.Style.Animated,
        title: `Cloning ${count} ${count === 1 ? 'repository' : 'repositories'}...`,
        message: 'Running in parallel',
      });

      // Clone repositories in parallel
      const results = await cloneRepositories(org, repo, clonePaths);

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
  }, [preferences, basePath]);

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Multi-Folder Git Clone" />
          <Action.OpenInBrowser
            title="Open Extension Settings"
            url="raycast://extensions/tonkotsuboy/multi-folder-git-clone"
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
