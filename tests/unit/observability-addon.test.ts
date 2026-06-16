import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

const { mockFs, mockProcessTemplate, mockFsExtra } = vi.hoisted(() => {
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
  const mockFsExtra = {
    readJson: vi.fn().mockResolvedValue({ dependencies: {} }),
    writeJson: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('name = "my-api"\n"pyjwt>=2.11.0",\n]'),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
  return { mockFs, mockProcessTemplate, mockFsExtra };
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

vi.mock("fs-extra", () => ({ default: mockFsExtra, ...mockFsExtra }));

import { NodePlugin } from "../../plugins/node";
import { PythonPlugin } from "../../plugins/python";

// ─── Node observability — config ─────────────────────────────────────────────

describe("Node observability — config", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("exposes observability in addon list", () => {
    expect(plugin.addons).toContain("observability");
  });
});

// ─── Node observability — generate() ────────────────────────────────────────

describe("Node observability — generate()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("applies observability addon when observability=true", async () => {
    await plugin.generate("my-app", { language: "node", observability: true, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "observability")))).toBe(true);
  });

  it("skips observability addon when observability=false", async () => {
    await plugin.generate("my-app", { language: "node", observability: false, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "observability")))).toBe(false);
  });

  it("skips observability addon when undefined", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "observability")))).toBe(false);
  });

  it("injects OTel + prom-client deps when observability=true", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: { fastify: "^5.0.0" } });
    await plugin.generate("my-app", { language: "node", observability: true, outputDir: "/tmp/my-app" });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({
          "@opentelemetry/sdk-node": expect.any(String),
          "prom-client": expect.any(String),
        }),
      }),
      expect.any(Object),
    );
  });

  it("injects @sentry/node when observability=true and sentry=true", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: { fastify: "^5.0.0" } });
    await plugin.generate("my-app", { language: "node", observability: true, sentry: true, outputDir: "/tmp/my-app" });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({ "@sentry/node": expect.any(String) }),
      }),
      expect.any(Object),
    );
  });

  it("does NOT inject @sentry/node when sentry=false", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    await plugin.generate("my-app", { language: "node", observability: true, sentry: false, outputDir: "/tmp/my-app" });
    const call = mockFsExtra.writeJson.mock.calls[0]?.[1] as { dependencies: Record<string, string> } | undefined;
    expect(call?.dependencies?.["@sentry/node"]).toBeUndefined();
  });

  it("does NOT inject deps when dry-run", async () => {
    await plugin.generate("my-app", { language: "node", observability: true, outputDir: "/tmp/my-app", dryRun: true });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });

  it("does NOT overwrite app.ts when observability is applied", async () => {
    await plugin.generate("my-app", { language: "node", observability: true, outputDir: "/tmp/my-app" });
    const writtenFiles = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    const obsCall = writtenFiles.find((p) => p.includes("observability"));
    // Observability addon dir should not contain app.ts override
    expect(obsCall).toBeDefined();
    // processTemplate is called for the overlay dir — the overlay itself doesn't ship app.ts
    // (verified by the absence of any app.ts write in the call args)
    const writeFileCalls = mockFs.writeFile.mock.calls.map((c) => c[0] as string);
    expect(writeFileCalls.some((p) => p.endsWith("app.ts"))).toBe(false);
  });
});

// ─── Node observability — applyAddon() ──────────────────────────────────────

describe("Node observability — applyAddon()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("injects OTel deps via applyAddon", async () => {
    await plugin.applyAddon("/tmp/my-project", "observability", { dryRun: false });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({
          "@opentelemetry/sdk-node": expect.any(String),
          "prom-client": expect.any(String),
        }),
      }),
      expect.any(Object),
    );
  });

  it("injects @sentry/node via applyAddon when sentry=true", async () => {
    await plugin.applyAddon("/tmp/my-project", "observability", { dryRun: false, sentry: true });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({ "@sentry/node": expect.any(String) }),
      }),
      expect.any(Object),
    );
  });

  it("does NOT write package.json when dry-run", async () => {
    await plugin.applyAddon("/tmp/my-project", "observability", { dryRun: true });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });
});

// ─── Python pre-commit — config ──────────────────────────────────────────────

describe("Python pre-commit — config", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("exposes pre-commit in addon list", () => {
    expect(plugin.addons).toContain("pre-commit");
  });
});

// ─── Python pre-commit — generate() ─────────────────────────────────────────

describe("Python pre-commit — generate()", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readFile.mockResolvedValue('name = "my-api"\n"pyjwt>=2.11.0",\n]\n[project.optional-dependencies]\ndev = [\n    "mypy>=1.8.0",\n]');
    mockFsExtra.writeFile.mockResolvedValue(undefined);
    plugin = new PythonPlugin();
  });

  it("applies pre-commit addon when preCommit=true", async () => {
    await plugin.generate("my-api", { language: "python", preCommit: true, outputDir: "/tmp/my-api" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "pre-commit")))).toBe(true);
  });

  it("skips pre-commit addon when preCommit=false", async () => {
    await plugin.generate("my-api", { language: "python", preCommit: false, outputDir: "/tmp/my-api" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "pre-commit")))).toBe(false);
  });

  it("skips pre-commit addon when undefined", async () => {
    await plugin.generate("my-api", { language: "python", outputDir: "/tmp/my-api" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "pre-commit")))).toBe(false);
  });
});

// ─── Python observability — generate() ──────────────────────────────────────

describe("Python observability — generate()", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readFile.mockResolvedValue('name = "my-api"\n"pyjwt>=2.11.0",\n]\n[project.optional-dependencies]\ndev = [\n    "mypy>=1.8.0",\n]');
    mockFsExtra.writeFile.mockResolvedValue(undefined);
    plugin = new PythonPlugin();
  });

  it("exposes observability in addon list", () => {
    expect(plugin.addons).toContain("observability");
  });

  it("applies observability addon when observability=true", async () => {
    await plugin.generate("my-api", { language: "python", observability: true, outputDir: "/tmp/my-api" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "observability")))).toBe(true);
  });

  it("skips observability addon when observability=false", async () => {
    await plugin.generate("my-api", { language: "python", observability: false, outputDir: "/tmp/my-api" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "observability")))).toBe(false);
  });
});

// ─── Python testing — aiosqlite dep injection ────────────────────────────────

describe("Python testing — aiosqlite dep", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue('name = "my-api"\n');
    mockFsExtra.readFile.mockResolvedValue('name = "my-api"\n"pyjwt>=2.11.0",\n]\n[project.optional-dependencies]\ndev = [\n    "mypy>=1.8.0",\n]');
    mockFsExtra.writeFile.mockResolvedValue(undefined);
    plugin = new PythonPlugin();
  });

  it("injects aiosqlite when testing=true via generate()", async () => {
    await plugin.generate("my-api", { language: "python", testing: true, outputDir: "/tmp/my-api" });
    const writeCalls = mockFsExtra.writeFile.mock.calls;
    const hasAiosqlite = writeCalls.some((c) => (c[1] as string).includes("aiosqlite"));
    expect(hasAiosqlite).toBe(true);
  });

  it("does NOT inject aiosqlite when testing=false", async () => {
    await plugin.generate("my-api", { language: "python", testing: false, outputDir: "/tmp/my-api" });
    const writeCalls = mockFsExtra.writeFile.mock.calls;
    const hasAiosqlite = writeCalls.some((c) => (c[1] as string).includes("aiosqlite"));
    expect(hasAiosqlite).toBe(false);
  });
});
