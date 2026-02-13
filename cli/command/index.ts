import { Command } from "commander";
import { ArchGen } from "../../core/archgen";

export const createCommand = new Command("create")

  .argument("<project-name>", "Name of the project")
  .option("-l, --language <lang>", "Language (node|python)", "node")
  .option("--docker", "Include Docker setup", false)
  .option("--testing", "Include testing setup", false)
  .option("-a", "--author <name>", "Author name")
  .option("-d", "--description <desc>", "Project description")
  .description("Create a new project")
  .action(async (projectName: string, options) => {
    const archgen = new ArchGen();
    await archgen.create(projectName, options);
  });
