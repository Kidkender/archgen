export interface GenerateOptions {
  language: string;
  docker?: boolean;
  testing?: boolean;
  ci?: boolean;
  husky?: boolean;
  websocket?: boolean;
  oauth?: boolean;
  apiDocs?: boolean;
  author?: string;
  description?: string;
  force?: boolean;
  dryRun?: boolean;
  database?: string;
  skipGit?: boolean;
  output?: string;
  claudeCode?: boolean;
  cursor?: boolean;
  email?: boolean;
  s3?: boolean;
  queue?: boolean;
  preCommit?: boolean;
  observability?: boolean;
  sentry?: boolean;
  /** Go module path, e.g. github.com/username/my-app */
  modulePath?: string;
  /** JWT authentication addon (Go only) */
  jwt?: boolean;
  /** Resolved absolute output path — set internally by ArchGen before calling plugin.generate() */
  outputDir?: string;
}

export interface StackInfo {
  runtime: string;
  framework: string;
  orm?: string;
  database?: string;
  cache?: string;
  auth?: string;
  validation?: string;
  testing?: string;
  extras?: string[];
}

export interface AddAddonOptions {
  dryRun?: boolean;
  sentry?: boolean;
}

export interface Plugin {
  name: string;
  description: string;
  addons?: string[];
  stack?: StackInfo;
  generate(projectName: string, options: GenerateOptions): Promise<void>;
  applyAddon?(projectPath: string, addon: string, options: AddAddonOptions): Promise<void>;
}

export interface PluginConfig {
  name: string;
  description: string;
  addons: string[];
}
