import { describe, it, expect } from "vitest";
import { registry } from "../../core/registry";

describe("PluginRegistry", () => {
  it("lists registered language keys", () => {
    expect(registry.list()).toContain("node");
    expect(registry.list()).toContain("python");
  });

  it("gets a registered plugin by key", () => {
    const plugin = registry.get("node");
    expect(plugin).toBeDefined();
    expect(plugin?.name).toBe("node-typescript");
  });

  it("returns undefined for unknown language", () => {
    expect(registry.get("ruby")).toBeUndefined();
  });

  it("listDetailed returns name, description and addons", () => {
    const detailed = registry.listDetailed();
    expect(detailed.length).toBeGreaterThan(0);
    for (const entry of detailed) {
      expect(entry.key).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(Array.isArray(entry.addons)).toBe(true);
    }
  });

  it("all plugins include the ci addon", () => {
    const detailed = registry.listDetailed();
    for (const entry of detailed) {
      expect(entry.addons).toContain("ci");
    }
  });

  it("plugins expose stack info", () => {
    const node = registry.get("node");
    const python = registry.get("python");
    expect(node?.stack).toBeDefined();
    expect(node?.stack?.framework).toBeTruthy();
    expect(python?.stack).toBeDefined();
    expect(python?.stack?.framework).toBeTruthy();
  });
});
