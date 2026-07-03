import { Command } from "commander";
import { ArchGen } from "../../core/archgen";
import { ArchGenError } from "../../core/errors";
import { logger } from "../../core/logger";
import { promptMissingOptions } from "../prompts";
import { findPresetFile, loadPreset, mergePreset } from "../../core/config-preset";

export const createCommand = new Command("create")
  .argument("<project-name>", "Name of the project")
  .option("-l, --language <lang>", "Language (node|python)")
  .option("--docker", "Include Docker setup", false)
  .option("--testing", "Include testing setup", false)
  .option("--ci", "Include GitHub Actions CI workflow", false)
  .option("--husky", "Include Husky + lint-staged setup (Node only)")
  .option("--websocket", "Include WebSocket support (Socket.io for Node, native for Python)")
  .option("--oauth", "Include OAuth2 providers — Google + GitHub")
  .option("--api-docs", "Include API reference UI (Scalar for Node, built-in OpenAPI for Python)")
  .option("--claude-code", "Include Claude Code setup (CLAUDE.md + .claude/skills/)")
  .option("--cursor", "Include Cursor agent setup (.cursor/skills/)")
  .option("--email", "Include email service (SMTP)")
  .option("--s3", "Include AWS S3 / Cloudflare R2 / MinIO storage service")
  .option("--queue", "Include background job queue (BullMQ for Node, arq for Python)")
  .option("--pre-commit", "Include pre-commit hooks (Python only: ruff + black + mypy)")
  .option("--observability", "Include observability stack (OpenTelemetry + Prometheus + Sentry stub)")
  .option("--sentry", "Include Sentry error tracking dependency (requires --observability)")
  .option("--jwt", "Include JWT authentication (Go only)")
  .option("--module-path <path>", "Go module path (e.g. github.com/username/my-app)")
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

    // Merge .archgenrc.json preset (CLI flags take priority)
    const presetFile = findPresetFile();
    if (presetFile) {
      const preset = loadPreset(presetFile);
      options = mergePreset(preset, options as Record<string, unknown>) as typeof options;
      logger.debug(`Loaded preset from ${presetFile}`);
    }

    // Database validation happens inside ArchGen.create() (Zod schema, language-aware)
    const finalOptions = await promptMissingOptions(projectName, options);

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
