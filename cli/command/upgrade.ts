import { Command } from "commander";
import { Upgrader } from "../../core/upgrader";
import { ArchGenError } from "../../core/errors";
import { logger } from "../../core/logger";

export const upgradeCommand = new Command("upgrade")
  .option("--dry-run", "Preview what would be updated without writing files", false)
  .description("Re-apply addons in the current project to the latest template version")
  .addHelpText("after", `
Examples:
  $ archgen upgrade                # upgrade all addons recorded in .archgen-meta.json
  $ archgen upgrade --dry-run      # preview changes without writing
`)
  .action(async (options: { dryRun: boolean }) => {
    const cwd = process.cwd();
    const upgrader = new Upgrader();

    try {
      const result = await upgrader.upgrade(cwd, options.dryRun);

      if (!options.dryRun && result.addons.length > 0) {
        logger.info(`Upgraded addons: ${result.addons.join(", ")}`);
      }
    } catch (error) {
      if (error instanceof ArchGenError) {
        logger.error(error.message);
      } else {
        logger.error(`Unexpected error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });
