import path from "path";
import fs from "fs-extra";
import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";
import { AddAddonOptions, GenerateOptions, StackInfo } from "../../types";
import { pythonConfig } from "./config";
import { logger } from "../../core/logger";

export class PythonPlugin extends BasePlugin {
  readonly name = pythonConfig.name;
  readonly description = pythonConfig.description;
  readonly addons = pythonConfig.addons;
  readonly stack: StackInfo = {
    runtime: "Python 3.11+",
    framework: "FastAPI",
    orm: "SQLAlchemy 2.0 + Alembic",
    database: "PostgreSQL (default) or SQLite",
    cache: "Redis 7 (redis-py)",
    auth: "PyJWT + passlib[bcrypt]",
    validation: "Pydantic v2",
    testing: "pytest + pytest-asyncio + pytest-cov",
    extras: ["APScheduler", "uvicorn", "Ruff", "Black", "mypy"],
  };

  protected get relativeTemplateDir(): string {
    return "plugins/python/template";
  }

  protected getVariables(projectName: string, options: GenerateOptions): TemplateVariables {
    return {
      PROJECT_NAME: projectName,
      PROJECT_NAME_UNDERSCORE: projectName.replace(/-/g, "_"),
      AUTHOR: options.author || "Your name",
      DESCRIPTION: options.description || "A FastAPI project with production-ready features",
    };
  }

  protected getAddonEntries(options: GenerateOptions, addonsPath: string): AddonEntry[] {
    return [
      {
        condition: options.database === "sqlite",
        path: path.join(addonsPath, "database", "sqlite"),
        label: "SQLite configuration",
      },
      {
        condition: !!options.docker,
        path: path.join(addonsPath, "docker"),
        label: "Docker support",
      },
      {
        condition: !!options.testing,
        path: path.join(addonsPath, "testing"),
        label: "testing setup",
      },
      {
        condition: !!options.ci,
        path: path.join(addonsPath, "ci"),
        label: "GitHub Actions CI",
      },
      {
        condition: !!options.claudeCode,
        path: path.join(addonsPath, "claude-code"),
        label: "Claude Code setup",
      },
      {
        condition: !!options.cursor,
        path: path.join(addonsPath, "cursor"),
        label: "Cursor agent setup",
      },
      {
        condition: !!options.email,
        path: path.join(addonsPath, "email"),
        label: "Email (SMTP)",
      },
      {
        condition: !!options.s3,
        path: path.join(addonsPath, "s3"),
        label: "Storage (AWS S3)",
      },
      {
        condition: !!options.oauth,
        path: path.join(addonsPath, "oauth"),
        label: "OAuth2 (Google + GitHub)",
      },
      {
        condition: !!options.apiDocs,
        path: path.join(addonsPath, "api-docs"),
        label: "API docs (OpenAPI)",
      },
      {
        condition: !!options.websocket,
        path: path.join(addonsPath, "websocket"),
        label: "WebSocket (native FastAPI)",
      },
      {
        condition: !!options.queue,
        path: path.join(addonsPath, "queue"),
        label: "Queue (arq + Redis)",
      },
      {
        condition: !!options.preCommit,
        path: path.join(addonsPath, "pre-commit"),
        label: "pre-commit hooks (ruff + black + mypy)",
      },
      {
        condition: !!options.observability,
        path: path.join(addonsPath, "observability"),
        label: "Observability (OTel + Prometheus + Sentry stub)",
      },
    ];
  }

  async applyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    await super.applyAddon(projectPath, addon, options);
    if (options.dryRun) return;

