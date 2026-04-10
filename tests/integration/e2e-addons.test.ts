import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync, spawn, ChildProcess } from "child_process";
import os from "os";
import path from "path";
import fs from "fs-extra";

const E2E_DIR = path.join(os.tmpdir(), "archgen-e2e-addons");
const PROJECT_NAME = "e2e-test-app";
const PROJECT_DIR = path.join(E2E_DIR, PROJECT_NAME);
const CLI = path.resolve(__dirname, "../../dist/index.js");
const ENV_SOURCE = path.resolve(__dirname, "../../.env");
const PORT = 3099;

let serverProcess: ChildProcess | null = null;

function run(cmd: string, cwd: string, timeoutMs = 120_000): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf-8",
    timeout: timeoutMs,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });
}

async function waitForServer(url: string, retries = 20, delayMs = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Server at ${url} did not become ready after ${retries} retries`);
}

function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  await fs.remove(E2E_DIR);
  await fs.ensureDir(E2E_DIR);
}, 10_000);

afterAll(async () => {
  stopServer();
  await fs.remove(E2E_DIR);
});

// ─── Step 1: Generate ────────────────────────────────────────────────────────

describe("Step 1 — generate project with all new addons", () => {
  it("archgen create succeeds", () => {
    run(
      `node "${CLI}" create ${PROJECT_NAME} --language node --database mysql --websocket --oauth --api-docs --skip-git`,
      E2E_DIR,
    );
    expect(fs.existsSync(PROJECT_DIR)).toBe(true);
  });

  it("websocket files are created", () => {
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "plugins", "socket.plugin.ts"))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "modules", "notification", "notification.events.ts"))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "modules", "notification", "notification.service.ts"))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "modules", "notification", "index.ts"))).toBe(true);
  });

  it("oauth files are created", () => {
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "modules", "oauth", "oauth.routes.ts"))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "modules", "oauth", "oauth.service.ts"))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "modules", "oauth", "oauth.schema.ts"))).toBe(true);
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "config", "oauth.ts"))).toBe(true);
  });

  it("api-docs files are created", () => {
    expect(fs.existsSync(path.join(PROJECT_DIR, "src", "plugins", "docs.plugin.ts"))).toBe(true);
  });

  it("package.json contains new addon dependencies", () => {
    const pkg = fs.readJsonSync(path.join(PROJECT_DIR, "package.json")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["socket.io"]).toBeDefined();
    expect(pkg.dependencies["@fastify/oauth2"]).toBeDefined();
    expect(pkg.dependencies["@scalar/fastify-api-reference"]).toBeDefined();
  });

  it(".env.example contains OAuth keys", () => {
    const content = fs.readFileSync(path.join(PROJECT_DIR, ".env.example"), "utf-8");
    expect(content).toContain("GOOGLE_CLIENT_ID");
    expect(content).toContain("GITHUB_CLIENT_ID");
    expect(content).toContain("APP_URL");
  });
});

// ─── Step 2: Copy .env ───────────────────────────────────────────────────────

describe("Step 2 — setup .env", () => {
  it("copies .env from archgen root and sets PORT + APP_URL", async () => {
    let envContent = await fs.readFile(ENV_SOURCE, "utf-8");

    envContent = envContent.replace(/^PORT=.*/m, `PORT=${PORT}`);
    if (!envContent.includes("APP_URL")) {
      envContent += `\nAPP_URL=http://localhost:${PORT}\n`;
    }

    await fs.writeFile(path.join(PROJECT_DIR, ".env"), envContent);
    expect(fs.existsSync(path.join(PROJECT_DIR, ".env"))).toBe(true);
  });
});

// ─── Step 3: npm install + db push ──────────────────────────────────────────

describe("Step 3 — npm install + prisma db push", () => {
  it(
    "installs dependencies and runs prisma generate",
    () => {
      run("npm install", PROJECT_DIR, 300_000);
      expect(fs.existsSync(path.join(PROJECT_DIR, "node_modules"))).toBe(true);
      expect(
        fs.existsSync(path.join(PROJECT_DIR, "node_modules", ".prisma")) ||
        fs.existsSync(path.join(PROJECT_DIR, "node_modules", "@prisma", "client"))
      ).toBe(true);
    },
    300_000,
  );

  it(
    "prisma db push syncs schema to database",
    () => {
      run("npx prisma db push --accept-data-loss", PROJECT_DIR, 60_000);
    },
    60_000,
  );
});

// ─── Step 4: TypeScript build ────────────────────────────────────────────────

describe("Step 4 — TypeScript build", () => {
  it(
    "npm run build produces zero TypeScript errors",
    () => {
      // execSync throws if exit code != 0 — so passing means zero errors
      expect(() => run("npm run build", PROJECT_DIR, 60_000)).not.toThrow();
    },
    60_000,
  );
});

// ─── Step 5: Server + API tests ──────────────────────────────────────────────

describe("Step 5 — server starts and APIs respond", () => {
  it(
    "server starts successfully",
    async () => {
      // App uses `import 'dotenv/config'` — it loads .env from CWD automatically.
      // Just inherit vitest process.env; dotenv will pick up PORT, DATABASE_URL etc. from .env.
      serverProcess = spawn("node", ["dist/index.js"], {
        cwd: PROJECT_DIR,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const serverLogs: string[] = [];
      serverProcess.stdout?.on("data", (d: Buffer) => serverLogs.push(d.toString()));
      serverProcess.stderr?.on("data", (d: Buffer) => serverLogs.push(d.toString()));
      serverProcess.on("exit", (code) => serverLogs.push(`[exit ${code}]`));

      try {
        await waitForServer(`http://localhost:${PORT}/api/v1/health`, 20, 1000);
      } catch (err) {
        throw new Error(`Server did not start. Logs:\n${serverLogs.join("")}`);
      }
    },
    30_000,
  );

  it("GET /api/v1/health returns ok", async () => {
    const res = await fetch(`http://localhost:${PORT}/api/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status?: string };
    expect(body.status).toBe("ok");
  });

  it("POST /api/v1/auth/register creates a user (or already exists)", async () => {
    const email = `e2e_${Date.now()}@test.com`;
    const res = await fetch(`http://localhost:${PORT}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username: `e2euser_${Date.now()}`, password: "Password123!" }),
    });
    expect(res.status).toBe(201);
    // store for login test
    (globalThis as Record<string, unknown>).__e2eEmail = email;
  });

  it("POST /api/v1/auth/login returns accessToken", async () => {
    const email = (globalThis as Record<string, unknown>).__e2eEmail as string ?? "e2e@test.com";
    const res = await fetch(`http://localhost:${PORT}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Password123!" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data?: { accessToken?: string } };
    expect(body.data?.accessToken).toBeTruthy();
  });

  it("GET /api/v1/users returns 401 without token", async () => {
    const res = await fetch(`http://localhost:${PORT}/api/v1/users`);
    expect(res.status).toBe(401);
  });

  it("GET /docs returns Swagger UI", async () => {
    const res = await fetch(`http://localhost:${PORT}/docs`);
    expect(res.status).toBe(200);
  });

  it("GET /reference returns Scalar API reference (follows redirect)", async () => {
    // Scalar redirects /reference → /reference/ (301), then serves 200
    const res = await fetch(`http://localhost:${PORT}/reference`, { redirect: "follow" });
    expect(res.status).toBe(200);
  });

  it("stops server cleanly", () => {
    stopServer();
    expect(serverProcess).toBeNull();
  });
});
