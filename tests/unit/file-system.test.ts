import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import fs from "fs-extra";
import { FileSystem } from "../../core/file-system";

describe("FileSystem", () => {
  let fileSystem: FileSystem;
  let tmpDir: string;

  beforeEach(async () => {
    fileSystem = new FileSystem();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "archgen-test-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("exists() returns true for existing path", () => {
    expect(fileSystem.exists(tmpDir)).toBe(true);
  });

  it("exists() returns false for non-existent path", () => {
    expect(fileSystem.exists(path.join(tmpDir, "ghost"))).toBe(false);
  });

  it("ensureDir() creates nested directories", async () => {
    const nested = path.join(tmpDir, "a", "b", "c");
    await fileSystem.ensureDir(nested);
    expect(fs.existsSync(nested)).toBe(true);
  });

  it("writeFile() creates file with correct content", async () => {
    const filePath = path.join(tmpDir, "hello.txt");
    await fileSystem.writeFile(filePath, "hello world");
    expect(fs.readFileSync(filePath, "utf-8")).toBe("hello world");
  });

  it("writeFile() auto-creates parent directories", async () => {
    const filePath = path.join(tmpDir, "deep", "dir", "file.txt");
    await fileSystem.writeFile(filePath, "content");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("readFile() reads content back correctly", async () => {
    const filePath = path.join(tmpDir, "read-me.txt");
    fs.writeFileSync(filePath, "read content", "utf-8");
    const content = await fileSystem.readFile(filePath);
    expect(content).toBe("read content");
  });

  it("copyFile() copies file byte-for-byte", async () => {
    const src = path.join(tmpDir, "src.txt");
    const dest = path.join(tmpDir, "dest", "copy.txt");
    fs.writeFileSync(src, "copy me", "utf-8");
    await fileSystem.copyFile(src, dest);
    expect(fs.readFileSync(dest, "utf-8")).toBe("copy me");
  });

  it("removeDir() removes directory recursively", async () => {
    const dir = path.join(tmpDir, "to-remove");
    await fs.ensureDir(path.join(dir, "nested"));
    fs.writeFileSync(path.join(dir, "file.txt"), "x");
    await fileSystem.removeDir(dir);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it("getAllFiles() lists files recursively", async () => {
    await fs.ensureDir(path.join(tmpDir, "sub"));
    fs.writeFileSync(path.join(tmpDir, "a.txt"), "");
    fs.writeFileSync(path.join(tmpDir, "sub", "b.txt"), "");
    const files = await fileSystem.getAllFiles(tmpDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith("a.txt"))).toBe(true);
    expect(files.some((f) => f.endsWith("b.txt"))).toBe(true);
  });

  it("getAllFiles() skips node_modules and .git", async () => {
    await fs.ensureDir(path.join(tmpDir, "node_modules", "pkg"));
    await fs.ensureDir(path.join(tmpDir, ".git"));
    fs.writeFileSync(path.join(tmpDir, "node_modules", "pkg", "index.js"), "");
    fs.writeFileSync(path.join(tmpDir, ".git", "HEAD"), "");
    fs.writeFileSync(path.join(tmpDir, "app.ts"), "");
    const files = await fileSystem.getAllFiles(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/app\.ts$/);
  });

  it("getAllFiles() returns empty array for empty directory", async () => {
    const emptyDir = path.join(tmpDir, "empty");
    await fs.ensureDir(emptyDir);
    const files = await fileSystem.getAllFiles(emptyDir);
    expect(files).toHaveLength(0);
  });
});
