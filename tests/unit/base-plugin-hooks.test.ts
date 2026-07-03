import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import { AddAddonOptions, GenerateOptions } from "../../types";

const { mockFs, mockProcessTemplate } = vi.hoisted(() => {
  const mockProcessTemplate = vi.fn().mockResolvedValue([]);
  const mockFs = {
    exists: vi.fn().mockReturnValue(true),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(""),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getAllFiles: vi.fn().mockResolvedValue([]),
  };
  return { mockFs, mockProcessTemplate };
});

vi.mock("../../core/file-system", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FileSystem: vi.fn().mockImplementation(function (this: any) { return mockFs; }),
}));

vi.mock("../../core/template-engine", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TemplateEngine: vi.fn().mockImplementation(function (this: any) {
    return { processTemplate: mockProcessTemplate };
  }),
}));

import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";

class TestPlugin extends BasePlugin {
  readonly name = "test-plugin";
  readonly description = "Plugin used to test BasePlugin lifecycle hooks";
  readonly addons: string[] = ["thing"];
  calls: string[] = [];

  protected get relativeTemplateDir(): string {
    return "test/template";
  }

  protected getVariables(projectName: string): TemplateVariables {
    return { PROJECT_NAME: projectName };
  }

  protected getAddonEntries(): AddonEntry[] {
    return [];
  }

  protected async readProjectName(projectPath: string): Promise<string> {
    return path.basename(projectPath);
  }

  showNextSteps(): void {
    // no-op for test
  }

  protected async beforeGenerate(): Promise<void> {
    this.calls.push("beforeGenerate");
  }

  protected async afterGenerate(): Promise<void> {
    this.calls.push("afterGenerate");
  }

  protected async beforeApplyAddon(): Promise<void> {
    this.calls.push("beforeApplyAddon");
  }

  protected async afterApplyAddon(): Promise<void> {
    this.calls.push("afterApplyAddon");
  }
}

describe("BasePlugin lifecycle hooks — generate()", () => {
  let plugin: TestPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new TestPlugin();
  });

  it("calls beforeGenerate before template processing and afterGenerate after", async () => {
    const options: GenerateOptions = { language: "test", outputDir: "/tmp/my-app" };
    await plugin.generate("my-app", options);
    expect(plugin.calls).toEqual(["beforeGenerate", "afterGenerate"]);
  });

  it("still calls afterGenerate exactly once on dry-run", async () => {
    const options: GenerateOptions = { language: "test", outputDir: "/tmp/my-app", dryRun: true };
    await plugin.generate("my-app", options);
    expect(plugin.calls).toEqual(["beforeGenerate", "afterGenerate"]);
  });

  it("does not call afterGenerate if beforeGenerate throws", async () => {
    class ThrowingPlugin extends TestPlugin {
      protected async beforeGenerate(): Promise<void> {
        this.calls.push("beforeGenerate");
        throw new Error("validation failed");
      }
    }
    const throwing = new ThrowingPlugin();
    const options: GenerateOptions = { language: "test", outputDir: "/tmp/my-app" };
    await expect(throwing.generate("my-app", options)).rejects.toThrow("validation failed");
    expect(throwing.calls).toEqual(["beforeGenerate"]);
    expect(mockProcessTemplate).not.toHaveBeenCalled();
  });
});

describe("BasePlugin lifecycle hooks — applyAddon()", () => {
  let plugin: TestPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue("");
    plugin = new TestPlugin();
  });

  it("calls beforeApplyAddon before template processing and afterApplyAddon after", async () => {
    const options: AddAddonOptions = { dryRun: false };
    await plugin.applyAddon("/tmp/my-app", "thing", options);
    expect(plugin.calls).toEqual(["beforeApplyAddon", "afterApplyAddon"]);
  });

  it("calls beforeApplyAddon but not afterApplyAddon when addon dir is missing", async () => {
    mockFs.exists.mockReturnValue(false);
    const options: AddAddonOptions = { dryRun: false };
    await expect(plugin.applyAddon("/tmp/my-app", "unknown", options)).rejects.toThrow(/not found/);
    expect(plugin.calls).toEqual(["beforeApplyAddon"]);
  });
});
