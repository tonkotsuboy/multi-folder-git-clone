import { useState, useEffect } from 'react';
import type { Preferences } from '../types';
import { parseRepositoryUrl, resolveClonePaths } from '../lib/clone-helper';

export function useClonePreview(
  repositoryUrl: string,
  cloneCount: number | null,
  preferences: Preferences,
  basePath: string
) {
  const [previewPaths, setPreviewPaths] = useState<string[]>([]);

  useEffect(() => {
    const updatePreviewPaths = async () => {
      if (!repositoryUrl || !cloneCount) {
        setPreviewPaths([]);
        return;
      }

      const parsed = parseRepositoryUrl(repositoryUrl);
      if (!parsed) {
        setPreviewPaths([]);
        return;
      }

      try {
        const paths = await resolveClonePaths(
          parsed.org,
          parsed.repo,
          cloneCount,
          preferences,
          basePath
        );
        setPreviewPaths(paths);
      } catch {
        setPreviewPaths([]);
      }
    };

    updatePreviewPaths();
  }, [repositoryUrl, cloneCount, basePath, preferences]);

  return previewPaths;
}
