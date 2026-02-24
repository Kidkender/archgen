import { NodePlugin } from "../plugins/node";
import { PythonPlugin } from "../plugins/python";
import { Plugin } from "../types";

class PluginRegistry {
  private plugins: Map<string, Plugin>;

  constructor() {
    this.plugins = new Map();
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register("node", new NodePlugin());
    this.register("python", new PythonPlugin())
  }

  register(name: string, plugin: Plugin) {
    this.plugins.set(name, plugin);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const registry = new PluginRegistry();
