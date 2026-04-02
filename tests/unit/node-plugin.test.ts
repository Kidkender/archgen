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

import { NodePlugin } from "../../plugins/node";

describe("NodePlugin", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new NodePlugin();
  });

  it("has correct metadata", () => {
    expect(plugin.name).toBe("node-typescript");
    expect(plugin.addons).toContain("docker");
    expect(plugin.addons).toContain("testing");
    expect(plugin.addons).toContain("ci");
    expect(plugin.addons).toContain("husky");
  });

  it("generate() calls processTemplate for base template", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app" });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.stringContaining("base"),
      "/tmp/my-app",
      expect.objectContaining({ PROJECT_NAME: "my-app" }),
      false,
    );
  });

  it("generate() includes AUTHOR and DESCRIPTION in variables", async () => {
    await plugin.generate("my-app", {
      language: "node",
      outputDir: "/tmp/my-app",
      author: "Duck",
      description: "Test desc",
    });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.stringContaining("base"),
      expect.any(String),
      expect.objectContaining({ AUTHOR: "Duck", DESCRIPTION: "Test desc" }),
      false,
    );
  });

  it("generate() applies postgresql addon when database=postgresql", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app", database: "postgresql" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("database", "postgresql")))).toBe(true);
  });

  it("generate() applies docker addon when docker=true", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app", docker: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("docker"))).toBe(true);
  });

  it("generate() uses docker-pg variant when postgresql + docker", async () => {
    await plugin.generate("my-app", {
      language: "node",
      outputDir: "/tmp/my-app",
      database: "postgresql",
      docker: true,
    });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("docker-pg"))).toBe(true);
  });

  it("generate() applies testing addon when testing=true", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app", testing: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("testing"))).toBe(true);
  });

  it("generate() applies ci addon when ci=true", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app", ci: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("ci"))).toBe(true);
  });

  it("generate() applies husky addon when husky=true", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app", husky: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("husky"))).toBe(true);
  });

  it("generate() dry-run returns file list without writing", async () => {
    mockProcessTemplate.mockResolvedValue(["/tmp/my-app/src/index.ts", "/tmp/my-app/package.json"]);
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app", dryRun: true });
    expect(mockProcessTemplate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Object),
      true,
    );
  });

  it("applyAddon() reads package.json for project name", async () => {
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    await plugin.applyAddon("/tmp/my-project", "testing", { dryRun: false });
    expect(mockFs.readFile).toHaveBeenCalledWith(
      path.join("/tmp/my-project", "package.json"),
    );
  });

  it("applyAddon() uses docker-pg when prisma schema has postgresql provider", async () => {
    mockFs.readFile
      .mockResolvedValueOnce(JSON.stringify({ name: "my-project" }))
      .mockResolvedValueOnce('datasource db {\n  provider = "postgresql"\n}');
    await plugin.applyAddon("/tmp/my-project", "docker", { dryRun: false });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes("docker-pg"))).toBe(true);
  });

  it("applyAddon() throws when addon dir does not exist", async () => {
    mockFs.exists.mockReturnValue(false);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    await expect(plugin.applyAddon("/tmp/my-project", "unknown-addon", {})).rejects.toThrow(
      /not found/,
    );
  });
});
