export interface GenerateOptions {
  language: string;
  docker?: boolean;
  testing?: boolean;
  ci?: boolean;
  author?: string;
  description?: string;
  force?: boolean;
  dryRun?: boolean;
  database?: string;
  skipGit?: boolean;
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
