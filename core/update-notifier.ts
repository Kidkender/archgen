import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CACHE_FILE = join(homedir(), ".archgen-update-cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const FETCH_TIMEOUT_MS = 3000;

interface UpdateCache {
  latestVersion: string;
  checkedAt: number;
}

function readCache(): UpdateCache | null {
  try {
    const raw = readFileSync(CACHE_FILE, "utf-8");
    const cache = JSON.parse(raw) as UpdateCache;
    if (Date.now() - cache.checkedAt < CACHE_TTL_MS) return cache;
  } catch {}
  return null;
}

function writeCache(latestVersion: string): void {
  try {
    writeFileSync(
      CACHE_FILE,
      JSON.stringify({ latestVersion, checkedAt: Date.now() }),
      "utf-8"
    );
  } catch {}
}

async function fetchLatestVersion(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch("https://registry.npmjs.org/@kidkender/archgen/latest", {
      signal: controller.signal,
    });
    const data = (await res.json()) as { version: string };
    return data.version;
  } finally {
    clearTimeout(timeout);
  }
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [la, lb, lc] = parse(latest);
  const [ca, cb, cc] = parse(current);
  return (
    la > ca ||
    (la === ca && lb > cb) ||
    (la === ca && lb === cb && lc > cc)
  );
}

/**
 * Returns the latest version string if a newer version is available, null otherwise.
 * Never throws — failures are silently ignored.
 */
export async function checkForUpdate(currentVersion: string): Promise<string | null> {
  try {
    const cached = readCache();
    let latestVersion: string;

    if (cached) {
      latestVersion = cached.latestVersion;
    } else {
      latestVersion = await fetchLatestVersion();
      writeCache(latestVersion);
    }

    return isNewer(latestVersion, currentVersion) ? latestVersion : null;
  } catch {
    return null;
  }
}
