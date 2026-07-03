import { describe, it, expect, vi, beforeEach } from "vitest";

const PYPROJECT_FIXTURE =
  'name = "my-api"\n"pyjwt>=2.11.0",\n]\n[project.optional-dependencies]\ndev = [\n    "mypy>=1.8.0",\n]';

const { mockFs, mockProcessTemplate, mockFsExtra } = vi.hoisted(() => {
  const mockProcessTemplate = vi.fn().mockResolvedValue([]);
  const mockFs = {
    exists: vi.fn().mockReturnValue(true),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('name = "my-api"\n'),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getAllFiles: vi.fn().mockResolvedValue([]),
  };
  const mockFsExtra = {
    readFile: vi.fn(),
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

import { PythonPlugin } from "../../plugins/python";

// ─── Parity between create (generate) and add (applyAddon) ──────────────────

describe("PythonPlugin — dependency parity between generate() and applyAddon()", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue('name = "my-api"\n');
    mockFsExtra.readFile.mockResolvedValue(PYPROJECT_FIXTURE);
    mockFsExtra.writeFile.mockResolvedValue(undefined);
    plugin = new PythonPlugin();
  });

  const cases: Array<{ addon: string; flag: string; expectedDep: string }> = [
    { addon: "s3", flag: "s3", expectedDep: "boto3>=1.35.0" },
    { addon: "queue", flag: "queue", expectedDep: "arq>=0.26.0" },
    { addon: "testing", flag: "testing", expectedDep: "aiosqlite>=0.20.0" },
    { addon: "pre-commit", flag: "preCommit", expectedDep: "pre-commit>=3.7.0" },
  ];

  for (const { addon, flag, expectedDep } of cases) {
    it(`injects "${expectedDep}" for "${addon}" via both create and add`, async () => {
      await plugin.generate("my-api", { language: "python", [flag]: true, outputDir: "/tmp/my-api" });
      const createWroteDep = mockFsExtra.writeFile.mock.calls.some((c) => (c[1] as string).includes(expectedDep));
      expect(createWroteDep).toBe(true);

      vi.clearAllMocks();
      mockProcessTemplate.mockResolvedValue([]);
      mockFs.exists.mockReturnValue(true);
      mockFs.readFile.mockResolvedValue('name = "my-api"\n');
      mockFsExtra.readFile.mockResolvedValue(PYPROJECT_FIXTURE);
      mockFsExtra.writeFile.mockResolvedValue(undefined);

      await plugin.applyAddon("/tmp/my-api", addon, { dryRun: false });
      const addWroteDep = mockFsExtra.writeFile.mock.calls.some((c) => (c[1] as string).includes(expectedDep));
      expect(addWroteDep).toBe(true);
    });
  }

  it("observability + sentry injects sentry-sdk via both create and add", async () => {
    await plugin.generate("my-api", {
      language: "python",
      observability: true,
      sentry: true,
      outputDir: "/tmp/my-api",
    });
    const createWroteSentry = mockFsExtra.writeFile.mock.calls.some((c) =>
      (c[1] as string).includes("sentry-sdk[fastapi]>=2.0.0"),
    );
    expect(createWroteSentry).toBe(true);

    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue('name = "my-api"\n');
    mockFsExtra.readFile.mockResolvedValue(PYPROJECT_FIXTURE);
    mockFsExtra.writeFile.mockResolvedValue(undefined);

    await plugin.applyAddon("/tmp/my-api", "observability", { dryRun: false, sentry: true });
    const addWroteSentry = mockFsExtra.writeFile.mock.calls.some((c) =>
      (c[1] as string).includes("sentry-sdk[fastapi]>=2.0.0"),
    );
    expect(addWroteSentry).toBe(true);
  });

  it("does NOT inject deps when dry-run", async () => {
    await plugin.generate("my-api", { language: "python", s3: true, outputDir: "/tmp/my-api", dryRun: true });
    expect(mockFsExtra.writeFile).not.toHaveBeenCalled();
  });
});

// ─── Addon dependency validation: sentry requires observability ─────────────

describe("PythonPlugin — sentry requires observability", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue('name = "my-api"\n');
    mockFsExtra.readFile.mockResolvedValue(PYPROJECT_FIXTURE);
    mockFsExtra.writeFile.mockResolvedValue(undefined);
    plugin = new PythonPlugin();
  });

  it("generate() throws when sentry=true and observability is not selected", async () => {
    await expect(
      plugin.generate("my-api", { language: "python", sentry: true, outputDir: "/tmp/my-api" }),
    ).rejects.toThrow(/observability/i);
  });

  it("generate() does not write any files when sentry requirement is violated", async () => {
    await expect(
      plugin.generate("my-api", { language: "python", sentry: true, outputDir: "/tmp/my-api" }),
    ).rejects.toThrow();
    expect(mockProcessTemplate).not.toHaveBeenCalled();
  });

  it("generate() succeeds when sentry=true and observability=true", async () => {
    await expect(
      plugin.generate("my-api", {
        language: "python",
        sentry: true,
        observability: true,
        outputDir: "/tmp/my-api",
      }),
    ).resolves.toBeUndefined();
  });

  it("applyAddon() throws when sentry=true and addon is not observability", async () => {
    await expect(
      plugin.applyAddon("/tmp/my-api", "s3", { dryRun: false, sentry: true }),
    ).rejects.toThrow(/observability/i);
  });

  it("applyAddon() succeeds when sentry=true and addon is observability", async () => {
    await expect(
      plugin.applyAddon("/tmp/my-api", "observability", { dryRun: false, sentry: true }),
    ).resolves.toBeUndefined();
  });
});
