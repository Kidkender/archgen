import path from "path";
import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";
import { AddAddonOptions, GenerateOptions, StackInfo } from "../../types";
import { nodeConfig } from "./config";
import { logger } from "../../core/logger";
import { assertAddonRequires } from "../../core/addon-requires";
import fs from "fs-extra";

/** Single source of truth for addon → npm dependency mapping, shared by generate() and applyAddon(). */
const ADDON_DEPENDENCIES: Record<string, (sentry: boolean) => Record<string, string>> = {
  websocket: () => ({ "socket.io": "^4.8.1" }),
  oauth: () => ({
    "@fastify/oauth2": "^8.1.0",
    "@fastify/cookie": "^11.0.2",
  }),
  "api-docs": () => ({ "@scalar/fastify-api-reference": "^1.25.0" }),
  email: () => ({ nodemailer: "^6.9.0" }),
  s3: () => ({
    "@aws-sdk/client-s3": "^3.600.0",
    "@aws-sdk/s3-request-presigner": "^3.600.0",
  }),
  queue: () => ({ bullmq: "^5.0.0" }),
  observability: (sentry) => ({
    "@opentelemetry/sdk-node": "^0.51.0",
    "@opentelemetry/auto-instrumentations-node": "^0.46.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.51.0",
    "prom-client": "^15.1.0",
    ...(sentry ? { "@sentry/node": "^8.0.0" } : {}),
  }),
};

function collectAddonDeps(addons: string[], sentry: boolean): Record<string, string> {
  return addons.reduce<Record<string, string>>((deps, addon) => {
    const resolve = ADDON_DEPENDENCIES[addon];
    return resolve ? { ...deps, ...resolve(sentry) } : deps;
  }, {});
}

async function mergePackageDeps(pkgPath: string, extraDeps: Record<string, string>): Promise<void> {
  if (Object.keys(extraDeps).length === 0) return;
  const pkg = (await fs.readJson(pkgPath)) as { dependencies: Record<string, string> };
  pkg.dependencies = { ...pkg.dependencies, ...extraDeps };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

const SENTRY_REQUIRES_OBSERVABILITY_MSG =
  "--sentry requires the observability addon (Sentry ships as part of it)";

/**
 * Single source of truth for addon → app.ts wiring (imports + plugin registration).
 * Patched incrementally against the `// @addon-imports` / `// @addon-plugins` markers
 * in the base template instead of each addon shipping its own full app.ts — two addons
 * both overwriting the same file used to silently drop whichever ran first.
 */
const ADDON_APP_PATCH: Record<string, { imports: string; plugins: string }> = {
  oauth: {
    imports: [
      `import cookie from "@fastify/cookie";`,
      `import oauth2 from "@fastify/oauth2";`,
      `import oauthRoutes from "./modules/oauth/oauth.routes";`,
      `import { oauthEnv } from "./config/oauth";`,
    ].join("\n"),
    plugins: [
      `  // @fastify/cookie is required by @fastify/oauth2 v8 for state cookie management`,
      `  await app.register(cookie);`,
      ``,
      `  await app.register(oauth2, {`,
      `    name: "googleOAuth2",`,
      `    credentials: {`,
      `      client: { id: oauthEnv.GOOGLE_CLIENT_ID, secret: oauthEnv.GOOGLE_CLIENT_SECRET },`,
      `      auth: (oauth2 as any).GOOGLE_CONFIGURATION,`,
      `    },`,
      "    callbackUri: `${oauthEnv.APP_URL}/api/v1/oauth/google/callback`,",
      `    scope: ["profile", "email"],`,
      `  });`,
      ``,
      `  await app.register(oauth2, {`,
      `    name: "githubOAuth2",`,
      `    credentials: {`,
      `      client: { id: oauthEnv.GITHUB_CLIENT_ID, secret: oauthEnv.GITHUB_CLIENT_SECRET },`,
      `      auth: (oauth2 as any).GITHUB_CONFIGURATION,`,
      `    },`,
      "    callbackUri: `${oauthEnv.APP_URL}/api/v1/oauth/github/callback`,",
      `    scope: ["user:email"],`,
      `  });`,
      ``,
      `  await app.register(oauthRoutes, { prefix: "/api/v1/oauth" });`,
    ].join("\n"),
  },
  "api-docs": {
    imports: `import docsPlugin from "./plugins/docs.plugin";`,
    plugins: `  await app.register(docsPlugin);`,
  },
};

export class NodePlugin extends BasePlugin {
  readonly name = nodeConfig.name;
  readonly description = nodeConfig.description;
  readonly addons = nodeConfig.addons;
  readonly stack: StackInfo = {
    runtime: "Node.js 18+ (TypeScript)",
    framework: "Fastify v5",
    orm: "Prisma v7",
    database: "MariaDB / MySQL (mariadb:11) or PostgreSQL",
    cache: "Redis 7 (ioredis)",
    auth: "JWT (jsonwebtoken)",
    validation: "Zod v4",
    testing: "Jest + ts-jest",
    extras: ["dotenv", "pino logger", "node-cron", "Swagger UI"],
  };

  protected get relativeTemplateDir(): string {
    return "plugins/node/template";
  }

  protected getVariables(projectName: string, options: GenerateOptions): TemplateVariables {
    return {
      PROJECT_NAME: projectName,
      AUTHOR: options.author || "Your Name",
      DESCRIPTION: options.description || "A Node.js Typescript project",
    };
  }

  protected getAddonEntries(options: GenerateOptions, addonsPath: string): AddonEntry[] {
    const usePostgres = options.database === "postgresql";
    return [
      {
        condition: usePostgres,
        path: path.join(addonsPath, "database", "postgresql"),
        label: "PostgreSQL configuration",
      },
      {
        condition: !!options.docker,
        path: path.join(addonsPath, usePostgres ? "docker-pg" : "docker"),
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
        condition: !!options.husky,
        path: path.join(addonsPath, "husky"),
        label: "Husky + lint-staged",
      },
      {
        condition: !!options.websocket,
        path: path.join(addonsPath, "websocket"),
        label: "WebSocket (Socket.io)",
      },
      {
        condition: !!options.oauth,
        path: path.join(addonsPath, "oauth"),
        label: "OAuth2 (Google + GitHub)",
      },
      {
        condition: !!options.apiDocs,
        path: path.join(addonsPath, "api-docs"),
        label: "API docs (Scalar)",
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
        label: "Email (Resend)",
      },
      {
        condition: !!options.s3,
        path: path.join(addonsPath, "s3"),
        label: "Storage (AWS S3)",
      },
      {
        condition: !!options.queue,
        path: path.join(addonsPath, "queue"),
        label: "Queue (BullMQ)",
      },
      {
        condition: !!options.observability,
        path: path.join(addonsPath, "observability"),
        label: "Observability (OTel + Prometheus)",
      },
    ];
  }

  protected async beforeGenerate(_projectName: string, options: GenerateOptions): Promise<void> {
    assertAddonRequires(options.sentry, !!options.observability, SENTRY_REQUIRES_OBSERVABILITY_MSG);
  }

  protected async afterGenerate(outputPath: string, options: GenerateOptions): Promise<void> {
    if (options.dryRun) return;

    const pkgPath = path.join(outputPath, "package.json");
    const selectedAddons = [
      options.websocket && "websocket",
      options.oauth && "oauth",
      options.apiDocs && "api-docs",
      options.email && "email",
      options.s3 && "s3",
      options.queue && "queue",
      options.observability && "observability",
    ].filter((addon): addon is string => !!addon);

    const extraDeps = collectAddonDeps(selectedAddons, !!options.sentry);
    await mergePackageDeps(pkgPath, extraDeps);

    const appPath = path.join(outputPath, "src", "app.ts");
    for (const addon of selectedAddons) {
      await this.patchAppFile(appPath, addon);
    }
  }

  /**
   * Incrementally splices an addon's imports/plugin-registration into app.ts against the
   * `// @addon-imports` / `// @addon-plugins` markers, instead of overwriting the whole file.
   * Markers are left in place so repeated `archgen add` calls keep working, and each patch is
   * skipped if already applied (idempotent re-runs).
   */
  private async patchAppFile(appPath: string, addon: string): Promise<void> {
    const patch = ADDON_APP_PATCH[addon];
    if (!patch || !this.fs.exists(appPath)) return;

    const content = await this.fs.readFile(appPath);
    if (content.includes(patch.imports)) return;

    const patched = content
      .replace("// @addon-imports", `${patch.imports}\n// @addon-imports`)
      .replace("  // @addon-plugins", `${patch.plugins}\n  // @addon-plugins`);

    await this.fs.writeFile(appPath, patched);
  }

  protected async beforeApplyAddon(_projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    assertAddonRequires(options.sentry, addon === "observability", SENTRY_REQUIRES_OBSERVABILITY_MSG);
  }

  protected async afterApplyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    if (options.dryRun) return;

    await this.patchAppFile(path.join(projectPath, "src", "app.ts"), addon);

    const pkgPath = path.join(projectPath, "package.json");
    const extraDeps = collectAddonDeps([addon], !!options.sentry);
    if (Object.keys(extraDeps).length === 0) return;

    await mergePackageDeps(pkgPath, extraDeps);
    logger.info(`Updated package.json with deps: ${Object.keys(extraDeps).join(", ")}`);
  }

  protected async readProjectName(projectPath: string): Promise<string> {
    const raw = await this.fs.readFile(path.join(projectPath, "package.json"));
    const pkg = JSON.parse(raw) as { name?: string };
    return pkg.name ?? path.basename(projectPath);
  }

  protected async resolveApplyAddonDir(
    addonsPath: string,
    addon: string,
    projectPath: string,
  ): Promise<string> {
    if (addon === "docker") {
      try {
        const schema = await this.fs.readFile(
          path.join(projectPath, "prisma", "schema.prisma"),
        );
        if (schema.includes('provider = "postgresql"')) {
          return path.join(addonsPath, "docker-pg");
        }
      } catch {
        // default to mysql docker
      }
    }
    return path.join(addonsPath, addon);
  }

  showNextSteps(projectName: string, options: GenerateOptions): void {
    console.log("");
    console.log("  Next steps:");
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  cp .env.example .env`);
    if (options.husky) {
      console.log(`  npx husky init`);
    }
    if (options.docker) {
      console.log(`  docker-compose up -d`);
    } else {
      console.log(`  npm run dev`);
    }
    if (options.websocket) {
      console.log("");
      console.log("  WebSocket — add to src/app.ts:");
      console.log(`  import socketPlugin from './plugins/socket.plugin';`);
      console.log(`  await app.register(socketPlugin);`);
      console.log(`  // Note: uses WebSocket transport only (no HTTP polling)`);
    }
    if (options.oauth) {
      console.log("");
      console.log("  OAuth — Google + GitHub routes registered at /api/v1/oauth/*");
      console.log(`  Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID,`);
      console.log(`  GITHUB_CLIENT_SECRET, APP_URL in your .env file`);
    }
    if (options.apiDocs) {
      console.log("  Scalar API reference available at: http://localhost:3000/reference");
    }
    if (options.claudeCode) {
      console.log("");
      console.log("  Claude Code — open this project in Claude Code to use pre-configured skills");
      console.log("  Skills: /backend-patterns /api-design /tdd-workflow and more");
    }
    if (options.cursor) {
      console.log("");
      console.log("  Cursor — .cursor/skills/ ready, open project in Cursor to use agent skills");
    }
    if (options.email) {
      console.log("");
      console.log("  Email (Resend) — set RESEND_API_KEY + EMAIL_FROM in your .env");
      console.log("  Register emailPlugin in src/app.ts, then inject EmailService into your routes");
    }
    if (options.s3) {
      console.log("");
      console.log("  Storage (S3) — set S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env");
      console.log("  For Cloudflare R2 / MinIO, set S3_ENDPOINT too");
      console.log("  Register storagePlugin in src/app.ts, then inject StorageService into your routes");
    }
    if (options.queue) {
      console.log("");
      console.log("  Queue (BullMQ) — register queuePlugin in src/app.ts");
      console.log("  Use fastify.queues.getQueue('example') to enqueue jobs");
      console.log("  Run workers: node dist/src/workers/example.worker.js");
    }
    if (options.observability) {
      console.log("");
      console.log("  Observability — add to the TOP of src/index.ts:");
      console.log(`  import './telemetry'; // must be first import`);
      console.log(`  Then register metricsPlugin in src/app.ts:`);
      console.log(`  import metricsPlugin from './plugins/metrics.plugin';`);
      console.log(`  await app.register(metricsPlugin);`);
      console.log(`  Metrics available at: http://localhost:3000/metrics`);
      console.log(`  Grafana dashboard: observability/grafana-dashboard.json`);
      console.log(`  Stack: docker compose -f observability/docker-compose.observability.yml up -d`);
      if (options.sentry) {
        console.log("");
        console.log("  Sentry — call initSentry() in src/index.ts before buildApp():");
        console.log(`  import { initSentry } from './config/sentry';`);
        console.log(`  initSentry();`);
        console.log(`  Set SENTRY_DSN in .env`);
      }
    }
    console.log("");
  }
}
