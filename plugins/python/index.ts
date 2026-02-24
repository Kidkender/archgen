import { FileSystem } from "../../core/file-system";
import { logger } from "../../core/logger";
import { TemplateEngine } from "../../core/template-engine";
import { GenerateOptions, Plugin } from "../../types";
import { pythonConfig } from "./config";
import path from "path";

export class PythonPlugin implements Plugin {
  name = pythonConfig.name;
  description = pythonConfig.description;
  private templateEngine: TemplateEngine;
  private fs: FileSystem;

  constructor() {
    this.templateEngine = new TemplateEngine()
    this.fs = new FileSystem()
  }

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    const outputPath = path.join(process.cwd(), projectName)

    const templateBasePath = path.join(__dirname, "template", "base")
    const addonsPath = path.join(__dirname, "template", "addons")

    logger.step("Generating Python FastAPI Project")

    const variables = {
      PROJECT_NAME: projectName,
      PROJECT_NAME_UNDERSCORE: projectName.replace(/-/g, '_'),
      AUTHOR: options.author || "Your name",
      DESCRIPTION: options.description || "A FastAPI project with production-ready features"
    }

    // 1. Process base template
    logger.step("Processing base template...")
    await this.templateEngine.processTemplate(
      templateBasePath,
      outputPath,
      variables
    )

    // 2. Process addons template
    if (options.docker) {
      logger.step("Adding Docker support...")
      const dockerAddon = path.join(addonsPath, "docker")
      if (this.fs.exists(dockerAddon)) {
        await this.fs.copyFolder(dockerAddon, outputPath)
      }
    }

    if (options.testing) {
      logger.step("Enhancing testing support...")
    }

    logger.success(`Project ${projectName} generated successfully`)

    this.showNextSteps(projectName)
  }

  private showNextSteps(projectName: string): void {
    console.log('');
    logger.info('Next steps:');
    console.log(`  cd ${projectName}`);
    console.log(`  python -m venv venv`);
    console.log(`  source venv/bin/activate  # On Windows: venv\\Scripts\\activate`);
    console.log(`  pip install -e .`);
    console.log(`  cp .env.example .env`);
    console.log(`  alembic upgrade head`);
    console.log(`  uvicorn main:app --reload`);
    console.log('');
    logger.info('Or use Docker:');
    console.log(`  cd ${projectName}`);
    console.log(`  docker-compose up -d`);
    console.log('');
  }
}
