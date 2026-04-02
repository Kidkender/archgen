import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * E2E snapshot tests — verifies file tree stability across releases.
 * Uses ArchGen with mocked FileSystem and TemplateEngine so no actual files are written.
 * In dry-run mode, plugin.generate() collects and logs file paths without writing.
 * We capture the processTemplate call arguments to assert on file tree shape.
 */

const { mockFs, mockProcessTemplate } = vi.hoisted(() => {
  const mockProcessTemplate = vi.fn().mockResolvedValue([]);
  const mockFs = {
    exists: vi.fn().mockReturnValue(false),
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

vi.mock("child_process", () => ({ execSync: vi.fn() }));

import { ArchGen } from "../../core/archgen";

describe("ArchGen snapshot — Node.js", () => {
  let archgen: ArchGen;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(false);
    archgen = new ArchGen();
  });

  it("base project calls processTemplate with expected paths", async () => {
    await archgen.create("my-app", { language: "node", outputDir: "/tmp/my-app", dryRun: true });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths).toMatchSnapshot();
  });

  it("with --docker applies docker addon", async () => {
    await archgen.create("my-app", {
      language: "node",
      outputDir: "/tmp/my-app",
      dryRun: true,
      docker: true,
    });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths.some((p) => p.includes("docker"))).toBe(true);
    expect(templatePaths).toMatchSnapshot();
  });

  it("with --testing applies testing addon", async () => {
    await archgen.create("my-app", {
      language: "node",
      outputDir: "/tmp/my-app",
      dryRun: true,
      testing: true,
    });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths.some((p) => p.includes("testing"))).toBe(true);
  });

  it("with --all applies docker, testing and ci addons", async () => {
    await archgen.create("my-app", {
      language: "node",
      outputDir: "/tmp/my-app",
      dryRun: true,
      docker: true,
      testing: true,
      ci: true,
    });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths.some((p) => p.includes("docker"))).toBe(true);
    expect(templatePaths.some((p) => p.includes("testing"))).toBe(true);
    expect(templatePaths.some((p) => p.includes("ci"))).toBe(true);
    expect(templatePaths).toMatchSnapshot();
  });
});

describe("ArchGen snapshot — Python", () => {
  let archgen: ArchGen;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(false);
    archgen = new ArchGen();
  });

  it("base project calls processTemplate with expected paths", async () => {
    await archgen.create("my-api", { language: "python", outputDir: "/tmp/my-api", dryRun: true });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths).toMatchSnapshot();
  });

  it("with --database sqlite applies sqlite addon", async () => {
    await archgen.create("my-api", {
      language: "python",
      outputDir: "/tmp/my-api",
      dryRun: true,
      database: "sqlite",
    });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths.some((p) => p.includes("sqlite"))).toBe(true);
    expect(templatePaths).toMatchSnapshot();
  });

  it("with --docker applies docker addon", async () => {
    await archgen.create("my-api", {
      language: "python",
      outputDir: "/tmp/my-api",
      dryRun: true,
      docker: true,
    });
    const templatePaths = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(templatePaths.some((p) => p.includes("docker"))).toBe(true);
  });
});
