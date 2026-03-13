export interface GenerateOptions {
  language: string;
  docker?: boolean;
  testing?: boolean;
  author?: string;
  description?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface Plugin {
  name: string;
  description: string;
  addons?: string[];
  generate(projectName: string, options: GenerateOptions): Promise<void>;
}

export interface PluginConfig {
  name: string;
  description: string;
  addons: string[];
}
