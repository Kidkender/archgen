export interface GenerateOptions {
  language: string;
  docker?: boolean;
  testing?: boolean;
  author?: string;
  description?: string;
}

export interface Plugin {
  name: string;
  description: string;
  generate(projectName: string, options: GenerateOptions): Promise<void>;
}

export interface PluginConfig {
  name: string;
  description: string;
  addons: string[];
}
