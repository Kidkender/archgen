import path from "path";
import { FileSystem } from "../../core/file-system";
import { logger } from "../../core/logger";
import { TemplateEngine } from "../../core/template-engine";
import { GenerateOptions, Plugin } from "../../types";
import { nodeConfig } from "./config";

export class NodePlugin implements Plugin {
  name = nodeConfig.name;
  description = nodeConfig.description;

  private templateEngine: TemplateEngine;
  private fs: FileSystem;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.fs = new FileSystem();
  }

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    const outputPath = path.join(process.cwd(), projectName);

    const templateBasePath = path.join(__dirname, "template", "base");
    const addonsPath = path.join(__dirname, "template", "addons");

    logger.step("Generate Node.js Typescript project...");

    const variables = {
      PROJECT_NAME: projectName,
      AUTHOR: options.author || "Your Name",
      DESCRIPTION: options.description || "A Node.js Typescript project",
    };

    logger.step("Processing base template...");
    await this.templateEngine.processTemplate(
      templateBasePath,
      outputPath,
      variables,
    );

    if (options.docker) {
      logger.step("Adding Docker support...");
      const dockerAddon = path.join(addonsPath, "docker");
      await this.fs.copyFolder(dockerAddon, outputPath);
    }

    if (options.testing) {
      logger.step("Adding testing setup...");
      const testingAddon = path.join(addonsPath, "testing");
      await this.fs.copyFolder(testingAddon, outputPath);
    }

    logger.success(`Project "${projectName}" generated successfully`);
  }
}
