import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExecSync, mockFs, mockGenerate, mockPlugin } = vi.hoisted(() => {
  const mockGenerate = vi.fn().mockResolvedValue(undefined);
  const mockPlugin = {
    name: "node-typescript",
    description: "Node.js plugin",
    addons: ["docker", "testing", "ci"],
    generate: mockGenerate,
  };
  const mockFs = {
    exists: vi.fn().mockReturnValue(false),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(""),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getAllFiles: vi.fn().mockResolvedValue([]),
  };
  return { mockExecSync: vi.fn(), mockFs, mockGenerate, mockPlugin };
});

vi.mock("child_process", () => ({ execSync: mockExecSync }));

vi.mock("../../core/file-system", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FileSystem: vi.fn().mockImplementation(function (this: any) { return mockFs; }),
}));

vi.mock("../../core/registry", () => ({
  registry: {
    get: vi.fn().mockReturnValue(mockPlugin),
    list: vi.fn().mockReturnValue(["node", "python"]),
  },
}));

import { ArchGen } from "../../core/archgen";
import { ArchGenError } from "../../core/errors";
import { registry } from "../../core/registry";

describe("ArchGen.create", () => {
  let archgen: ArchGen;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.exists.mockReturnValue(false);
    mockGenerate.mockResolvedValue(undefined);
    vi.mocked(registry.get).mockReturnValue(mockPlugin);
    archgen = new ArchGen();
  });

  it("rejects path traversal attempts", async () => {
    await expect(archgen.create("../evil", { language: "node" })).rejects.toThrow(ArchGenError);
    await expect(archgen.create("../evil", { language: "node" })).rejects.toMatchObject({ code: "INVALID_PATH" });
  });

  it("rejects invalid project name", async () => {
    await expect(archgen.create("MyApp", { language: "node" })).rejects.toThrow(ArchGenError);
    await expect(archgen.create("MyApp", { language: "node" })).rejects.toMatchObject({ code: "NAME_ERROR" });
  });

  it("rejects existing directory without --force", async () => {
    mockFs.exists.mockReturnValue(true);
    await expect(archgen.create("my-app", { language: "node" })).rejects.toThrow(ArchGenError);
    await expect(archgen.create("my-app", { language: "node" })).rejects.toMatchObject({ code: "DIR_EXISTS" });
  });

  it("removes existing directory when --force is set", async () => {
    mockFs.exists.mockReturnValueOnce(true).mockReturnValue(false);
    await archgen.create("my-app", { language: "node", force: true });
    expect(mockFs.removeDir).toHaveBeenCalledOnce();
  });

  it("rejects unsupported language", async () => {
    vi.mocked(registry.get).mockReturnValue(undefined);
    await expect(archgen.create("my-app", { language: "ruby" })).rejects.toThrow(ArchGenError);
    await expect(archgen.create("my-app", { language: "ruby" })).rejects.toMatchObject({ code: "UNSUPPORTED_LANGUAGE" });
  });

  it("calls plugin.generate on successful create", async () => {
    await archgen.create("my-app", { language: "node" });
    expect(mockGenerate).toHaveBeenCalledWith("my-app", expect.objectContaining({ language: "node" }));
  });

  it("calls git init after successful create", async () => {
    await archgen.create("my-app", { language: "node" });
    expect(mockExecSync).toHaveBeenCalledWith("git init", expect.any(Object));
  });

  it("skips git init when --skip-git is set", async () => {
    await archgen.create("my-app", { language: "node", skipGit: true });
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it("skips git init and writing when --dry-run is set", async () => {
    await archgen.create("my-app", { language: "node", dryRun: true });
    expect(mockExecSync).not.toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalledWith("my-app", expect.objectContaining({ dryRun: true }));
  });

  it("rolls back partial project on plugin error", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("template error"));
    mockFs.exists.mockReturnValueOnce(false).mockReturnValue(true);
    await expect(archgen.create("my-app", { language: "node" })).rejects.toMatchObject({ code: "GENERATE_FAILED" });
    expect(mockFs.removeDir).toHaveBeenCalled();
  });

  it("sets outputDir in resolved options passed to plugin", async () => {
    await archgen.create("my-app", { language: "node" });
    expect(mockGenerate).toHaveBeenCalledWith(
      "my-app",
      expect.objectContaining({ outputDir: expect.stringContaining("my-app") }),
    );
  });

  it("rejects --output dir that does not exist", async () => {
    mockFs.exists.mockReturnValue(false);
    await expect(
      archgen.create("my-app", { language: "node", output: "/nonexistent/path" }),
    ).rejects.toMatchObject({ code: "OUTPUT_DIR_NOT_FOUND" });
  });
});
