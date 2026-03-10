import fs from "fs-extra";
import path from "path";
import { logger } from "./logger";


const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "__pycache__", ".venv", "venv"]);

export class FileSystem {
  /**
   * Check if path exists
   */
  exists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  /**
   * Ensure directory exists, create if not
   */
  async ensureDir(targetPath: string): Promise<void> {
    await fs.ensureDir(targetPath);
  }

  /**
   * Copy entire folder recursively
   */
  async copyFolder(source: string, dest: string): Promise<void> {
    await fs.copy(source, dest);
  }

  /**
   * Remove directory and all its contents
   */
  async removeDir(targetPath: string): Promise<void> {
    await fs.remove(targetPath);
  }

  /**
   * Write file with content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf-8");
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, "utf-8");
  }

  /**
   * Get all files in directory recursively
   */
  async getAllFiles(
    dirPath: string,
    arrayOfFiles: string[] = [],
  ): Promise<string[]> {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (SKIP_DIRS.has(file)) continue;

      const fullPath = path.join(dirPath, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        arrayOfFiles = await this.getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    }

    return arrayOfFiles;
  }
}
