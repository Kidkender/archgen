import path from "path";
import { BasePlugin, AddonEntry } from "../../core/base-plugin";
import { TemplateVariables } from "../../core/template-engine";
import { GenerateOptions, StackInfo } from "../../types";
import { pythonConfig } from "./config";

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
    ];
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
    if (options.claudeCode) {
      console.log("");
      console.log("  Claude Code — open this project in Claude Code to use pre-configured skills");
      console.log("  Skills: /python-patterns /python-testing /backend-patterns and more");
    }
    if (options.cursor) {
      console.log("");
      console.log("  Cursor — .cursor/skills/ ready, open project in Cursor to use agent skills");
    }
    console.log("");
  }
}
