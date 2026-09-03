import path from "path";
import { execFileSync } from "child_process";
import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";
import { AddAddonOptions, GenerateOptions, StackInfo } from "../../types";
import { goConfig } from "./config";
import { assertAddonRequires } from "../../core/addon-requires";

const SENTRY_REQUIRES_OBSERVABILITY_MSG =
  "--sentry requires the observability addon (Sentry ships as part of it)";

interface GoAddonPatch {
  /** Spliced into internal/router/router.go's `// @addon-imports` marker (inside the `import (...)` block). */
  routerImports?: string;
  /** Spliced into internal/router/router.go's `// @addon-routes` marker (inside `New()`, before `return r`). */
  routerRoutes?: string;
  /** go.mod `require (...)` entries, e.g. `module/path v1.2.3`. */
  goRequires?: (sentry: boolean) => string[];
  /** Appended to .env.example's `# @addon-env` marker. */
  env?: string;
}

/**
 * Single source of truth for addon -> router.go/go.mod/.env.example wiring, mirroring the
 * Node plugin's ADDON_APP_PATCH/ADDON_ENV_PATCH/ADDON_DEPENDENCIES. Only api-docs and oauth
 * auto-wire into router.go (matching what Node auto-wires into app.ts); the rest ship as
 * standalone packages the generated project's README/next-steps ask the user to mount —
 * same split Node/Python already use for websocket/email/s3/queue/observability.
 */
const GO_ADDON_PATCHES: Record<string, GoAddonPatch> = {
  "api-docs": {
    routerImports: `\t"{{MODULE_PATH}}/internal/docs"`,
    routerRoutes: ['\tr.Get("/docs", docs.UI)', '\tr.Get("/openapi.json", docs.Spec)'].join("\n"),
  },
  oauth: {
    routerImports: `\t"{{MODULE_PATH}}/internal/oauth"`,
    routerRoutes: [
      "\toauthCfg := oauth.LoadConfig()",
      '\tr.Mount("/api/v1/oauth", oauth.Routes(oauthCfg))',
    ].join("\n"),
    goRequires: () => ["golang.org/x/oauth2 v0.24.0"],
    env: [
      "APP_URL=http://localhost:8080",
      "",
      "# Google OAuth — https://console.cloud.google.com/",
      "GOOGLE_CLIENT_ID=your-google-client-id",
      "GOOGLE_CLIENT_SECRET=your-google-client-secret",
      "",
      "# GitHub OAuth — https://github.com/settings/developers",
      "GITHUB_CLIENT_ID=your-github-client-id",
      "GITHUB_CLIENT_SECRET=your-github-client-secret",
    ].join("\n"),
  },
  email: {
    env: [
      "# Email (SMTP)",
      "MAIL_HOST=smtp.gmail.com",
      "MAIL_PORT=587",
      "MAIL_USERNAME=your-email@gmail.com",
      "MAIL_PASSWORD=your-app-password",
      "MAIL_FROM_ADDRESS=your-email@gmail.com",
      "MAIL_FROM_NAME={{PROJECT_NAME}}",
    ].join("\n"),
  },
  s3: {
    goRequires: () => [
      "github.com/aws/aws-sdk-go-v2 v1.32.6",
      "github.com/aws/aws-sdk-go-v2/config v1.28.6",
      "github.com/aws/aws-sdk-go-v2/credentials v1.17.47",
      "github.com/aws/aws-sdk-go-v2/service/s3 v1.66.3",
    ],
    env: [
      "# Storage (AWS S3 / Cloudflare R2 / MinIO)",
      "S3_BUCKET=your-bucket-name",
      "S3_REGION=us-east-1",
      "# S3_ENDPOINT=https://your-r2-endpoint.r2.cloudflarestorage.com  # Leave empty for AWS S3",
      "AWS_ACCESS_KEY_ID=your-access-key-id",
      "AWS_SECRET_ACCESS_KEY=your-secret-access-key",
    ].join("\n"),
  },
  websocket: {
    goRequires: () => ["github.com/gorilla/websocket v1.5.3", "github.com/golang-jwt/jwt/v5 v5.2.1"],
  },
  queue: {
    goRequires: () => ["github.com/hibiken/asynq v0.24.1"],
    env: ["# Queue (Redis)", "REDIS_ADDR=localhost:6379"].join("\n"),
  },
  observability: {
    goRequires: (sentry) => [
      "go.opentelemetry.io/otel v1.32.0",
      "go.opentelemetry.io/otel/sdk v1.32.0",
      "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.32.0",
      "github.com/prometheus/client_golang v1.20.5",
      ...(sentry ? ["github.com/getsentry/sentry-go v0.29.1"] : []),
    ],
    env: ["# Observability", "OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318"].join("\n"),
  },
};

