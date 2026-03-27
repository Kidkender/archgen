import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs-extra";
import http from "http";


function dockerComposeCmd(): string {
  try {
    execSync("docker compose version", { stdio: "ignore" });
    return "docker compose";
  } catch {
    return "docker-compose";
  }
}

function isDockerAvailable(): boolean {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function sh(cmd: string, cwd: string): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function waitForHttp(
  port: number,
  urlPath: string,
  maxWaitMs = 90_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    function attempt() {
      const req = http.get(
        { hostname: "localhost", port, path: urlPath, timeout: 2000 },
        (res) => {
          res.resume(); // consume body so socket closes
          if (res.statusCode === 200) {
            resolve();
          } else {
            scheduleRetry();
          }
        }
      );
      req.on("error", scheduleRetry);
      req.on("timeout", () => {
        req.destroy();
        scheduleRetry();
      });
    }

    function scheduleRetry() {
      if (Date.now() - started >= maxWaitMs) {
        reject(new Error(`Health check timed out after ${maxWaitMs}ms`));
        return;
      }
      setTimeout(attempt, 3000);
    }

    attempt();
  });
}


const DOCKER_AVAILABLE = isDockerAvailable();
const DC = dockerComposeCmd();

const APP_PORT = 13001;
const DB_PORT = 13307;
const REDIS_PORT = 13379;

const tmpDir = path.join(os.tmpdir(), "archgen-docker-test");
const PROJECT_NAME = "docker-test-app";
const CLI = path.resolve(__dirname, "../../dist/index.js");

function runCLI(args: string, cwd?: string): string {
  return execSync(`node "${CLI}" ${args}`, {
    cwd: cwd ?? tmpDir,
    encoding: "utf-8",
    input: "\n\n\n\n\n",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

const describeDocker = DOCKER_AVAILABLE ? describe : describe.skip;

describeDocker("Docker: generated Node.js project", () => {
  const projectDir = path.join(tmpDir, PROJECT_NAME);

  beforeAll(async () => {
    if (!DOCKER_AVAILABLE) return; // describe.skip still runs hooks in Vitest
    await fs.ensureDir(tmpDir);

    // Pass all boolean flags explicitly to avoid interactive prompts
    runCLI(
      `create ${PROJECT_NAME} --language node --database mysql --docker --testing --ci --skip-git`
    );

    // 2. Patch docker-compose.yml to use high ports — avoids conflicts with local services.
    //    Docker Compose merges arrays in override files (ports are additive), so we patch
    //    the source file directly instead of writing an override.
    const composePath = path.join(projectDir, "docker-compose.yml");
    let compose = await fs.readFile(composePath, "utf-8");
    compose = compose
      .replace("'3000:3000'", `'${APP_PORT}:3000'`)
      .replace("'3306:3306'", `'${DB_PORT}:3306'`)
      .replace("'6379:6379'", `'${REDIS_PORT}:6379'`);
    await fs.writeFile(composePath, compose);

    // 3. docker compose up — build + start all services
    sh(`${DC} -p ${PROJECT_NAME} up -d --build`, projectDir);
  }, 180_000);

  afterAll(async () => {
    if (!DOCKER_AVAILABLE) return;
    if (fs.existsSync(projectDir)) {
      try {
        sh(`${DC} -p ${PROJECT_NAME} down -v --remove-orphans`, projectDir);
      } catch {
      }
    }
    await fs.remove(tmpDir);
  }, 30_000);

  it(
    "all services start and app responds with status ok",
    async () => {
      try {
        await waitForHttp(APP_PORT, "/api/v1/health");
      } catch (err) {
        let logs = "";
        try {
          logs = sh(`${DC} -p ${PROJECT_NAME} logs --tail=60`, projectDir);
        } catch {
          logs = "(could not retrieve logs)";
        }
        throw new Error(
          `${(err as Error).message}\n\n--- Container logs ---\n${logs}`
        );
      }

      const res = await fetch(`http://localhost:${APP_PORT}/api/v1/health`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toMatchObject({ status: "ok" });
    },
    120_000
  );

  it("all three services are running", () => {
    const output = sh(`${DC} -p ${PROJECT_NAME} ps`, projectDir);
    expect(output).toContain("app");
    expect(output).toContain("db");
    expect(output).toContain("redis");
  });

  it("docker-compose.yml has JWT_SECRET in app environment", async () => {
    const composeFile = path.join(projectDir, "docker-compose.yml");
    const content = await fs.readFile(composeFile, "utf-8");
    expect(content).toContain("JWT_SECRET");
  });
});
