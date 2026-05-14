import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockFs, mockApplyAddon, mockPlugin } = vi.hoisted(() => {
  const mockApplyAddon = vi.fn().mockResolvedValue(undefined);
  const mockPlugin = {
    name: "node-typescript",
    description: "Node.js plugin",
    addons: ["docker", "testing", "ci", "email", "s3"],
    generate: vi.fn(),
    applyAddon: mockApplyAddon,
  };
  const mockFs = {
    exists: vi.fn().mockReturnValue(true),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getAllFiles: vi.fn().mockResolvedValue([]),
  };
  return { mockFs, mockApplyAddon, mockPlugin };
});

vi.mock("../../core/file-system", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FileSystem: vi.fn().mockImplementation(function (this: any) { return mockFs; }),
}));

vi.mock("../../core/registry", () => ({
  registry: { get: vi.fn().mockReturnValue(mockPlugin), list: vi.fn().mockReturnValue(["node", "python"]) },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue(JSON.stringify({ version: "1.0.8" })),
}));

import { Upgrader } from "../../core/upgrader";
import { ArchGenError } from "../../core/errors";
import { registry } from "../../core/registry";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMeta(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: "1.0.7",
    language: "node",
    addons: ["docker", "email"],
    database: null,
    generatedAt: "2026-05-14T00:00:00.000Z",
    projectName: "my-api",
    ...overrides,
  });
}

// ─── readMeta ─────────────────────────────────────────────────────────────────

describe("Upgrader.readMeta()", () => {
  let upgrader: Upgrader;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.exists.mockReturnValue(true);
    upgrader = new Upgrader();
  });

  it("throws ArchGenError(NO_PLUGIN) when .archgen-meta.json does not exist", async () => {
    mockFs.exists.mockReturnValue(false);
    await expect(upgrader.readMeta("/tmp/my-project")).rejects.toMatchObject({
      code: "NO_PLUGIN",
    });
  });

  it("throws ArchGenError(GENERATE_FAILED) when meta file contains invalid JSON", async () => {
    mockFs.readFile.mockResolvedValue("not valid json {{{");
    await expect(upgrader.readMeta("/tmp/my-project")).rejects.toMatchObject({
      code: "GENERATE_FAILED",
    });
  });

  it("returns parsed meta when file exists and is valid", async () => {
    mockFs.readFile.mockResolvedValue(makeMeta());
    const meta = await upgrader.readMeta("/tmp/my-project");
    expect(meta.language).toBe("node");
    expect(meta.version).toBe("1.0.7");
    expect(meta.addons).toEqual(["docker", "email"]);
    expect(meta.projectName).toBe("my-api");
  });

  it("reads meta from correct path", async () => {
    mockFs.readFile.mockResolvedValue(makeMeta());
    await upgrader.readMeta("/tmp/my-project");
    expect(mockFs.readFile).toHaveBeenCalledWith(
      path.join("/tmp/my-project", ".archgen-meta.json"),
    );
  });
});

// ─── upgrade() ───────────────────────────────────────────────────────────────

describe("Upgrader.upgrade()", () => {
  let upgrader: Upgrader;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(makeMeta());
    mockApplyAddon.mockResolvedValue(undefined);
    vi.mocked(registry.get).mockReturnValue(mockPlugin);
    upgrader = new Upgrader();
  });

  it("throws ArchGenError(NO_PLUGIN) when plugin not found for language", async () => {
    vi.mocked(registry.get).mockReturnValue(undefined);
    await expect(upgrader.upgrade("/tmp/my-project")).rejects.toMatchObject({
      code: "NO_PLUGIN",
    });
  });

  it("calls applyAddon for each addon recorded in meta", async () => {
    await upgrader.upgrade("/tmp/my-project");
    expect(mockApplyAddon).toHaveBeenCalledTimes(2);
    expect(mockApplyAddon).toHaveBeenCalledWith("/tmp/my-project", "docker", expect.any(Object));
    expect(mockApplyAddon).toHaveBeenCalledWith("/tmp/my-project", "email", expect.any(Object));
  });

  it("skips addons that no longer exist in plugin", async () => {
    mockFs.readFile.mockResolvedValue(makeMeta({ addons: ["docker", "legacy-addon"] }));
    await upgrader.upgrade("/tmp/my-project");
    expect(mockApplyAddon).toHaveBeenCalledTimes(1);
    expect(mockApplyAddon).toHaveBeenCalledWith("/tmp/my-project", "docker", expect.any(Object));
  });

  it("passes dryRun=false to applyAddon by default", async () => {
    await upgrader.upgrade("/tmp/my-project");
    expect(mockApplyAddon).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { dryRun: false },
    );
  });

  it("passes dryRun=true to applyAddon when dry-run", async () => {
    await upgrader.upgrade("/tmp/my-project", true);
    expect(mockApplyAddon).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { dryRun: true },
    );
  });

  it("updates .archgen-meta.json version after upgrade", async () => {
    await upgrader.upgrade("/tmp/my-project");
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      path.join("/tmp/my-project", ".archgen-meta.json"),
      expect.stringContaining('"version": "1.0.8"'),
    );
  });

  it("does NOT write meta when dry-run", async () => {
    await upgrader.upgrade("/tmp/my-project", true);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it("returns correct UpgradeResult", async () => {
    const result = await upgrader.upgrade("/tmp/my-project");
    expect(result).toMatchObject({
      language: "node",
      projectName: "my-api",
      addons: ["docker", "email"],
      fromVersion: "1.0.7",
      toVersion: "1.0.8",
    });
  });

  it("returns empty addons and skips applyAddon when meta has no addons", async () => {
    mockFs.readFile.mockResolvedValue(makeMeta({ addons: [] }));
    const result = await upgrader.upgrade("/tmp/my-project");
    expect(mockApplyAddon).not.toHaveBeenCalled();
    expect(result.addons).toEqual([]);
  });

  it("continues upgrading remaining addons if one addon fails", async () => {
    mockApplyAddon
      .mockRejectedValueOnce(new Error("template error"))
      .mockResolvedValue(undefined);
    await upgrader.upgrade("/tmp/my-project");
    expect(mockApplyAddon).toHaveBeenCalledTimes(2);
    expect(mockFs.writeFile).toHaveBeenCalled();
  });

  it("throws ArchGenError(NO_ADDON_SUPPORT) when plugin has no applyAddon", async () => {
    vi.mocked(registry.get).mockReturnValue({
      name: "node-typescript",
      description: "test",
      addons: [],
      generate: vi.fn(),
    });
    await expect(upgrader.upgrade("/tmp/my-project")).rejects.toMatchObject({
      code: "NO_ADDON_SUPPORT",
    });
  });
});
