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

import { PythonPlugin } from "../../plugins/python";

describe("PythonPlugin", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("has correct metadata", () => {
    expect(plugin.name).toBe("python-fastapi");
    expect(plugin.addons).toContain("docker");
    expect(plugin.addons).toContain("testing");
    expect(plugin.addons).toContain("ci");
  });

  it("generate() calls processTemplate for base template", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api" });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.stringContaining("base"),
      "/tmp/my-api",
      expect.objectContaining({ PROJECT_NAME: "my-api" }),
      false,
    );
  });

  it("generate() includes PROJECT_NAME_UNDERSCORE in variables", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api" });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.stringContaining("base"),
      expect.any(String),
      expect.objectContaining({ PROJECT_NAME_UNDERSCORE: "my_api" }),
      false,
    );
  });

  it("generate() replaces dashes with underscores in PROJECT_NAME_UNDERSCORE", async () => {
    await plugin.generate("foo-bar-baz", { language: "python", outputDir: "/tmp/foo-bar-baz" });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ PROJECT_NAME_UNDERSCORE: "foo_bar_baz" }),
      false,
    );
  });

  it("generate() applies sqlite addon when database=sqlite", async () => {
    await plugin.generate("my-api", {
      language: "python",
      outputDir: "/tmp/my-api",
      database: "sqlite",
    });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("database", "sqlite")))).toBe(true);
  });

  it("generate() does NOT apply sqlite addon for postgresql (default)", async () => {
    await plugin.generate("my-api", {
      language: "python",
      outputDir: "/tmp/my-api",
      database: "postgresql",
    });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("database", "sqlite")))).toBe(false);
  });

  it("generate() applies docker addon when docker=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", docker: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("docker"))).toBe(true);
  });

  it("generate() applies testing addon when testing=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", testing: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("testing"))).toBe(true);
  });

  it("generate() applies ci addon when ci=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", ci: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("ci"))).toBe(true);
  });

  it("generate() dry-run passes dryRun=true to processTemplate", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", dryRun: true });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Object),
      true,
    );
  });

  it("applyAddon() reads pyproject.toml for project name", async () => {
    mockFs.readFile.mockResolvedValue('name = "my-api"\nversion = "0.1.0"\n');
    await plugin.applyAddon("/tmp/my-api", "testing", { dryRun: false });
    expect(mockFs.readFile).toHaveBeenCalledWith(
      path.join("/tmp/my-api", "pyproject.toml"),
    );
  });

  it("applyAddon() sets PROJECT_NAME_UNDERSCORE in variables", async () => {
    mockFs.readFile.mockResolvedValue('name = "my-api"\n');
    await plugin.applyAddon("/tmp/my-api", "testing", { dryRun: false });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ PROJECT_NAME_UNDERSCORE: "my_api" }),
      false,
    );
  });

  it("applyAddon() throws when addon dir does not exist", async () => {
    mockFs.exists.mockReturnValue(false);
    mockFs.readFile.mockResolvedValue('name = "my-api"\n');
    await expect(plugin.applyAddon("/tmp/my-api", "unknown-addon", {})).rejects.toThrow(
      /not found/,
    );
  });
});
