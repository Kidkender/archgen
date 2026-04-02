import { Command } from "commander";
import { ArchGen } from "../../core/archgen";
import { ArchGenError } from "../../core/errors";
import { logger } from "../../core/logger";
import { promptMissingOptions } from "../prompts";

const VALID_NODE_DATABASES = ["mysql", "postgresql"];
const VALID_PYTHON_DATABASES = ["postgresql", "sqlite"];

export const createCommand = new Command("create")
  .argument("<project-name>", "Name of the project")
  .option("-l, --language <lang>", "Language (node|python)")
  .option("--docker", "Include Docker setup", false)
  .option("--testing", "Include testing setup", false)
  .option("--ci", "Include GitHub Actions CI workflow", false)
  .option("--husky", "Include Husky + lint-staged setup (Node.js only)")
  .option("--all", "Include all addons (docker + testing + ci)", false)
  .option("-a, --author <n>", "Author name")
  .option("-d, --description <desc>", "Project description")
  .option("--database <db>", "Database type (node: mysql|postgresql, python: postgresql|sqlite)")
  .option("--force", "Overwrite existing directory", false)
  .option("--dry-run", "Preview files without creating", false)
  .option("--skip-git", "Skip automatic git init", false)
  .option("-o, --output <dir>", "Output directory (default: current directory)")
  .description("Create a new project")
  .action(async (projectName: string, options) => {
    if (options.all) {
      options.docker = true;
      options.testing = true;
      options.ci = true;
    }

    // Database validation is deferred until after prompts resolve the language
    const finalOptions = await promptMissingOptions(projectName, options);

    if (finalOptions.database) {
      const lang = finalOptions.language;
      const valid = lang === "python" ? VALID_PYTHON_DATABASES : VALID_NODE_DATABASES;
      if (!valid.includes(finalOptions.database)) {
        logger.error(
          `Invalid database "${finalOptions.database}" for ${lang}. Must be one of: ${valid.join(", ")}`,
        );
        process.exit(1);
      }
    }

    const archgen = new ArchGen();
    try {
      await archgen.create(projectName, finalOptions);
    } catch (error) {
      if (error instanceof ArchGenError) {
        logger.error(error.message);
      } else {
        logger.error(`Unexpected error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });
