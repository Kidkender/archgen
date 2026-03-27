import { FileSystem } from "../../core/file-system";
import { logger } from "../../core/logger";
import { TemplateEngine } from "../../core/template-engine";
import { AddAddonOptions, GenerateOptions, Plugin, StackInfo } from "../../types";
import { pythonConfig } from "./config";
import path from "path";

export class PythonPlugin implements Plugin {
  name = pythonConfig.name;
  description = pythonConfig.description;
  addons = pythonConfig.addons;
  stack: StackInfo = {
    runtime: "Python 3.11+",
    framework: "FastAPI",
    orm: "SQLAlchemy 2.0 + Alembic",
    database: "PostgreSQL",
    cache: "Redis 7 (redis-py)",
    auth: "PyJWT + passlib[bcrypt]",
    validation: "Pydantic v2",
    testing: "pytest + pytest-asyncio + pytest-cov",
    extras: ["APScheduler", "uvicorn", "Ruff", "Black", "mypy"],
  };
  private templateEngine: TemplateEngine;
  private fs: FileSystem;

  constructor() {
    this.templateEngine = new TemplateEngine()
    this.fs = new FileSystem()
  }

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    const outputPath = path.join(process.cwd(), projectName)

    const templateBasePath = path.join(__dirname, "plugins/python/template", "base")
    const addonsPath = path.join(__dirname, "plugins/python/template", "addons")

    logger.step("Generating Python FastAPI Project")

    const variables = {
      PROJECT_NAME: projectName,
      PROJECT_NAME_UNDERSCORE: projectName.replace(/-/g, '_'),
      AUTHOR: options.author || "Your name",
      DESCRIPTION: options.description || "A FastAPI project with production-ready features"
    }

    const dryRun = options.dryRun ?? false

    logger.step(dryRun ? "Previewing base template files..." : "Processing base template...")
    const files = await this.templateEngine.processTemplate(templateBasePath, outputPath, variables, dryRun)

    if (options.docker) {
      logger.step(dryRun ? "Previewing Docker files..." : "Adding Docker support...")
      const dockerAddon = path.join(addonsPath, "docker")
      if (this.fs.exists(dockerAddon)) {
        const dockerFiles = await this.templateEngine.processTemplate(dockerAddon, outputPath, variables, dryRun)
        files.push(...dockerFiles)
      }
    }

    if (options.testing) {
      logger.step(dryRun ? "Previewing testing files..." : "Adding testing setup...")
      const testingAddon = path.join(addonsPath, "testing")
      if (this.fs.exists(testingAddon)) {
        const testFiles = await this.templateEngine.processTemplate(testingAddon, outputPath, variables, dryRun)
        files.push(...testFiles)
      }
    }

    if (options.ci) {
      logger.step(dryRun ? "Previewing CI files..." : "Adding GitHub Actions CI...")
      const ciAddon = path.join(addonsPath, "ci")
      if (this.fs.exists(ciAddon)) {
        const ciFiles = await this.templateEngine.processTemplate(ciAddon, outputPath, variables, dryRun)
        files.push(...ciFiles)
      }
    }

    if (dryRun) {
      console.log("")
      logger.info(`Would create ${files.length} files in ./${projectName}:`)
      files.forEach((f) => console.log(`  ${f}`))
      console.log("")
      return
    }

    logger.success(`Project ${projectName} generated successfully`)

    this.showNextSteps(projectName, options)
  }

  async applyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    const dryRun = options.dryRun ?? false
    const addonsPath = path.join(__dirname, "plugins/python/template", "addons")

    let projectName = path.basename(projectPath)
    try {
      const raw = await this.fs.readFile(path.join(projectPath, "pyproject.toml"))
      const match = raw.match(/^name\s*=\s*"([^"]+)"/m)
      if (match) projectName = match[1]
    } catch {
      // fall back to dirname
    }

    const variables = {
      PROJECT_NAME: projectName,
      PROJECT_NAME_UNDERSCORE: projectName.replace(/-/g, "_"),
      AUTHOR: "Your name",
      DESCRIPTION: "",
    }

    const addonDir = path.join(addonsPath, addon)
    if (!this.fs.exists(addonDir)) {
      throw new Error(`Addon "${addon}" not found for Python projects`)
    }

    logger.step(dryRun ? `Previewing ${addon} files...` : `Applying ${addon}...`)
    const files = await this.templateEngine.processTemplate(addonDir, projectPath, variables, dryRun)

    if (dryRun) {
      logger.info(`Would write ${files.length} file(s):`)
      files.forEach((f) => console.log(`  ${f}`))
    } else {
      logger.success(`Addon "${addon}" applied successfully.`)
    }
  }

  private showNextSteps(projectName: string, options: GenerateOptions): void {
    console.log("");
    logger.info("Next steps:");
    console.log(`  cd ${projectName}`);
    if (options.docker) {
      console.log(`  docker-compose up -d`);
    } else {
      console.log(`  python -m venv venv`);
      console.log(`  source venv/bin/activate  # Windows: venv\\Scripts\\activate`);
      console.log(`  pip install -e .`);
      console.log(`  cp .env.example .env`);
      console.log(`  alembic upgrade head`);
      console.log(`  uvicorn main:app --reload`);
    }
    console.log("");
  }
}
