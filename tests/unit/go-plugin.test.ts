import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

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

import { GoPlugin } from "../../plugins/go";

describe("GoPlugin", () => {
  let plugin: GoPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new GoPlugin();
  });

  it("has correct metadata", () => {
    expect(plugin.name).toBe("Go");
    expect(plugin.addons).toContain("docker");
    expect(plugin.addons).toContain("jwt");
  });

  it("generate() uses provided modulePath in variables", async () => {
    await plugin.generate("my-app", {
      language: "go",
      modulePath: "github.com/acme/my-app",
      outputDir: "/tmp/my-app",
    });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ MODULE_PATH: "github.com/acme/my-app" }),
      false,
    );
  });

  it("applyAddon() reads go.mod and passes its module path to the template engine", async () => {
    mockFs.readFile.mockResolvedValue("module github.com/foo/bar\n\ngo 1.22\n");
    await plugin.applyAddon("/tmp/my-app", "jwt", {});
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      "/tmp/my-app",
      expect.objectContaining({ MODULE_PATH: "github.com/foo/bar" }),
      false,
    );
  });

  it("applyAddon() falls back to a default module path when go.mod cannot be read", async () => {
    mockFs.readFile.mockRejectedValue(new Error("ENOENT"));
    await plugin.applyAddon("/tmp/my-app", "jwt", {});
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      "/tmp/my-app",
      expect.objectContaining({ MODULE_PATH: expect.stringContaining("my-app") }),
      false,
    );
  });

  it("applyAddon() re-derives the module path fresh on each call", async () => {
    mockFs.readFile.mockResolvedValue("module github.com/foo/bar\n\ngo 1.22\n");
    await plugin.applyAddon("/tmp/my-app", "jwt", {});
    expect(mockProcessTemplate).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ MODULE_PATH: "github.com/foo/bar" }),
      false,
    );

    mockFs.readFile.mockRejectedValue(new Error("ENOENT"));
    await plugin.applyAddon("/tmp/other-app", "jwt", {});
    expect(mockProcessTemplate).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ MODULE_PATH: expect.stringContaining("other-app") }),
      false,
    );
  });

  it("applyAddon() throws when addon dir does not exist", async () => {
    mockFs.exists.mockReturnValue(false);
    mockFs.readFile.mockResolvedValue("module github.com/foo/bar\n");
    await expect(plugin.applyAddon("/tmp/my-app", "unknown-addon", {})).rejects.toThrow(
      /not found/,
    );
  });

  it("readProjectName() derives project name from go.mod module path", async () => {
    mockFs.readFile.mockResolvedValue("module github.com/foo/bar\n");
    await plugin.applyAddon("/tmp/bar", "jwt", {});
    expect(mockFs.readFile).toHaveBeenCalledWith(path.join("/tmp/bar", "go.mod"));
  });
});
