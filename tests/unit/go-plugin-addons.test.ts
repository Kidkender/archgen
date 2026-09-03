import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { GoPlugin } from "../../plugins/go";
import { goConfig } from "../../plugins/go/config";

function addonDirsUsed(): string[] {
  return mockProcessTemplate.mock.calls.map((call) => call[0] as string);
}

describe("GoPlugin — addon parity metadata", () => {
  it("lists every addon Node/Python already support (minus husky/pre-commit, which don't apply to Go)", () => {
    for (const addon of ["websocket", "oauth", "api-docs", "email", "s3", "queue", "observability"]) {
      expect(goConfig.addons).toContain(addon);
    }
  });
});

describe("GoPlugin — generate() applies the right addon directories", () => {
  let plugin: GoPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue("");
    plugin = new GoPlugin();
  });

  const cases: Array<{ flag: string; dirName: string }> = [
    { flag: "websocket", dirName: "websocket" },
    { flag: "oauth", dirName: "oauth" },
    { flag: "apiDocs", dirName: "api-docs" },
    { flag: "email", dirName: "email" },
    { flag: "s3", dirName: "s3" },
    { flag: "queue", dirName: "queue" },
    { flag: "observability", dirName: "observability" },
  ];

  for (const { flag, dirName } of cases) {
    it(`processes the "${dirName}" addon directory when --${flag} is set`, async () => {
      await plugin.generate("my-app", {
        language: "go",
        modulePath: "github.com/acme/my-app",
        outputDir: "/tmp/my-app",
        [flag]: true,
      });
      expect(addonDirsUsed().some((dir) => dir.endsWith(`/${dirName}`))).toBe(true);
    });
  }

  it("does not process any addon directories beyond base when no flags are set", async () => {
    await plugin.generate("my-app", {
      language: "go",
      modulePath: "github.com/acme/my-app",
      outputDir: "/tmp/my-app",
    });
    // Only the base template is processed (docker/testing/ci/jwt/... all condition:false).
    expect(mockProcessTemplate).toHaveBeenCalledTimes(1);
  });
});

// ─── Regression: internal/sentryinit hard-imports github.com/getsentry/sentry-go, so it must
// never ship unless --sentry is explicitly set — otherwise `go mod tidy` forces the dependency
// on every --observability project. See the comment on the "sentry" AddonEntry in plugins/go/index.ts.

describe("GoPlugin — sentry ships only alongside --observability --sentry", () => {
  let plugin: GoPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue("");
    plugin = new GoPlugin();
  });

  it("generate() does NOT process the sentry addon dir when --observability is set without --sentry", async () => {
    await plugin.generate("my-app", {
      language: "go",
      modulePath: "github.com/acme/my-app",
      outputDir: "/tmp/my-app",
      observability: true,
    });
    expect(addonDirsUsed().some((dir) => dir.endsWith("/sentry"))).toBe(false);
  });

  it("generate() processes the sentry addon dir when both --observability and --sentry are set", async () => {
    await plugin.generate("my-app", {
      language: "go",
      modulePath: "github.com/acme/my-app",
      outputDir: "/tmp/my-app",
      observability: true,
      sentry: true,
    });
    expect(addonDirsUsed().some((dir) => dir.endsWith("/sentry"))).toBe(true);
  });

  it("generate() throws when --sentry is set without --observability", async () => {
    await expect(
      plugin.generate("my-app", {
        language: "go",
        modulePath: "github.com/acme/my-app",
        outputDir: "/tmp/my-app",
        sentry: true,
      }),
    ).rejects.toThrow(/observability/i);
  });

  it("applyAddon() processes the sentry addon dir when adding observability with sentry:true", async () => {
    await plugin.applyAddon("/tmp/my-app", "observability", { dryRun: false, sentry: true });
    expect(addonDirsUsed().some((dir) => dir.endsWith("/sentry"))).toBe(true);
  });

  it("applyAddon() does not process the sentry addon dir when adding observability without sentry", async () => {
    await plugin.applyAddon("/tmp/my-app", "observability", { dryRun: false });
    expect(addonDirsUsed().some((dir) => dir.endsWith("/sentry"))).toBe(false);
  });

  it("applyAddon() throws when sentry:true and addon is not observability", async () => {
    await expect(
      plugin.applyAddon("/tmp/my-app", "email", { dryRun: false, sentry: true }),
    ).rejects.toThrow(/observability/i);
  });
});

// ─── router.go marker splicing: only api-docs and oauth auto-wire into router.go.

describe("GoPlugin — router.go marker splicing", () => {
  let plugin: GoPlugin;
  const baseRouter = [
    "package router",
    "",
    "import (",
    '\t"github.com/acme/my-app/internal/config"',
    "\t// @addon-imports",
    ")",
    "",
    "func New(cfg *config.Config, db *gorm.DB) *chi.Mux {",
    "\tr := chi.NewRouter()",
    "",
    "\t// @addon-routes",
    "",
    "\treturn r",
    "}",
  ].join("\n");

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    mockFs.readFile.mockResolvedValue(baseRouter);
    plugin = new GoPlugin();
  });

  it("splices api-docs imports/routes into router.go", async () => {
    await plugin.generate("my-app", {
      language: "go",
      modulePath: "github.com/acme/my-app",
      outputDir: "/tmp/my-app",
      apiDocs: true,
    });
    // The mocked readFile is stateless (always returns baseRouter), so each of the two
    // spliceMarker calls (imports, then routes) re-reads the pristine content and writes
    // its own patched copy — check across all router.go writes, not just the last one.
    const writes = mockFs.writeFile.mock.calls
      .filter(([p]: [string]) => p.endsWith("router.go"))
      .map(([, content]: [string, string]) => content);
    expect(writes.some((w: string) => w.includes("internal/docs"))).toBe(true);
    expect(writes.some((w: string) => w.includes("docs.UI"))).toBe(true);
  });

  it("does not touch router.go for addons that don't auto-wire (e.g. email)", async () => {
    await plugin.generate("my-app", {
      language: "go",
      modulePath: "github.com/acme/my-app",
      outputDir: "/tmp/my-app",
      email: true,
    });
    expect(mockFs.writeFile.mock.calls.some(([p]: [string]) => p.endsWith("router.go"))).toBe(false);
  });

  it("is idempotent: re-applying an addon already fully spliced does not write again", async () => {
    // applyAddon() also reads go.mod (to resolve MODULE_PATH) — the default MODULE_PATH
    // fallback is github.com/example/<projectName> when go.mod can't be parsed for it,
    // so the "already spliced" fixture must use that same module path.
    const alreadyPatched = baseRouter
      .replaceAll("github.com/acme/my-app", "github.com/example/my-app")
      .replace("\t// @addon-imports", '\t"github.com/example/my-app/internal/docs"\n\t// @addon-imports')
      .replace(
        "\t// @addon-routes",
        '\tr.Get("/docs", docs.UI)\n\tr.Get("/openapi.json", docs.Spec)\n\t// @addon-routes',
      );
    mockFs.readFile.mockImplementation((p: string) =>
      Promise.resolve(p.endsWith("go.mod") ? "module github.com/example/my-app\n\ngo 1.22\n" : alreadyPatched),
    );
    await plugin.applyAddon("/tmp/my-app", "api-docs", { dryRun: false });
    expect(mockFs.writeFile.mock.calls.some(([p]: [string]) => p.endsWith("router.go"))).toBe(false);
  });
});
