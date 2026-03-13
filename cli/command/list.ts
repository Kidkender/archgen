import { Command } from "commander";
import { registry } from "../../core/registry";
import { logger } from "../../core/logger";

export const listCommand = new Command("list")
  .description("List all available languages and addons")
  .action(() => {
    const plugins = registry.listDetailed();
    console.log("");
    logger.info("Available languages:\n");
    for (const plugin of plugins) {
      console.log(`  ${plugin.key.padEnd(10)} ${plugin.name}`);
      console.log(`             ${plugin.description}`);
      if (plugin.addons.length > 0) {
        console.log(`             Addons: ${plugin.addons.join(", ")}`);
      }
      console.log("");
    }
  });
