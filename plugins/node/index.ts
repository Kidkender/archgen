import path from "path";
import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";
import { GenerateOptions, StackInfo } from "../../types";
import { nodeConfig } from "./config";

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
    ];
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
    console.log("");
  }
}
