import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFs, mockProcessTemplate, mockFsExtra } = vi.hoisted(() => {
  const mockProcessTemplate = vi.fn().mockResolvedValue([]);
  const mockFs = {
    exists: vi.fn().mockReturnValue(true),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(JSON.stringify({ name: "my-project" })),
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

// ─── Parity between create (generate) and add (applyAddon) ──────────────────
// These lock in that both code paths resolve the exact same dependency set
// per addon, so the two lists can be collapsed into one source of truth.

describe("NodePlugin — dependency parity between generate() and applyAddon()", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  const cases: Array<{ addon: string; flag: string; expectedDeps: string[] }> = [
    { addon: "websocket", flag: "websocket", expectedDeps: ["socket.io"] },
    { addon: "oauth", flag: "oauth", expectedDeps: ["@fastify/oauth2", "@fastify/cookie"] },
    { addon: "api-docs", flag: "apiDocs", expectedDeps: ["@scalar/fastify-api-reference"] },
    { addon: "email", flag: "email", expectedDeps: ["nodemailer"] },
    { addon: "s3", flag: "s3", expectedDeps: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"] },
    { addon: "queue", flag: "queue", expectedDeps: ["bullmq"] },
  ];

  for (const { addon, flag, expectedDeps } of cases) {
    it(`resolves identical deps for "${addon}" via create and add`, async () => {
      mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
      await plugin.generate("my-app", { language: "node", [flag]: true, outputDir: "/tmp/my-app" });
      const createDeps = mockFsExtra.writeJson.mock.calls.at(-1)?.[1] as
        | { dependencies: Record<string, string> }
        | undefined;

      vi.clearAllMocks();
      mockProcessTemplate.mockResolvedValue([]);
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
      mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });

      await plugin.applyAddon("/tmp/my-project", addon, { dryRun: false });
      const addDeps = mockFsExtra.writeJson.mock.calls.at(-1)?.[1] as
        | { dependencies: Record<string, string> }
        | undefined;

      for (const dep of expectedDeps) {
        expect(createDeps?.dependencies?.[dep]).toBeDefined();
        expect(addDeps?.dependencies?.[dep]).toBeDefined();
        expect(createDeps?.dependencies?.[dep]).toBe(addDeps?.dependencies?.[dep]);
      }
    });
  }

  it("observability + sentry resolves identical deps via create and add", async () => {
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    await plugin.generate("my-app", {
      language: "node",
      observability: true,
      sentry: true,
      outputDir: "/tmp/my-app",
    });
    const createDeps = mockFsExtra.writeJson.mock.calls.at(-1)?.[1] as
      | { dependencies: Record<string, string> }
      | undefined;

    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });

    await plugin.applyAddon("/tmp/my-project", "observability", { dryRun: false, sentry: true });
    const addDeps = mockFsExtra.writeJson.mock.calls.at(-1)?.[1] as
      | { dependencies: Record<string, string> }
      | undefined;

    expect(createDeps?.dependencies?.["@sentry/node"]).toBeDefined();
    expect(addDeps?.dependencies?.["@sentry/node"]).toBeDefined();
  });
});

// ─── Addon dependency validation: sentry requires observability ─────────────

describe("NodePlugin — sentry requires observability", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(JSON.stringify({ name: "my-project" }));
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  it("generate() throws when sentry=true and observability is not selected", async () => {
    await expect(
      plugin.generate("my-app", { language: "node", sentry: true, outputDir: "/tmp/my-app" }),
    ).rejects.toThrow(/observability/i);
  });

  it("generate() does not write any files when sentry requirement is violated", async () => {
    await expect(
      plugin.generate("my-app", { language: "node", sentry: true, outputDir: "/tmp/my-app" }),
    ).rejects.toThrow();
    expect(mockProcessTemplate).not.toHaveBeenCalled();
  });

  it("generate() succeeds when sentry=true and observability=true", async () => {
    await expect(
      plugin.generate("my-app", {
        language: "node",
        sentry: true,
        observability: true,
        outputDir: "/tmp/my-app",
      }),
    ).resolves.toBeUndefined();
  });

  it("applyAddon() throws when sentry=true and addon is not observability", async () => {
    await expect(
      plugin.applyAddon("/tmp/my-project", "email", { dryRun: false, sentry: true }),
    ).rejects.toThrow(/observability/i);
  });

  it("applyAddon() succeeds when sentry=true and addon is observability", async () => {
    await expect(
      plugin.applyAddon("/tmp/my-project", "observability", { dryRun: false, sentry: true }),
    ).resolves.toBeUndefined();
  });
});
