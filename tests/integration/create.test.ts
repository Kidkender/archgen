import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs-extra";

const tmpDir = path.join(os.tmpdir(), "archgen-integration");
const CLI = path.resolve(__dirname, "../../dist/index.js");

/** Run CLI command. Pipes newlines to auto-answer any interactive prompts with defaults. */
function run(args: string, cwd?: string): string {
  return execSync(`node "${CLI}" ${args}`, {
    cwd: cwd ?? tmpDir,
    encoding: "utf-8",
    // Pipe newlines to stdin so interactive prompts auto-accept defaults (N)
    input: "\n\n\n\n\n",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("CLI: archgen list", () => {
  it("shows node and python with ci addon", () => {
    const out = run("list", os.tmpdir());
    expect(out).toContain("node");
    expect(out).toContain("python");
    expect(out).toContain("ci");
  });
});

describe("CLI: archgen info", () => {
  it("shows node stack details", () => {
    const out = run("info node", os.tmpdir());
    expect(out).toContain("Fastify");
    expect(out).toContain("Prisma");
  });

  it("shows python stack details", () => {
    const out = run("info python", os.tmpdir());
    expect(out).toContain("FastAPI");
    expect(out).toContain("SQLAlchemy");
  });
});

describe("CLI: archgen create Node --dry-run", () => {
  it("lists files without writing anything", async () => {
    await fs.ensureDir(tmpDir);
    const out = run(
      "create test-node --language node --database mysql --docker --testing --ci --skip-git --dry-run"
    );
    expect(out).toContain("Would create");
    expect(out).toContain("package.json");
    expect(fs.existsSync(path.join(tmpDir, "test-node"))).toBe(false);
  });
});

describe("CLI: archgen create Python --dry-run", () => {
  it("lists files without writing anything", async () => {
    await fs.ensureDir(tmpDir);
    const out = run("create test-python --language python --docker --testing --ci --skip-git --dry-run");
    expect(out).toContain("Would create");
    expect(out).toContain("pyproject.toml");
    expect(fs.existsSync(path.join(tmpDir, "test-python"))).toBe(false);
  });
});

describe("CLI: archgen create Node full generate", () => {
  it("creates expected base files with placeholder replacement", async () => {
    await fs.ensureDir(tmpDir);
    run("create my-app --language node --database mysql --skip-git --docker --testing --ci");
    const projectDir = path.join(tmpDir, "my-app");
    expect(fs.existsSync(path.join(projectDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, "src", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, "prisma", "schema.prisma"))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, "eslint.config.mjs"))).toBe(true);
    const pkg = fs.readJsonSync(path.join(projectDir, "package.json")) as { name: string };
    expect(pkg.name).toBe("my-app");
  });

  it("includes docker files with --docker", async () => {
    await fs.ensureDir(tmpDir);
    run("create my-app --language node --database mysql --docker --testing --ci --skip-git");
    const projectDir = path.join(tmpDir, "my-app");
    expect(fs.existsSync(path.join(projectDir, "docker-compose.yml"))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, "Dockerfile"))).toBe(true);
  });

  it("includes CI workflow with --ci and replaces placeholder", async () => {
    await fs.ensureDir(tmpDir);
    run("create my-app --language node --database mysql --docker --testing --ci --skip-git");
    const projectDir = path.join(tmpDir, "my-app");
    const ciFile = path.join(projectDir, ".github", "workflows", "ci.yml");
    expect(fs.existsSync(ciFile)).toBe(true);
    const content = fs.readFileSync(ciFile, "utf-8");
    expect(content).toContain("my-app");
  });
});

describe("CLI: archgen create Python full generate", () => {
  it("creates expected files with underscore placeholder", async () => {
    await fs.ensureDir(tmpDir);
    run("create my-api --language python --docker --testing --ci --skip-git");
    const projectDir = path.join(tmpDir, "my-api");
    expect(fs.existsSync(path.join(projectDir, "pyproject.toml"))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, "main.py"))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, "app", "__init__.py"))).toBe(true);
    const ciFile = path.join(projectDir, ".github", "workflows", "ci.yml");
    const content = fs.readFileSync(ciFile, "utf-8");
    expect(content).toContain("my_api"); // underscore conversion
  });
});

describe("CLI: archgen add", () => {
  it("adds ci addon to existing node project", async () => {
    await fs.ensureDir(tmpDir);
    // Create without ci (auto-answer N to all prompts via stdin)
    run("create my-app --language node --database mysql --docker --testing --skip-git");
    const projectDir = path.join(tmpDir, "my-app");
    expect(fs.existsSync(path.join(projectDir, ".github"))).toBe(false);
    run("add ci", projectDir);
    expect(fs.existsSync(path.join(projectDir, ".github", "workflows", "ci.yml"))).toBe(true);
  });

  it("--dry-run previews without writing", async () => {
    await fs.ensureDir(tmpDir);
    run("create my-app --language node --database mysql --docker --testing --skip-git");
    const projectDir = path.join(tmpDir, "my-app");
    const out = run("add ci --dry-run", projectDir);
    expect(out).toContain("Would write");
    expect(fs.existsSync(path.join(projectDir, ".github"))).toBe(false);
  });

  it("errors on unknown addon", async () => {
    await fs.ensureDir(tmpDir);
    run("create my-app --language node --database mysql --docker --testing --skip-git");
    const projectDir = path.join(tmpDir, "my-app");
    expect(() => run("add xyz", projectDir)).toThrow();
  });
});
