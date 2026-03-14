import { FileSystem } from "../../core/file-system";
import { logger } from "../../core/logger";
import { TemplateEngine } from "../../core/template-engine";
import { GenerateOptions, Plugin } from "../../types";
import { pythonConfig } from "./config";
import path from "path";

export class PythonPlugin implements Plugin {
  name = pythonConfig.name;
  description = pythonConfig.description;
  addons = pythonConfig.addons;
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
