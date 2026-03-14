import path from "path";
import { FileSystem } from "../../core/file-system";
import { logger } from "../../core/logger";
import { TemplateEngine } from "../../core/template-engine";
import { GenerateOptions, Plugin } from "../../types";
import { nodeConfig } from "./config";

export class NodePlugin implements Plugin {
  name = nodeConfig.name;
  description = nodeConfig.description;
  addons = nodeConfig.addons;

  private templateEngine: TemplateEngine;
  private fs: FileSystem;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.fs = new FileSystem();
  }

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    const outputPath = path.join(process.cwd(), projectName);

    const templateBasePath = path.join(__dirname, "plugins/node/template", "base");
    const addonsPath = path.join(__dirname, "plugins/node/template", "addons");

    logger.step("Generate Node.js Typescript project...");

    const variables = {
      PROJECT_NAME: projectName,
      AUTHOR: options.author || "Your Name",
      DESCRIPTION: options.description || "A Node.js Typescript project",
    };

    const dryRun = options.dryRun ?? false;
    const usePostgres = options.database === "postgresql";

    logger.step(dryRun ? "Previewing base template files..." : "Processing base template...");
    const files = await this.templateEngine.processTemplate(templateBasePath, outputPath, variables, dryRun);

    if (usePostgres) {
      logger.step("Applying PostgreSQL configuration...");
      const pgAddon = path.join(addonsPath, "database", "postgresql");
      const pgFiles = await this.templateEngine.processTemplate(pgAddon, outputPath, variables, dryRun);
      files.push(...pgFiles);
    }

    if (options.docker) {
      logger.step(dryRun ? "Previewing Docker files..." : "Adding Docker support...");
      const dockerAddon = path.join(addonsPath, usePostgres ? "docker-pg" : "docker");
      const dockerFiles = await this.templateEngine.processTemplate(dockerAddon, outputPath, variables, dryRun);
      files.push(...dockerFiles);
    }

    if (options.testing) {
      logger.step(dryRun ? "Previewing testing files..." : "Adding testing setup...");
      const testingAddon = path.join(addonsPath, "testing");
      const testFiles = await this.templateEngine.processTemplate(testingAddon, outputPath, variables, dryRun);
      files.push(...testFiles);
    }

    if (dryRun) {
      console.log("");
      logger.info(`Would create ${files.length} files in ./${projectName}:`);
      files.forEach((f) => console.log(`  ${f}`));
      console.log("");
      return;
    }

    logger.success(`Project "${projectName}" generated successfully`);
    this.showNextSteps(projectName, options);
  }


  private showNextSteps(projectName: string, options: GenerateOptions): void {
    console.log("");
    logger.info("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  cp .env.example .env`);
    if (options.docker) {
      console.log(`  docker-compose up -d`);
    } else {
      console.log(`  npm run dev`);
    }
    console.log("");
  }
}
