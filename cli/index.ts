import { readFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import { createCommand } from "./command";
import { listCommand } from "./command/list";
import { infoCommand } from "./command/info";
import { addCommand } from "./command/add";
import { doctorCommand } from "./command/doctor";
import { completionCommand } from "./command/completion";
import { logger } from "../core/logger";
import { checkForUpdate } from "../core/update-notifier";
import chalk from "chalk";

const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

// Fire update check immediately — non-blocking, result awaited in postAction
const updateCheckPromise = checkForUpdate(pkg.version as string);

const program = new Command();

program
  .name("archgen")
  .version(pkg.version)
  .description("Generate product-ready project structures")
  .option("--quiet", "Suppress all output except errors")
  .option("--verbose", "Show debug output")
  .addHelpText("before", `
  ┌─────────────────────────────────────────┐
  │   archgen v${pkg.version.padEnd(30)}│
  │   Production-ready project scaffolding  │
  └─────────────────────────────────────────┘
`)
  .addHelpText("after", `
Examples:
  $ archgen create my-api
  $ archgen create my-api --language node --docker --testing --ci
  $ archgen create my-api --language node --all
  $ archgen create my-service --language python --author "John Doe"
  $ archgen create my-app --database postgresql
  $ archgen create my-app --language python --database sqlite
  $ archgen create my-app --force
  $ archgen create my-app --dry-run
  $ archgen create my-app --skip-git
  $ archgen create my-app --output /tmp/projects
  $ archgen create my-app --quiet
  $ archgen list
  $ archgen info node
  $ archgen add docker
  $ archgen add ci --dry-run
  $ archgen doctor
  $ archgen completion bash >> ~/.bashrc
  $ archgen completion zsh >> ~/.zshrc
`);

program.hook("preAction", (_thisCommand, actionCommand) => {
  const opts = program.opts<{ quiet?: boolean; verbose?: boolean }>();
  if (opts.quiet) {
    logger.setLevel("quiet");
  } else if (opts.verbose) {
    logger.setLevel("verbose");
  }
  // Pass global flags down to subcommand options
  if (opts.quiet) actionCommand.setOptionValue("quiet", true);
  if (opts.verbose) actionCommand.setOptionValue("verbose", true);
});

program.hook("postAction", async () => {
  const latestVersion = await updateCheckPromise;
  if (!latestVersion) return;
  const opts = program.opts<{ quiet?: boolean }>();
  if (opts.quiet) return;

  console.log();
  console.log(
    chalk.yellow("  Update available:"),
    chalk.gray(pkg.version as string),
    "→",
    chalk.green(latestVersion)
  );
  console.log(chalk.gray("  Run: npm install -g @kidkender/archgen"));
  console.log();
});

program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(infoCommand);
program.addCommand(addCommand);
program.addCommand(doctorCommand);
program.addCommand(completionCommand);

program.parse();
