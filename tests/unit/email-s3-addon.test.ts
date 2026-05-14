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

// ─── generate() addon entries ────────────────────────────────────────────────

describe("email addon — generate()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("includes email in addon list", () => {
    expect(plugin.addons).toContain("email");
  });

  it("applies email addon when email=true", async () => {
    await plugin.generate("my-app", { language: "node", email: true, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(true);
  });

  it("skips email addon when email=false", async () => {
    await plugin.generate("my-app", { language: "node", email: false, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(false);
  });

  it("skips email addon when email is undefined", async () => {
    await plugin.generate("my-app", { language: "node", outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(false);
  });

  it("injects nodemailer into package.json when email=true", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: { fastify: "^5.0.0" } });
    await plugin.generate("my-app", { language: "node", email: true, outputDir: "/tmp/my-app" });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({ nodemailer: expect.any(String) }),
      }),
      expect.any(Object),
    );
  });

  it("does NOT inject nodemailer when email=false", async () => {
    await plugin.generate("my-app", { language: "node", email: false, outputDir: "/tmp/my-app" });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });

  it("does NOT inject nodemailer when dry-run", async () => {
    await plugin.generate("my-app", { language: "node", email: true, outputDir: "/tmp/my-app", dryRun: true });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });
});

describe("s3 addon — generate()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("includes s3 in addon list", () => {
    expect(plugin.addons).toContain("s3");
  });

  it("applies s3 addon when s3=true", async () => {
    await plugin.generate("my-app", { language: "node", s3: true, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "s3")))).toBe(true);
  });

  it("skips s3 addon when s3=false", async () => {
    await plugin.generate("my-app", { language: "node", s3: false, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "s3")))).toBe(false);
  });

  it("injects @aws-sdk/client-s3 into package.json when s3=true", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    await plugin.generate("my-app", { language: "node", s3: true, outputDir: "/tmp/my-app" });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({
          "@aws-sdk/client-s3": expect.any(String),
          "@aws-sdk/s3-request-presigner": expect.any(String),
        }),
      }),
      expect.any(Object),
    );
  });

  it("does NOT inject aws-sdk when s3=false", async () => {
    await plugin.generate("my-app", { language: "node", s3: false, outputDir: "/tmp/my-app" });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });

  it("applies both email and s3 when both=true", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    await plugin.generate("my-app", { language: "node", email: true, s3: true, outputDir: "/tmp/my-app" });
    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.some((p) => p.includes(path.join("addons", "email")))).toBe(true);
    expect(calls.some((p) => p.includes(path.join("addons", "s3")))).toBe(true);
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({
          nodemailer: expect.any(String),
          "@aws-sdk/client-s3": expect.any(String),
        }),
      }),
      expect.any(Object),
    );
  });
});

// ─── applyAddon() dep injection ──────────────────────────────────────────────

describe("email addon — applyAddon()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("injects nodemailer into package.json", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: { fastify: "^5.0.0" } });
    await plugin.applyAddon("/tmp/my-project", "email", { dryRun: false });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({ nodemailer: expect.any(String) }),
      }),
      expect.any(Object),
    );
  });

  it("preserves existing dependencies when injecting nodemailer", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: { fastify: "^5.0.0", zod: "^4.0.0" } });
    await plugin.applyAddon("/tmp/my-project", "email", { dryRun: false });
    const written = mockFsExtra.writeJson.mock.calls[0][1] as { dependencies: Record<string, string> };
    expect(written.dependencies["fastify"]).toBe("^5.0.0");
    expect(written.dependencies["zod"]).toBe("^4.0.0");
    expect(written.dependencies["nodemailer"]).toBeDefined();
  });

  it("does NOT write package.json when dry-run", async () => {
    await plugin.applyAddon("/tmp/my-project", "email", { dryRun: true });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });
});

describe("s3 addon — applyAddon()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("injects @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner", async () => {
    await plugin.applyAddon("/tmp/my-project", "s3", { dryRun: false });
    expect(mockFsExtra.writeJson).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      expect.objectContaining({
        dependencies: expect.objectContaining({
          "@aws-sdk/client-s3": expect.any(String),
          "@aws-sdk/s3-request-presigner": expect.any(String),
        }),
      }),
      expect.any(Object),
    );
  });

  it("does NOT write package.json when dry-run", async () => {
    await plugin.applyAddon("/tmp/my-project", "s3", { dryRun: true });
    expect(mockFsExtra.writeJson).not.toHaveBeenCalled();
  });
});
