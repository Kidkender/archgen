import chalk from "chalk";
import path from "path";
import { FileSystem } from "./file-system";
import { logger } from "./logger";
import { TemplateEngine, TemplateVariables } from "./template-engine";
import { AddAddonOptions, GenerateOptions, Plugin, StackInfo } from "../types";

export interface AddonEntry {
  condition: boolean;
  path: string;
  label: string;
}

export abstract class BasePlugin implements Plugin {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly addons: string[];
  readonly stack?: StackInfo;

  protected readonly templateEngine: TemplateEngine;
  protected readonly fs: FileSystem;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.fs = new FileSystem();
  }

  /** Path segment relative to __dirname of the bundle, e.g. "plugins/node/template" */
  protected abstract get relativeTemplateDir(): string;

  protected abstract getVariables(projectName: string, options: GenerateOptions): TemplateVariables;

  /** Ordered list of addons to apply during generate() */
  protected abstract getAddonEntries(options: GenerateOptions, addonsPath: string): AddonEntry[];

  /** Read project name from project metadata (package.json / pyproject.toml) */
  protected abstract readProjectName(projectPath: string): Promise<string>;

  /** Override in plugins that need dynamic addon dir resolution (e.g. docker-pg) */
  protected async resolveApplyAddonDir(
    addonsPath: string,
    addon: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _projectPath: string,
  ): Promise<string> {
    return path.join(addonsPath, addon);
  }

  abstract showNextSteps(projectName: string, options: GenerateOptions): void;

  protected buildApplyAddonVariables(projectName: string): TemplateVariables {
    return {
      PROJECT_NAME: projectName,
      AUTHOR: "Your Name",
      DESCRIPTION: "",
    };
  }

  /** Runs before any template files are processed. Throw here to abort generation (e.g. invalid option combos). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async beforeGenerate(projectName: string, options: GenerateOptions): Promise<void> {}

  /** Runs once after generate() finishes writing files (or previewing them, on dry-run). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async afterGenerate(outputPath: string, options: GenerateOptions): Promise<void> {}

  /** Runs before an addon's template files are processed. Throw here to abort (e.g. invalid option combos). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async beforeApplyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {}

  /** Runs once after applyAddon() finishes writing files (or previewing them, on dry-run). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async afterApplyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {}

  async generate(projectName: string, options: GenerateOptions): Promise<void> {
    await this.beforeGenerate(projectName, options);

    const outputPath = options.outputDir ?? path.join(process.cwd(), projectName);
    const templateBasePath = path.join(__dirname, this.relativeTemplateDir, "base");
    const addonsPath = path.join(__dirname, this.relativeTemplateDir, "addons");

    logger.step(`Generating ${this.name} project...`);

    const variables = this.getVariables(projectName, options);
    const dryRun = options.dryRun ?? false;

    logger.step(dryRun ? "Previewing base template files..." : "Processing base template...");
    const files = await this.templateEngine.processTemplate(templateBasePath, outputPath, variables, dryRun);

    for (const addon of this.getAddonEntries(options, addonsPath)) {
      if (addon.condition && this.fs.exists(addon.path)) {
        logger.step(dryRun ? `Previewing ${addon.label} files...` : `Adding ${addon.label}...`);
        const addonFiles = await this.templateEngine.processTemplate(addon.path, outputPath, variables, dryRun);
        files.push(...addonFiles);
      }
    }

    if (dryRun) {
      console.log("");
      logger.info(`Would create ${files.length} files in ./${projectName}:`);
      files.forEach((f) => console.log(`  ${f}`));
      console.log("");
    } else {
      logger.success(`Project "${projectName}" generated successfully`);
      this.showNextSteps(projectName, options);
    }

    await this.afterGenerate(outputPath, options);
  }

  async applyAddon(projectPath: string, addon: string, options: AddAddonOptions): Promise<void> {
    await this.beforeApplyAddon(projectPath, addon, options);

    const dryRun = options.dryRun ?? false;
    const addonsPath = path.join(__dirname, this.relativeTemplateDir, "addons");

    let projectName = path.basename(projectPath);
    try {
      projectName = await this.readProjectName(projectPath);
    } catch {
      // fall back to dirname
    }

    const variables = this.buildApplyAddonVariables(projectName);
    const addonDir = await this.resolveApplyAddonDir(addonsPath, addon, projectPath);

    if (!this.fs.exists(addonDir)) {
      throw new Error(`Addon "${addon}" not found for ${this.name} projects`);
    }

    logger.step(dryRun ? `Previewing ${addon} files...` : `Applying ${addon}...`);
    const files = await this.templateEngine.processTemplate(addonDir, projectPath, variables, dryRun);

    if (dryRun) {
      logger.info(`Would write ${files.length} file(s):`);
      files.forEach((f) => {
        const marker = this.fs.exists(f)
          ? chalk.yellow("[overwrite]")
          : chalk.green("[new]     ");
        console.log(`  ${marker} ${f}`);
      });
    } else {
      logger.success(`Addon "${addon}" applied successfully.`);
    }

    await this.afterApplyAddon(projectPath, addon, options);
  }
}
