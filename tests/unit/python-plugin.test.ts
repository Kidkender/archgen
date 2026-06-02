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

// ─── v1.1 Python parity addon entries ─────────────────────────────────────────

describe("PythonPlugin — v1.1 addons metadata", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("exposes email in addon list", () => {
    expect(plugin.addons).toContain("email");
  });

  it("exposes s3 in addon list", () => {
    expect(plugin.addons).toContain("s3");
  });

  it("exposes oauth in addon list", () => {
    expect(plugin.addons).toContain("oauth");
  });

  it("exposes api-docs in addon list", () => {
    expect(plugin.addons).toContain("api-docs");
  });

  it("exposes websocket in addon list", () => {
    expect(plugin.addons).toContain("websocket");
  });
});

describe("PythonPlugin — email addon", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("applies email addon when email=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", email: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(true);
  });

  it("skips email addon when email=false", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", email: false });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(false);
  });

  it("skips email addon when email is undefined", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(false);
  });
});

describe("PythonPlugin — s3 addon", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("applies s3 addon when s3=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", s3: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "s3")))).toBe(true);
  });

  it("skips s3 addon when s3=false", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", s3: false });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "s3")))).toBe(false);
  });
});

describe("PythonPlugin — oauth addon", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("applies oauth addon when oauth=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", oauth: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "oauth")))).toBe(true);
  });

  it("skips oauth addon when oauth=false", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", oauth: false });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "oauth")))).toBe(false);
  });
});

describe("PythonPlugin — api-docs addon", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("applies api-docs addon when apiDocs=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", apiDocs: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "api-docs")))).toBe(true);
  });

  it("skips api-docs addon when apiDocs=false", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", apiDocs: false });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "api-docs")))).toBe(false);
  });
});

describe("PythonPlugin — websocket addon", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("applies websocket addon when websocket=true", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", websocket: true });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "websocket")))).toBe(true);
  });

  it("skips websocket addon when websocket=false", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api", websocket: false });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "websocket")))).toBe(false);
  });

  it("applies multiple addons together correctly", async () => {
    await plugin.generate("my-api", {
      language: "python",
      outputDir: "/tmp/my-api",
      email: true,
      oauth: true,
      websocket: true,
    });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(true);
    expect(calls.some((p) => p.includes(path.join("addons", "oauth")))).toBe(true);
    expect(calls.some((p) => p.includes(path.join("addons", "websocket")))).toBe(true);
  });
});
