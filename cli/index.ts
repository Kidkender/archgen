import { readFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import { createCommand } from "./command";
import { listCommand } from "./command/list";

const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("archgen")
  .version(pkg.version)
  .description("Generate product-ready project structures")
  .addHelpText("before", `
  ┌─────────────────────────────────────────┐
  │   archgen v${pkg.version.padEnd(30)}│
  │   Production-ready project scaffolding  │
  └─────────────────────────────────────────┘
`)
  .addHelpText("after", `
Examples:
  $ archgen create my-api
  $ archgen create my-api --language node --docker --testing
  $ archgen create my-service --language python --author "John Doe"
  $ archgen create my-app --force
  $ archgen create my-app --dry-run
  $ archgen list
`);

program.addCommand(createCommand);
program.addCommand(listCommand);

program.parse();
