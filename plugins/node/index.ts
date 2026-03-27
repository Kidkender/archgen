import path from "path";
import { FileSystem } from "../../core/file-system";
import { logger } from "../../core/logger";
import { TemplateEngine } from "../../core/template-engine";
import { AddAddonOptions, GenerateOptions, Plugin, StackInfo } from "../../types";
import { nodeConfig } from "./config";

export class NodePlugin implements Plugin {
  name = nodeConfig.name;
  description = nodeConfig.description;
  addons = nodeConfig.addons;
  stack: StackInfo = {
    runtime: "Node.js 18+ (TypeScript)",
    framework: "Fastify v5",
    orm: "Prisma v7",
    database: "MariaDB / MySQL (mariadb:11) or PostgreSQL",
    cache: "Redis 7 (ioredis)",
    auth: "JWT (jsonwebtoken)",
    validation: "Zod v4",
    testing: "Jest + ts-jest",
    extras: ["dotenv", "pino logger", "node-cron", "Swagger UI"],
  };

  private templateEngine: TemplateEngine;
  private fs: FileSystem;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.fs = new FileSystem();
  }

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    const outputPath = path.join(process.cwd(), projectName);

    const templateBasePath = path.join(__dirname, "plugins/node/template", "base");
    const addonsPath = path.join(__dirname, "plugins/node/template", "addons");

    logger.step("Generate Node.js Typescript project...");

    const variables = {
      PROJECT_NAME: projectName,
      AUTHOR: options.author || "Your Name",
      DESCRIPTION: options.description || "A Node.js Typescript project",
    };

    const dryRun = options.dryRun ?? false;
    const usePostgres = options.database === "postgresql";

    logger.step(dryRun ? "Previewing base template files..." : "Processing base template...");
    const files = await this.templateEngine.processTemplate(templateBasePath, outputPath, variables, dryRun);

    if (usePostgres) {
      logger.step("Applying PostgreSQL configuration...");
      const pgAddon = path.join(addonsPath, "database", "postgresql");
      const pgFiles = await this.templateEngine.processTemplate(pgAddon, outputPath, variables, dryRun);
      files.push(...pgFiles);
    }

    if (options.docker) {
      logger.step(dryRun ? "Previewing Docker files..." : "Adding Docker support...");
      const dockerAddon = path.join(addonsPath, usePostgres ? "docker-pg" : "docker");
      const dockerFiles = await this.templateEngine.processTemplate(dockerAddon, outputPath, variables, dryRun);
      files.push(...dockerFiles);
    }

    if (options.testing) {
      logger.step(dryRun ? "Previewing testing files..." : "Adding testing setup...");
      const testingAddon = path.join(addonsPath, "testing");
      const testFiles = await this.templateEngine.processTemplate(testingAddon, outputPath, variables, dryRun);
      files.push(...testFiles);
    }

    if (options.ci) {
      logger.step(dryRun ? "Previewing CI files..." : "Adding GitHub Actions CI...");
      const ciAddon = path.join(addonsPath, "ci");
      const ciFiles = await this.templateEngine.processTemplate(ciAddon, outputPath, variables, dryRun);
      files.push(...ciFiles);
    }

    if (dryRun) {
      console.log("");
      logger.info(`Would create ${files.length} files in ./${projectName}:`);
      files.forEach((f) => console.log(`  ${f}`));
      console.log("");
      return;
    }

    logger.success(`Project "${projectName}" generated successfully`);
    this.showNextSteps(projectName, options);
  }


  async applyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    const dryRun = options.dryRun ?? false;
    const addonsPath = path.join(__dirname, "plugins/node/template", "addons");

    let projectName = path.basename(projectPath);
    try {
      const pkgRaw = await this.fs.readFile(path.join(projectPath, "package.json"));
      const pkg = JSON.parse(pkgRaw) as { name?: string };
      projectName = pkg.name ?? projectName;
    } catch {
      // fall back to dirname
    }

    const variables = {
      PROJECT_NAME: projectName,
      AUTHOR: "Your Name",
      DESCRIPTION: "",
    };

    // For docker addon, detect which variant to use based on prisma schema
    let addonDir = path.join(addonsPath, addon);
    if (addon === "docker") {
      try {
        const schema = await this.fs.readFile(path.join(projectPath, "prisma", "schema.prisma"));
        if (schema.includes('provider = "postgresql"')) {
          addonDir = path.join(addonsPath, "docker-pg");
        }
      } catch {
        // default to mysql docker
      }
    }

    if (!this.fs.exists(addonDir)) {
      throw new Error(`Addon "${addon}" not found for Node.js projects`);
    }

    logger.step(dryRun ? `Previewing ${addon} files...` : `Applying ${addon}...`);
    const files = await this.templateEngine.processTemplate(addonDir, projectPath, variables, dryRun);

    if (dryRun) {
      logger.info(`Would write ${files.length} file(s):`);
      files.forEach((f) => console.log(`  ${f}`));
    } else {
      logger.success(`Addon "${addon}" applied successfully.`);
    }
  }

  private showNextSteps(projectName: string, options: GenerateOptions): void {
    console.log("");
    logger.info("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  cp .env.example .env`);
    if (options.docker) {
      console.log(`  docker-compose up -d`);
    } else {
      console.log(`  npm run dev`);
    }
    console.log("");
  }
}
