import path from "path";
import { Command } from "commander";
import prompts from "prompts";
import chalk from "chalk";
import { writePreset, loadPreset, findPresetFile, ArchGenPreset } from "../../core/config-preset";
import { logger } from "../../core/logger";

export const configCommand = new Command("config")
  .description("Manage archgen project presets (.archgenrc.json)")
  .addCommand(
    new Command("init")
      .description("Create a .archgenrc.json preset in the current directory")
      .action(async () => {
        const existing = findPresetFile(process.cwd());
        if (existing) {
          logger.warn(`Preset already exists at ${existing}`);
          logger.info("Edit it directly or run 'archgen config show' to view it.");
          return;
        }

        const answers = await prompts([
          {
            type: "select",
            name: "language",
            message: "Default language:",
            choices: [
              { title: "Node.js (TypeScript + Fastify)", value: "node" },
              { title: "Python (FastAPI)", value: "python" },
            ],
          },
          {
            type: "text",
            name: "author",
            message: "Default author name:",
            initial: "",
          },
          {
            type: "confirm",
            name: "docker",
            message: "Always include Docker?",
            initial: false,
          },
          {
            type: "confirm",
            name: "testing",
            message: "Always include testing setup?",
            initial: false,
          },
          {
            type: "confirm",
            name: "ci",
            message: "Always include GitHub Actions CI?",
            initial: false,
          },
        ], {
          onCancel: () => {
            logger.info("\nCancelled.");
            process.exit(0);
          },
        });

        const preset: ArchGenPreset = {
          language: answers.language,
          ...(answers.author ? { author: answers.author } : {}),
          docker: answers.docker,
          testing: answers.testing,
          ci: answers.ci,
        };

        const filePath = await writePreset(process.cwd(), preset);
        console.log();
        console.log(chalk.green(`  ✔  Created ${filePath}`));
        console.log(chalk.dim("     Edit it freely — all keys are optional."));
        console.log();
      }),
  )
  .addCommand(
    new Command("show")
      .description("Show the active preset (searches upward from current directory)")
      .action(() => {
        const filePath = findPresetFile(process.cwd());
        if (!filePath) {
          logger.info("No .archgenrc.json found. Run 'archgen config init' to create one.");
          return;
        }
        const preset = loadPreset(filePath);
        console.log();
        console.log(chalk.bold(`  Active preset: ${path.relative(process.cwd(), filePath)}\n`));
        for (const [k, v] of Object.entries(preset)) {
          console.log(`    ${chalk.cyan(k.padEnd(14))} ${chalk.white(String(v))}`);
        }
        console.log();
      }),
  )
  .addCommand(
    new Command("reset")
      .description("Delete .archgenrc.json in the current directory")
      .action(async () => {
        const filePath = path.join(process.cwd(), ".archgenrc.json");
        const { default: fs } = await import("fs-extra");
        if (!fs.existsSync(filePath)) {
          logger.info("No .archgenrc.json in the current directory.");
          return;
        }
        await fs.remove(filePath);
        logger.success("Removed .archgenrc.json");
      }),
  );
