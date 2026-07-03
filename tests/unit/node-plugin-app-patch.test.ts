import { describe, it, expect, vi, beforeEach } from "vitest";

const BASE_APP_TS = `
import { env } from "./config/env";
import prismaPlugin from "./plugins/prisma.plugin";
import responsePlugin from "./plugins/response.plugin";
// @addon-imports

export async function buildApp() {
  await app.register(responsePlugin)
  await app.register(prismaPlugin)
  // @addon-plugins
  await app.register(routes, { prefix: "/api/v1" })
  return app;
}
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

describe("NodePlugin — app.ts patching (oauth + api-docs no longer clobber each other)", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.__files.clear();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFsExtra.readJson.mockResolvedValue({ dependencies: {} });
    plugin = new NodePlugin();
  });

  function appTsPath(outputDir: string): string {
    return `${outputDir}/src/app.ts`;
  }

  it("wires both oauth and api-docs into app.ts when both are selected at create time", async () => {
    const outputDir = "/tmp/my-app";
    mockFs.__files.set(appTsPath(outputDir), BASE_APP_TS);

    await plugin.generate("my-app", { language: "node", oauth: true, apiDocs: true, outputDir });

    const finalAppTs = mockFs.__files.get(appTsPath(outputDir)) ?? "";
    expect(finalAppTs).toContain("oauthRoutes");
    expect(finalAppTs).toContain("docsPlugin");
    expect(finalAppTs).toContain('await app.register(oauthRoutes, { prefix: "/api/v1/oauth" });');
    expect(finalAppTs).toContain("await app.register(docsPlugin);");
  });

  it("preserves oauth wiring when api-docs is added afterwards via applyAddon", async () => {
    const projectPath = "/tmp/my-project";
    mockFs.__files.set(appTsPath(projectPath), BASE_APP_TS);

    await plugin.applyAddon(projectPath, "oauth", { dryRun: false });
    await plugin.applyAddon(projectPath, "api-docs", { dryRun: false });

    const finalAppTs = mockFs.__files.get(appTsPath(projectPath)) ?? "";
    expect(finalAppTs).toContain("oauthRoutes");
    expect(finalAppTs).toContain("docsPlugin");
  });

  it("does not duplicate the patch when the same addon is applied twice", async () => {
    const projectPath = "/tmp/my-project";
    mockFs.__files.set(appTsPath(projectPath), BASE_APP_TS);

    await plugin.applyAddon(projectPath, "oauth", { dryRun: false });
    await plugin.applyAddon(projectPath, "oauth", { dryRun: false });

    const finalAppTs = mockFs.__files.get(appTsPath(projectPath)) ?? "";
    const occurrences = finalAppTs.split("import oauthRoutes").length - 1;
    expect(occurrences).toBe(1);
  });

  it("leaves app.ts untouched for addons with no app.ts wiring (e.g. websocket)", async () => {
    const outputDir = "/tmp/my-app";
    mockFs.__files.set(appTsPath(outputDir), BASE_APP_TS);

    await plugin.generate("my-app", { language: "node", websocket: true, outputDir });

    const finalAppTs = mockFs.__files.get(appTsPath(outputDir)) ?? "";
    expect(finalAppTs).toBe(BASE_APP_TS);
  });
});
