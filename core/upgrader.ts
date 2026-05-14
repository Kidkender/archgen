import path from "path";
import { readFileSync } from "fs";
import { join } from "path";
import { FileSystem } from "./file-system";
import { logger } from "./logger";
import { registry } from "./registry";
import { ArchGenError } from "./errors";

interface ArchgenMeta {
  version: string;
  language: string;
  addons: string[];
  database?: string | null;
  generatedAt: string;
  projectName: string;
}

export interface UpgradeResult {
  language: string;
  projectName: string;
  addons: string[];
  fromVersion: string;
  toVersion: string;
}

export class Upgrader {
  private readonly fs: FileSystem;

  constructor() {
    this.fs = new FileSystem();
  }

  async readMeta(projectPath: string): Promise<ArchgenMeta> {
    const metaPath = path.join(projectPath, ".archgen-meta.json");

    if (!this.fs.exists(metaPath)) {
      throw new ArchGenError(
        "NO_PLUGIN",
        "No .archgen-meta.json found. This command must be run from an archgen-generated project root.",
      );
    }

    try {
      const raw = await this.fs.readFile(metaPath);
      return JSON.parse(raw) as ArchgenMeta;
    } catch {
      throw new ArchGenError("GENERATE_FAILED", "Failed to parse .archgen-meta.json — file may be corrupted.");
    }
  }

  async upgrade(projectPath: string, dryRun = false): Promise<UpgradeResult> {
    const meta = await this.readMeta(projectPath);

    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8")) as { version: string };
    const currentVersion = pkg.version;

    const plugin = registry.get(meta.language);
    if (!plugin) {
      throw new ArchGenError("NO_PLUGIN", `No plugin found for language: ${meta.language}`);
    }

    if (!plugin.applyAddon) {
      throw new ArchGenError("NO_ADDON_SUPPORT", `Plugin "${meta.language}" does not support addons.`);
    }

    if (meta.addons.length === 0) {
      logger.info("No addons recorded in .archgen-meta.json — nothing to upgrade.");
      return {
        language: meta.language,
        projectName: meta.projectName,
        addons: [],
        fromVersion: meta.version,
        toVersion: currentVersion,
      };
    }

    logger.info(`Upgrading ${meta.projectName} (${meta.language}) from v${meta.version} → v${currentVersion}`);
    logger.info(`Addons to re-apply: ${meta.addons.join(", ")}`);

    for (const addon of meta.addons) {
      if (!plugin.addons?.includes(addon)) {
        logger.warn(`Addon "${addon}" no longer exists in ${meta.language} plugin — skipping`);
        continue;
      }

      try {
        logger.step(dryRun ? `[dry-run] Would upgrade: ${addon}` : `Upgrading addon: ${addon}...`);
        await plugin.applyAddon(projectPath, addon, { dryRun });
      } catch (error) {
        logger.warn(`Failed to upgrade addon "${addon}": ${(error as Error).message}`);
      }
    }

    if (!dryRun) {
      await this.updateMetaVersion(projectPath, meta, currentVersion);
      logger.success(`Upgrade complete. .archgen-meta.json updated to v${currentVersion}`);
    }

    return {
      language: meta.language,
      projectName: meta.projectName,
      addons: meta.addons,
      fromVersion: meta.version,
      toVersion: currentVersion,
    };
  }

  private async updateMetaVersion(
    projectPath: string,
    meta: ArchgenMeta,
    newVersion: string,
  ): Promise<void> {
    const updated: ArchgenMeta = {
      ...meta,
      version: newVersion,
      generatedAt: new Date().toISOString(),
    };
    await this.fs.writeFile(
      path.join(projectPath, ".archgen-meta.json"),
      JSON.stringify(updated, null, 2),
    );
  }
}
