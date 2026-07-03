import { describe, it, expect, vi, beforeEach } from "vitest";

const BASE_ENV_EXAMPLE = `# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{{PROJECT_NAME}}

# Rate Limit
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000
# @addon-env
`;

const { mockFs, mockProcessTemplate, mockFsExtra } = vi.hoisted(() => {
  const mockProcessTemplate = vi.fn().mockResolvedValue([]);
  const files = new Map<string, string>();
  const mockFs = {
    exists: vi.fn().mockReturnValue(true),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn(async (filePath: string, content: string) => {
      files.set(filePath, content);
    }),
    readFile: vi.fn(async (filePath: string) => {
      if (filePath.endsWith("package.json")) return JSON.stringify({ name: "my-project" });
      return files.get(filePath) ?? "";
    }),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getAllFiles: vi.fn().mockResolvedValue([]),
    __files: files,
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

describe("NodePlugin — .env.example patching (oauth/email/s3 no longer clobber each other)", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.__files.clear();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  function envPath(dir: string): string {
    return `${dir}/.env.example`;
  }

  it("appends oauth, email and s3 blocks together at create time without dropping any", async () => {
    const outputDir = "/tmp/my-app";
    mockFs.__files.set(envPath(outputDir), BASE_ENV_EXAMPLE);

    await plugin.generate("my-app", {
      language: "node",
      database: "postgresql",
      oauth: true,
      email: true,
      s3: true,
      outputDir,
    });

    const finalEnv = mockFs.__files.get(envPath(outputDir)) ?? "";
    expect(finalEnv).toContain("GOOGLE_CLIENT_ID");
    expect(finalEnv).toContain("MAIL_HOST");
    expect(finalEnv).toContain("S3_BUCKET");
    expect(finalEnv.endsWith("# @addon-env\n") || finalEnv.trimEnd().endsWith("# @addon-env")).toBe(true);
  });

  it("substitutes {{PROJECT_NAME}} in the email block after splicing", async () => {
    const outputDir = "/tmp/my-app";
    mockFs.__files.set(envPath(outputDir), BASE_ENV_EXAMPLE);

    await plugin.generate("my-app", { language: "node", email: true, outputDir });

    const finalEnv = mockFs.__files.get(envPath(outputDir)) ?? "";
    expect(finalEnv).toContain("MAIL_FROM_NAME=my-app");
  });

  it("preserves oauth vars when email is added afterwards via applyAddon", async () => {
    const projectPath = "/tmp/my-project";
    mockFs.__files.set(envPath(projectPath), BASE_ENV_EXAMPLE);

    await plugin.applyAddon(projectPath, "oauth", { dryRun: false });
    await plugin.applyAddon(projectPath, "email", { dryRun: false });

    const finalEnv = mockFs.__files.get(envPath(projectPath)) ?? "";
    expect(finalEnv).toContain("GOOGLE_CLIENT_ID");
    expect(finalEnv).toContain("MAIL_HOST");
  });

  it("does not duplicate the patch when the same addon is applied twice", async () => {
    const projectPath = "/tmp/my-project";
    mockFs.__files.set(envPath(projectPath), BASE_ENV_EXAMPLE);

    await plugin.applyAddon(projectPath, "oauth", { dryRun: false });
    await plugin.applyAddon(projectPath, "oauth", { dryRun: false });

    const finalEnv = mockFs.__files.get(envPath(projectPath)) ?? "";
    const occurrences = finalEnv.split("GOOGLE_CLIENT_ID=your-google-client-id").length - 1;
    expect(occurrences).toBe(1);
  });
});
