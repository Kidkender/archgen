import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import fs from "fs-extra";
import { loadPreset, mergePreset } from "../../core/config-preset";
import { logger } from "../../core/logger";

describe("loadPreset", () => {
  const tmpDir = path.join(os.tmpdir(), "archgen-config-preset-test");
  const presetPath = path.join(tmpDir, ".archgenrc.json");

  beforeEach(async () => {
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    vi.restoreAllMocks();
  });

  it("returns the parsed preset for valid JSON", async () => {
    await fs.writeJson(presetPath, { language: "node", docker: true });
    expect(loadPreset(presetPath)).toEqual({ language: "node", docker: true });
  });

  it("warns and returns {} for malformed JSON instead of failing silently", async () => {
    await fs.writeFile(presetPath, "{ not valid json ,,,");
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

    expect(loadPreset(presetPath)).toEqual({});
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain(presetPath);
  });

  it("warns and returns {} when the file does not exist", () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

    expect(loadPreset(path.join(tmpDir, "missing.json"))).toEqual({});
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});

describe("mergePreset", () => {
  it("lets CLI flags take priority over preset values", () => {
    const preset = { language: "node", docker: true };
    const cliOptions = { language: "python" };
    expect(mergePreset(preset, cliOptions)).toMatchObject({ language: "python", docker: true });
  });
});
