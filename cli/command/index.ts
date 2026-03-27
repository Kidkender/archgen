import { Command } from "commander";
import { ArchGen } from "../../core/archgen";
import { logger } from "../../core/logger";
import { promptMissingOptions } from "../prompts";

const VALID_DATABASES = ["mysql", "postgresql"];

export const createCommand = new Command("create")
  .argument("<project-name>", "Name of the project")
  .option("-l, --language <lang>", "Language (node|python)")
  .option("--docker", "Include Docker setup", false)
  .option("--testing", "Include testing setup", false)
  .option("--ci", "Include GitHub Actions CI workflow", false)
  .option("--all", "Include all addons (docker + testing + ci)", false)
  .option("-a, --author <n>", "Author name")
  .option("-d, --description <desc>", "Project description")
  .option("--database <db>", "Database type: mysql | postgresql (Node.js only)")
  .option("--force", "Overwrite existing directory", false)
  .option("--dry-run", "Preview files without creating", false)
  .option("--skip-git", "Skip automatic git init", false)
  .description("Create a new project")
  .action(async (projectName: string, options) => {
    if (options.database && !VALID_DATABASES.includes(options.database)) {
      logger.error(
        `Invalid database: "${options.database}". Must be one of: ${VALID_DATABASES.join(", ")}`
      );
      process.exit(1);
    }

    if (options.all) {
      options.docker = true;
      options.testing = true;
      options.ci = true;
    }

    const finalOptions = await promptMissingOptions(projectName, options);
    const archgen = new ArchGen();
    await archgen.create(projectName, finalOptions);
  });
