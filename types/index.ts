export interface GenerateOptions {
  language: string;
  docker?: boolean;
  testing?: boolean;
  author?: string;
  description?: string;
  force?: boolean;
  dryRun?: boolean;
  database?: string;
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
