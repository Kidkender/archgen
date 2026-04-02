import path from "path";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { AddAddonOptions, GenerateOptions } from "../types";
import { FileSystem } from "./file-system";
import { logger } from "./logger";
import { registry } from "./registry";
import { getNameError } from "./validation";
import { ArchGenError } from "./errors";

export class ArchGen {
  private fs: FileSystem;

  constructor() {
    this.fs = new FileSystem();
  }

  async create(projectName: string, options: GenerateOptions): Promise<void> {
    const basePath = options.output ? path.resolve(options.output) : process.cwd();

    if (options.output && !this.fs.exists(basePath)) {
      throw new ArchGenError(
        "OUTPUT_DIR_NOT_FOUND",
        `Output directory not found: ${basePath}`,
      );
    }

    const targetPath = path.join(basePath, projectName);

    if (!path.resolve(targetPath).startsWith(path.resolve(basePath))) {
      throw new ArchGenError("INVALID_PATH", "Invalid project path");
    }

    if (this.fs.exists(targetPath)) {
      if (options.force) {
        logger.warn(`Removing existing directory: ${projectName}`);
        await this.fs.removeDir(targetPath);
      } else {
        throw new ArchGenError(
          "DIR_EXISTS",
          `Folder "${projectName}" already exists! Use --force to overwrite.`,
        );
      }
    }

    const nameError = getNameError(projectName);
    if (nameError) {
      throw new ArchGenError("NAME_ERROR", `Invalid project name: ${nameError}`);
    }

    const plugin = registry.get(options.language);
    if (!plugin) {
      throw new ArchGenError(
        "UNSUPPORTED_LANGUAGE",
        `Language "${options.language}" is not supported! Available: ${registry.list().join(", ")}`,
      );
    }

    const resolvedOptions: GenerateOptions = { ...options, outputDir: targetPath };

    if (options.dryRun) {
      logger.info(`Dry run for: ${projectName} (--language ${options.language})`);
      await plugin.generate(projectName, resolvedOptions);
      return;
    }

    logger.info(`Creating project: ${projectName}`);
    const start = performance.now();

    try {
      await plugin.generate(projectName, resolvedOptions);
    } catch (error) {
      try {
        if (this.fs.exists(targetPath)) {
          logger.info("Rolling back: removing partially created project...");
          await this.fs.removeDir(targetPath);
        }
      } catch (cleanupError) {
        logger.error(`Cleanup failed: ${(cleanupError as Error).message}`);
      }
      throw new ArchGenError(
        "GENERATE_FAILED",
        `Failed to create project: ${(error as Error).message}`,
      );
    }

    await this.writeMetaFile(targetPath, projectName, options);

    if (!options.skipGit) {
      try {
        logger.step("Initializing git repository...");
        execSync("git init", { cwd: targetPath, stdio: "ignore" });
      } catch {
        logger.warn("git init skipped (git not found)");
      }
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    logger.success(`Project created successfully! (${elapsed}s)`);
  }

  async addAddon(projectPath: string, language: string, addon: string, options: AddAddonOptions): Promise<void> {
    const plugin = registry.get(language);
    if (!plugin) {
      throw new ArchGenError("NO_PLUGIN", `No plugin found for language: ${language}`);
    }

    if (!plugin.applyAddon) {
      throw new ArchGenError(
        "NO_ADDON_SUPPORT",
        `Plugin "${language}" does not support adding addons.`,
      );
    }

    try {
      await plugin.applyAddon(projectPath, addon, options);
    } catch (error) {
      throw new ArchGenError(
        "ADDON_FAILED",
        `Failed to apply addon: ${(error as Error).message}`,
      );
    }
  }

  private async writeMetaFile(targetPath: string, projectName: string, options: GenerateOptions): Promise<void> {
    try {
      const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8")) as { version: string };
      const enabledAddons: string[] = [];
      if (options.docker) enabledAddons.push("docker");
      if (options.testing) enabledAddons.push("testing");
      if (options.ci) enabledAddons.push("ci");
      if (options.husky) enabledAddons.push("husky");

      const meta = {
        version: pkg.version,
        language: options.language,
        addons: enabledAddons,
        database: options.database ?? null,
        generatedAt: new Date().toISOString(),
        projectName,
      };

      await this.fs.writeFile(
        path.join(targetPath, ".archgen-meta.json"),
        JSON.stringify(meta, null, 2),
      );
    } catch {
      // meta file is best-effort; never fail the whole create for this
    }
  }
}