function substituteVars(text: string, variables: TemplateVariables): string {
  return Object.entries(variables).reduce((acc, [key, value]) => acc.split(`{{${key}}}`).join(value ?? ""), text);
}

export class GoPlugin extends BasePlugin {
  readonly name = goConfig.name;
  readonly description = goConfig.description;
  readonly addons = goConfig.addons;
  readonly stack: StackInfo = {
    runtime: "Go 1.22+",
    framework: "chi v5",
    orm: "GORM v2",
    database: "PostgreSQL (pgx)",
    cache: "—",
    auth: "JWT addon (golang-jwt/jwt)",
    validation: "stdlib",
    testing: "Go testing + httptest",
    extras: ["golang-migrate", "godotenv", "slog", "air"],
  };

  private _cachedModulePath?: string;

  protected get relativeTemplateDir(): string {
    return "plugins/go/template";
  }

  protected getVariables(projectName: string, options: GenerateOptions): TemplateVariables {
    return {
      PROJECT_NAME: projectName,
      MODULE_PATH: options.modulePath ?? `github.com/example/${projectName}`,
      AUTHOR: options.author ?? "Your Name",
      DESCRIPTION: options.description ?? "A Go backend project",
    };
  }

  protected getAddonEntries(options: GenerateOptions, addonsPath: string): AddonEntry[] {
    return [
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
        condition: !!options.jwt,
        path: path.join(addonsPath, "jwt"),
        label: "JWT authentication",
      },
      {
        condition: !!options.websocket,
        path: path.join(addonsPath, "websocket"),
        label: "WebSocket (gorilla/websocket)",
      },
      {
        condition: !!options.oauth,
        path: path.join(addonsPath, "oauth"),
        label: "OAuth2 (Google + GitHub)",
      },
      {
        condition: !!options.apiDocs,
        path: path.join(addonsPath, "api-docs"),
        label: "API docs (Swagger UI)",
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
        condition: !!options.queue,
        path: path.join(addonsPath, "queue"),
        label: "Queue (asynq + Redis)",
      },
      {
        condition: !!options.observability,
        path: path.join(addonsPath, "observability"),
        label: "Observability (OTel + Prometheus)",
      },
      {
        // Sentry ships as its own addon dir (not bundled into observability's) because
        // internal/sentryinit hard-imports github.com/getsentry/sentry-go — shipping it
        // unconditionally would force that dependency on every --observability project the
        // moment `go mod tidy` runs, even without --sentry.
        condition: !!options.observability && !!options.sentry,
        path: path.join(addonsPath, "sentry"),
        label: "Sentry error tracking",
      },
    ];
  }

  protected async beforeGenerate(_projectName: string, options: GenerateOptions): Promise<void> {
    assertAddonRequires(options.sentry, !!options.observability, SENTRY_REQUIRES_OBSERVABILITY_MSG);
  }

  protected async afterGenerate(outputPath: string, options: GenerateOptions): Promise<void> {
    if (options.dryRun) return;

    const selectedAddons = [
      options.oauth && "oauth",
      options.apiDocs && "api-docs",
      options.email && "email",
      options.s3 && "s3",
      options.websocket && "websocket",
      options.queue && "queue",
      options.observability && "observability",
    ].filter((addon): addon is string => !!addon);

    const variables = this.getVariables(path.basename(outputPath), options);
    await this.patchAll(outputPath, selectedAddons, variables, !!options.sentry);
  }

  protected async beforeApplyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    assertAddonRequires(options.sentry, addon === "observability", SENTRY_REQUIRES_OBSERVABILITY_MSG);
    try {
      const goModContent = await this.fs.readFile(path.join(projectPath, "go.mod"));
      const match = goModContent.match(/^module\s+(\S+)/m);
      this._cachedModulePath = match ? match[1] : undefined;
    } catch {
      this._cachedModulePath = undefined;
    }
  }

  protected async afterApplyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    if (!options.dryRun) {
      const variables = this.buildApplyAddonVariables(path.basename(projectPath));

      // `archgen add observability --sentry` needs the sentry addon's files too — see the
      // comment on the "sentry" AddonEntry in getAddonEntries for why it's a separate dir.
      if (addon === "observability" && options.sentry) {
        const sentryDir = path.join(__dirname, this.relativeTemplateDir, "addons", "sentry");
        if (this.fs.exists(sentryDir)) {
          await this.templateEngine.processTemplate(sentryDir, projectPath, variables, false);
        }
      }

      await this.patchAll(projectPath, [addon], variables, !!options.sentry);
    }
    this._cachedModulePath = undefined;
  }

  private async patchAll(
    projectPath: string,
    addons: string[],
    variables: TemplateVariables,
    sentry: boolean,
  ): Promise<void> {
    const routerPath = path.join(projectPath, "internal", "router", "router.go");
    const envPath = path.join(projectPath, ".env.example");
    const goModPath = path.join(projectPath, "go.mod");

    for (const addon of addons) {
      const patch = GO_ADDON_PATCHES[addon];
      if (!patch) continue;

      if (patch.routerImports) {
        await this.spliceMarker(routerPath, "// @addon-imports", substituteVars(patch.routerImports, variables));
      }
      if (patch.routerRoutes) {
        await this.spliceMarker(routerPath, "// @addon-routes", substituteVars(patch.routerRoutes, variables));
      }
      if (patch.env) {
        await this.spliceMarker(envPath, "# @addon-env", substituteVars(patch.env, variables));
      }
      if (patch.goRequires) {
        await this.mergeGoRequires(goModPath, patch.goRequires(sentry));
      }
    }

    this.tryGofmt(routerPath);
  }

  /** Best-effort cosmetic cleanup of the marker-spliced router.go — no-op if `gofmt` isn't on PATH. */
  private tryGofmt(filePath: string): void {
    if (!this.fs.exists(filePath)) return;
    try {
      execFileSync("gofmt", ["-w", filePath], { stdio: "ignore" });
    } catch {
      // gofmt not installed — the file still compiles, just with rougher indentation.
    }
  }

  /** Splices `addition` right before `marker` in the target file, skipping if already applied or the file/marker is absent. */
  private async spliceMarker(filePath: string, marker: string, addition: string): Promise<void> {
    if (!addition || !this.fs.exists(filePath)) return;
    const content = await this.fs.readFile(filePath);
    if (content.includes(addition)) return;
    if (!content.includes(marker)) return;
    await this.fs.writeFile(filePath, content.replace(marker, `${addition}\n${marker}`));
  }

  /** Adds missing `require (...)` entries to go.mod, skipping any module path already present. */
  private async mergeGoRequires(goModPath: string, deps: string[]): Promise<void> {
    if (deps.length === 0 || !this.fs.exists(goModPath)) return;
    const content = await this.fs.readFile(goModPath);

    const missing = deps.filter((dep) => !content.includes(dep.trim().split(/\s+/)[0]));
    if (missing.length === 0) return;

    const insertion = missing.map((dep) => `\t${dep}`).join("\n");
    const marker = "\t// @addon-requires";
    const patched = content.includes(marker)
      ? content.replace(marker, `${insertion}\n${marker}`)
      : content.replace(/\)\s*$/, `${insertion}\n)`);
    await this.fs.writeFile(goModPath, patched);
  }

  protected buildApplyAddonVariables(projectName: string): TemplateVariables {
    return {
      PROJECT_NAME: projectName,
      MODULE_PATH: this._cachedModulePath ?? `github.com/example/${projectName}`,
      AUTHOR: "Your Name",
      DESCRIPTION: "",
    };
  }

  protected async readProjectName(projectPath: string): Promise<string> {
    const content = await this.fs.readFile(path.join(projectPath, "go.mod"));
    const match = content.match(/^module\s+(\S+)/m);
    if (match) {
      const parts = match[1].split("/");
      return parts[parts.length - 1];
    }
    return path.basename(projectPath);
  }

  showNextSteps(projectName: string, options: GenerateOptions): void {
    console.log("");
    console.log("  Next steps:");
    console.log(`  cd ${projectName}`);
    console.log(`  cp .env.example .env`);
    console.log(`  go mod tidy`);
    if (options.docker) {
      console.log(`  docker compose up`);
    } else {
      console.log(`  make migrate-up`);
      console.log(`  air               # hot reload — or: go run ./cmd/server`);
    }
    if (options.jwt) {
      console.log("");
      console.log("  Auth routes:");
      console.log("  POST /api/v1/auth/register");
      console.log("  POST /api/v1/auth/login");
      console.log("  GET  /api/v1/users          Bearer token required");
      console.log("  GET  /api/v1/users/me        Bearer token required");
      console.log("  GET  /api/v1/users/{id}      Bearer token required");
    }
    if (options.apiDocs) {
      console.log("  Swagger UI available at: http://localhost:8080/docs");
    }
    if (options.oauth) {
      console.log("");
      console.log("  OAuth — Google + GitHub routes registered at /api/v1/oauth/*");
      console.log("  Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID,");
      console.log("  GITHUB_CLIENT_SECRET, APP_URL in your .env file");
    }
    if (options.email) {
      console.log("");
      console.log("  Email (SMTP) — set MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD in your .env");
      console.log("  Use email.NewService(email.LoadConfig()) in your handlers");
    }
    if (options.s3) {
      console.log("");
      console.log("  Storage (S3) — set S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env");
      console.log("  For Cloudflare R2 / MinIO, set S3_ENDPOINT too");
      console.log("  Use storage.NewService(storage.LoadConfig()) in your handlers");
    }
    if (options.websocket) {
      console.log("");
      console.log("  WebSocket — mount in internal/router/router.go:");
      console.log(`  hub := ws.NewHub()`);
      console.log(`  r.Get("/ws", ws.Handler(hub, cfg.JWTSecret))`);
    }
    if (options.queue) {
      console.log("");
      console.log("  Queue (asynq + Redis) — set REDIS_ADDR in .env");
      console.log("  Enqueue: queue.NewClient().Enqueue(queue.NewExampleTask(...))");
      console.log("  Run worker: go run ./cmd/worker");
    }
    if (options.observability) {
      console.log("");
      console.log("  Observability — in cmd/server/main.go, right after cfg := config.Load():");
      console.log(`  shutdown, _ := telemetry.Init("${projectName}")`);
      console.log(`  defer shutdown(context.Background())`);
      console.log(`  Mount metrics in internal/router/router.go: r.Handle("/metrics", metrics.Handler())`);
      console.log(`  Stack: docker compose -f observability/docker-compose.observability.yml up -d`);
      if (options.sentry) {
        console.log("");
        console.log("  Sentry — call defer sentryinit.Init()() in cmd/server/main.go");
        console.log(`  Set SENTRY_DSN in .env`);
      }
    }
    console.log("");
  }
}
