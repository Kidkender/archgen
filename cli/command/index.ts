import { Command } from "commander";
import { ArchGen } from "../../core/archgen";
import { promptMissingOptions } from "../prompts";

export const createCommand = new Command("create")
  .argument("<project-name>", "Name of the project")
  .option("-l, --language <lang>", "Language (node|python)")
  .option("--docker", "Include Docker setup", false)
  .option("--testing", "Include testing setup", false)
  .option("-a, --author <n>", "Author name")
  .option("-d, --description <desc>", "Project description")
  .description("Create a new project")
  .action(async (projectName: string, options) => {
    const finalOptions = await promptMissingOptions(projectName, options);
    const archgen = new ArchGen();
    await archgen.create(projectName, finalOptions);
  });
