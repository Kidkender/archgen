import path from "path";
import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";
import { GenerateOptions, StackInfo } from "../../types";
import { goConfig } from "./config";

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
    ];
  }

  protected async beforeApplyAddon(projectPath: string): Promise<void> {
    try {
      const goModContent = await this.fs.readFile(path.join(projectPath, "go.mod"));
      const match = goModContent.match(/^module\s+(\S+)/m);
      this._cachedModulePath = match ? match[1] : undefined;
    } catch {
      this._cachedModulePath = undefined;
    }
  }

  protected async afterApplyAddon(): Promise<void> {
    this._cachedModulePath = undefined;
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
    console.log("");
  }
}
