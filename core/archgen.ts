import path from "path";
import { execSync } from "child_process";
import { GenerateOptions } from "../types";
import { FileSystem } from "./file-system";
import { logger } from "./logger";
import { registry } from "./registry";
import { getNameError } from "./validation";

export class ArchGen {
  private fs: FileSystem;

  constructor() {
    this.fs = new FileSystem();
  }

  async create(projectName: string, options: GenerateOptions): Promise<void> {
    const targetPath = path.join(process.cwd(), projectName);

    // Prevent path traversal
    if (!path.resolve(targetPath).startsWith(path.resolve(process.cwd()))) {
      logger.error("Invalid project path");
      process.exit(1);
    }

    try {
      if (this.fs.exists(targetPath)) {
        if (options.force) {
          logger.warn(`Removing existing directory: ${projectName}`);
          await this.fs.removeDir(targetPath);
        } else {
          logger.error(`Folder "${projectName}" already exists! Use --force to overwrite.`);
          process.exit(1);
        }
      }

      const nameError = getNameError(projectName);
      if (nameError) {
        logger.error(`Invalid project name: ${nameError}`);
        logger.info("Use only lowercase letters, numbers, dashes and underscores");
        process.exit(1);
      }

      const plugin = registry.get(options.language);
      if (!plugin) {
        logger.error(`Language "${options.language}" is not supported!`);
        logger.info(`Available languages: ${registry.list().join(", ")}`);
        process.exit(1);
      }

      if (options.dryRun) {
        logger.info(`Dry run for: ${projectName} (--language ${options.language})`);
        await plugin.generate(projectName, options);
        return;
      }

      logger.info(`Creating project: ${projectName}`);

      const start = performance.now();

      await plugin.generate(projectName, options);

      try {
        logger.step("Initializing git repository...");
        execSync("git init", { cwd: targetPath, stdio: "ignore" });
      } catch {
        logger.warn("git init skipped (git not found)");
      }

      const elapsed = ((performance.now() - start) / 1000).toFixed(2);

      logger.success(`🎉 Project created successfully! (${elapsed}s)`);
    } catch (error) {
      try {
        if (this.fs.exists(targetPath)) {
          logger.info("Rolling back: removing partially created project...");
          await this.fs.removeDir(targetPath);
        }
      } catch (cleanupError) {
        logger.error(`Cleanup failed: ${(cleanupError as Error).message}`);
      }
      logger.error(`Failed to create project: ${(error as Error).message}`);
      process.exit(1);
    }
  }

}
