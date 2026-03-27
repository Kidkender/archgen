import { readFileSync } from "fs";
import { join } from "path";
import { Command } from "commander";
import { createCommand } from "./command";
import { listCommand } from "./command/list";
import { infoCommand } from "./command/info";
import { addCommand } from "./command/add";
import { doctorCommand } from "./command/doctor";

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
  $ archgen create my-api --language node --docker --testing --ci
  $ archgen create my-api --language node --all
  $ archgen create my-service --language python --author "John Doe"
  $ archgen create my-app --database postgresql
  $ archgen create my-app --force
  $ archgen create my-app --dry-run
  $ archgen create my-app --skip-git
  $ archgen list
  $ archgen info node
  $ archgen add docker
  $ archgen add ci --dry-run
  $ archgen doctor
`);

program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(infoCommand);
program.addCommand(addCommand);
program.addCommand(doctorCommand);

program.parse();
