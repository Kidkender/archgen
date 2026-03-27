import { Command } from "commander";
import { registry } from "../../core/registry";
import { logger } from "../../core/logger";

export const infoCommand = new Command("info")
  .argument("<language>", "Language to show details for (node|python)")
  .description("Show detailed stack information for a language")
  .action((language: string) => {
    const plugin = registry.get(language);
    if (!plugin) {
      logger.error(`Language "${language}" is not supported.`);
      logger.info(`Available: ${registry.list().join(", ")}`);
      process.exit(1);
    }

    console.log("");
    logger.info(`Stack: ${plugin.name}`);
    console.log(`  ${plugin.description}\n`);

    if (plugin.stack) {
      const s = plugin.stack;
      if (s.runtime)    console.log(`  Runtime:    ${s.runtime}`);
      if (s.framework)  console.log(`  Framework:  ${s.framework}`);
      if (s.orm)        console.log(`  ORM:        ${s.orm}`);
      if (s.database)   console.log(`  Database:   ${s.database}`);
      if (s.cache)      console.log(`  Cache:      ${s.cache}`);
      if (s.auth)       console.log(`  Auth:       ${s.auth}`);
      if (s.validation) console.log(`  Validation: ${s.validation}`);
      if (s.testing)    console.log(`  Testing:    ${s.testing}`);
      if (s.extras?.length) console.log(`  Extras:     ${s.extras.join(", ")}`);
    }

    if (plugin.addons?.length) {
      console.log(`\n  Addons: ${plugin.addons.join(", ")}`);
    }

    console.log("");
  });
