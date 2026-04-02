import { Command } from "commander";
import { ArchGen } from "../../core/archgen";
import { ArchGenError } from "../../core/errors";
import { detectProjectLanguage } from "../../core/detector";
import { logger } from "../../core/logger";
import { registry } from "../../core/registry";

export const addCommand = new Command("add")
  .argument("<addon>", "Addon to inject (docker|testing|ci|husky)")
  .option("--dry-run", "Preview files without writing", false)
  .description("Add an addon to an existing project in the current directory")
  .action(async (addon: string, options: { dryRun: boolean }) => {
    const cwd = process.cwd();
    const language = detectProjectLanguage(cwd);

    if (!language) {
      logger.error("Could not detect project type.");
      logger.info(
        "Run this command from a project root containing package.json (Node/Fastify) or pyproject.toml / main.py (Python).",
      );
      process.exit(1);
    }

    const plugin = registry.get(language);
    if (!plugin) {
      logger.error(`No plugin found for detected language: ${language}`);
      process.exit(1);
    }

    if (!plugin.addons?.includes(addon)) {
      logger.error(`Addon "${addon}" is not available for ${language}.`);
      logger.info(`Available addons: ${plugin.addons?.join(", ") ?? "none"}`);
      process.exit(1);
    }

    logger.info(`Detected project type: ${language}`);

    const archgen = new ArchGen();
    try {
      await archgen.addAddon(cwd, language, addon, { dryRun: options.dryRun });
    } catch (error) {
      if (error instanceof ArchGenError) {
        logger.error(error.message);
      } else {
        logger.error(`Unexpected error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });
