import { Command } from "commander";
import { createCommand } from "./command";

const program = new Command();

program
  .name("archgen")
  .version("0.1.0")
  .description("Generate product-ready project structures");

program.addCommand(createCommand);

program.parse();
