import fs from "fs-extra";
import path from "path";

export interface ArchGenPreset {
  language?: string;
  author?: string;
  description?: string;
  database?: string;
  docker?: boolean;
  testing?: boolean;
  ci?: boolean;
  husky?: boolean;
  websocket?: boolean;
  oauth?: boolean;
  apiDocs?: boolean;
  email?: boolean;
  s3?: boolean;
  queue?: boolean;
  claudeCode?: boolean;
  cursor?: boolean;
}

const CONFIG_FILE = ".archgenrc.json";

export function findPresetFile(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function loadPreset(filePath: string): ArchGenPreset {
  try {
    return fs.readJsonSync(filePath) as ArchGenPreset;
  } catch {
    return {};
  }
}

export function mergePreset(preset: ArchGenPreset, cliOptions: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...preset };
  for (const [k, v] of Object.entries(cliOptions)) {
    if (v !== undefined && v !== false) {
      merged[k] = v;
    } else if (v === false && merged[k] === undefined) {
      merged[k] = false;
    }
  }
  return merged;
}

export async function writePreset(dir: string, preset: ArchGenPreset): Promise<string> {
  const filePath = path.join(dir, CONFIG_FILE);
  await fs.writeJson(filePath, preset, { spaces: 2 });
  return filePath;
}
