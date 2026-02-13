import { GenerateOptions } from "../types";
import { FileSystem } from "./file-system";
import { logger } from "./logger";
import { registry } from "./registry";

export class ArchGen {
  private fs: FileSystem;

  constructor() {
    this.fs = new FileSystem();
  }

  async create(projectName: string, options: GenerateOptions): Promise<void> {
    try {
      this.validateProjectName(projectName);

      const targetPath = `${process.cwd()}/${projectName}`;
      if (this.fs.exists(targetPath)) {
        logger.error(`Folder "${projectName}" already exists!`);
        process.exit(1);
      }
      const plugin = registry.get(options.language);
      if (!plugin) {
        logger.error(`Language "${options.language}" is not supported!`);
        logger.info(`Available languages: ${Object.keys(registry).join(", ")}`);
        process.exit(1);
      }

      logger.info(`Creating project: ${projectName}`);
      await plugin.generate(projectName, options);

      this.showNextSteps(projectName);
    } catch (error) {
      logger.error(`Failed to create project: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  private validateProjectName(name: string): void {
    const validNameRegex = /^[a-z0-9-_]+$/;
    if (!validNameRegex.test(name)) {
      logger.error("Invalid project name!");
      logger.info(
        "Use only lowercase letters, numbers, dashes and underscores",
      );
      process.exit(1);
    }
  }

  private showNextSteps(projectName: string): void {
    console.log("");
    logger.success("🎉 Project created successfully!");
    console.log("");
    logger.info("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  npm run dev`);
    console.log("");
  }
}
