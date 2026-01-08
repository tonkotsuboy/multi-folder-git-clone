export type Preferences = {
  cloneBasePath: string;
  useOrgDirectory: boolean;
  numberingSeparator: string;
};

export type FormValues = {
  repositoryUrl: string;
  cloneCount: string;
};

export type CloneResult = {
  path: string;
  success: boolean;
  error?: string;
  index: number;
};
