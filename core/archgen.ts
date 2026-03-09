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

      const start = performance.now();

      await plugin.generate(projectName, options);

      const elapsed = ((performance.now() - start) / 1000).toFixed(2);

      logger.success(`🎉 Project created successfully! (${elapsed}s)`);
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

}