    const pyprojectPath = path.join(projectPath, "pyproject.toml");
    if (addon === "s3") {
      await this._injectPyprojectDep(pyprojectPath, "boto3>=1.35.0");
      logger.info("Updated pyproject.toml with boto3");
    }
    if (addon === "queue") {
      await this._injectPyprojectDep(pyprojectPath, "arq>=0.26.0");
      logger.info("Updated pyproject.toml with arq");
    }
    if (addon === "testing") {
      await this._injectPyprojectDevDeps(pyprojectPath, ["aiosqlite>=0.20.0"]);
      logger.info("Updated pyproject.toml with aiosqlite");
    }
    if (addon === "pre-commit") {
      await this._injectPyprojectDevDeps(pyprojectPath, ["pre-commit>=3.7.0"]);
      logger.info("Updated pyproject.toml with pre-commit");
    }
    if (addon === "observability") {
      await this._injectPyprojectDeps(pyprojectPath, [
        "opentelemetry-sdk>=1.24.0",
        "opentelemetry-instrumentation-fastapi>=0.45b0",
        "opentelemetry-exporter-otlp-proto-http>=1.24.0",
        "prometheus-fastapi-instrumentator>=7.0.0",
        "structlog>=24.1.0",
      ]);
      logger.info("Updated pyproject.toml with observability deps");
    }
  }

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    await super.generate(projectName, options);
    if (options.dryRun) return;

    const outputPath = options.outputDir ?? path.join(process.cwd(), projectName);
    const pyprojectPath = path.join(outputPath, "pyproject.toml");

    if (options.s3) await this._injectPyprojectDep(pyprojectPath, "boto3>=1.35.0");
    if (options.queue) await this._injectPyprojectDep(pyprojectPath, "arq>=0.26.0");
    if (options.testing) await this._injectPyprojectDevDeps(pyprojectPath, ["aiosqlite>=0.20.0"]);
    if (options.preCommit) await this._injectPyprojectDevDeps(pyprojectPath, ["pre-commit>=3.7.0"]);
    if (options.observability) {
      await this._injectPyprojectDeps(pyprojectPath, [
        "opentelemetry-sdk>=1.24.0",
        "opentelemetry-instrumentation-fastapi>=0.45b0",
        "opentelemetry-exporter-otlp-proto-http>=1.24.0",
        "prometheus-fastapi-instrumentator>=7.0.0",
        "structlog>=24.1.0",
      ]);
      if (options.sentry) {
        await this._injectPyprojectDeps(pyprojectPath, ["sentry-sdk[fastapi]>=2.0.0"]);
      }
    }
  }

  private async _injectPyprojectDep(pyprojectPath: string, dep: string): Promise<void> {
    return this._injectPyprojectDeps(pyprojectPath, [dep]);
  }

  private async _injectPyprojectDeps(pyprojectPath: string, deps: string[]): Promise<void> {
    try {
      let content = await fs.readFile(pyprojectPath, "utf8");
      const toAdd = deps.filter((d) => !content.includes(d.split(">=")[0].split("[")[0]));
      if (toAdd.length === 0) return;
      const lines = toAdd.map((d) => `    "${d}",`).join("\n");
      content = content.replace(
        /^(\s*"pyjwt[^"]*",?\n)(\])/m,
        `$1${lines}\n$2`,
      );
      await fs.writeFile(pyprojectPath, content, "utf8");
    } catch {
      logger.warn(`Could not inject deps into pyproject.toml`);
    }
  }

  private async _injectPyprojectDevDeps(pyprojectPath: string, deps: string[]): Promise<void> {
    try {
      let content = await fs.readFile(pyprojectPath, "utf8");
      const toAdd = deps.filter((d) => !content.includes(d.split(">=")[0].split("[")[0]));
      if (toAdd.length === 0) return;
      const lines = toAdd.map((d) => `    "${d}",`).join("\n");
      // Inject before the closing ] of [project.optional-dependencies] dev array
      content = content.replace(
        /^(\s*"mypy[^"]*",?\n)(\])/m,
        `$1${lines}\n$2`,
      );
      await fs.writeFile(pyprojectPath, content, "utf8");
    } catch {
      logger.warn(`Could not inject dev deps into pyproject.toml`);
    }
  }

  protected async readProjectName(projectPath: string): Promise<string> {
    const raw = await this.fs.readFile(path.join(projectPath, "pyproject.toml"));
    const match = raw.match(/^name\s*=\s*"([^"]+)"/m);
    if (match) return match[1];
    return path.basename(projectPath);
  }

  protected buildApplyAddonVariables(projectName: string): TemplateVariables {
    return {
      PROJECT_NAME: projectName,
      PROJECT_NAME_UNDERSCORE: projectName.replace(/-/g, "_"),
      AUTHOR: "Your name",
      DESCRIPTION: "",
    };
  }

  showNextSteps(projectName: string, options: GenerateOptions): void {
    console.log("");
    console.log("  Next steps:");
    console.log(`  cd ${projectName}`);
    if (options.docker) {
      console.log(`  docker-compose up -d`);
    } else {
      console.log(`  python -m venv venv`);
      console.log(`  source venv/bin/activate  # Windows: venv\\Scripts\\activate`);
      console.log(`  pip install -e .`);
      console.log(`  cp .env.example .env`);
      if (options.database !== "sqlite") {
        console.log(`  alembic upgrade head`);
      }
      console.log(`  uvicorn main:app --reload`);
    }
    if (options.email) {
      console.log("");
      console.log("  Email (SMTP) — set MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM_ADDRESS in .env");
      console.log("  Import email_service from app.services.external.email_service and call send()");
    }
    if (options.s3) {
      console.log("");
      console.log("  Storage (S3) — set S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env");
      console.log("  For Cloudflare R2 / MinIO set S3_ENDPOINT too");
      console.log("  Import storage_service from app.services.external.storage_service");
    }
    if (options.oauth) {
      console.log("");
      console.log("  OAuth — Google + GitHub routes at /api/v1/oauth/*");
      console.log("  Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_URL in .env");
    }
    if (options.apiDocs) {
      console.log("");
      console.log("  API Docs — Swagger UI: http://localhost:8000/docs");
      console.log("             ReDoc:       http://localhost:8000/redoc");
    }
    if (options.websocket) {
      console.log("");
      console.log("  WebSocket — connect to ws://localhost:8000/ws/notifications?token=<JWT>");
      console.log("  Import notification_manager from app.services.notification_service");
      console.log("  Call await notification_manager.send_to_user(user_id, type_, title, message)");
    }
    if (options.queue) {
      console.log("");
      console.log("  Queue (arq) — Redis already in stack, arq uses the same connection");
      console.log("  Enqueue: from app.services.queue_service import enqueue");
      console.log("           await enqueue('example_job', message='hello')");
      console.log("  Run worker: arq app.workers.example_worker.WorkerSettings");
    }
    if (options.claudeCode) {
      console.log("");
      console.log("  Claude Code — open this project in Claude Code to use pre-configured skills");
      console.log("  Skills: /python-patterns /python-testing /backend-patterns and more");
    }
    if (options.cursor) {
      console.log("");
      console.log("  Cursor — .cursor/skills/ ready, open project in Cursor to use agent skills");
    }
    if (options.preCommit) {
      console.log("");
      console.log("  pre-commit — install hooks after setting up your virtualenv:");
      console.log(`  pip install pre-commit`);
      console.log(`  pre-commit install`);
      console.log(`  # Hooks run automatically on each git commit (ruff + black + mypy)`);
    }
    if (options.observability) {
      console.log("");
      console.log("  Observability — add to main.py after creating the FastAPI app:");
      console.log(`  from app.core.observability import instrument_app`);
      console.log(`  instrument_app(app)`);
      console.log(`  Metrics available at: http://localhost:8000/metrics`);
      console.log(`  Grafana dashboard: observability/grafana-dashboard.json`);
      console.log(`  Stack: docker compose -f observability/docker-compose.observability.yml up -d`);
      if (options.sentry) {
        console.log("");
        console.log("  Sentry — add to main.py before creating the app:");
        console.log(`  from app.core.sentry import init_sentry`);
        console.log(`  init_sentry()`);
        console.log(`  Set SENTRY_DSN in .env`);
      }
    }
    console.log("");
  }
}
