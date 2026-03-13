import path from "path";
import { FileSystem } from "./file-system";

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".zip", ".gz", ".tar", ".jar",
  ".exe", ".dll", ".so", ".dylib", ".node",
  ".mp3", ".mp4", ".wav", ".ogg", ".webm",
]);

export interface TemplateVariables {
  PROJECT_NAME: string;
  AUTHOR?: string;
  DESCRIPTION?: string;
  [key: string]: string | undefined;
}

export class TemplateEngine {
  private fs: FileSystem;

  constructor() {
    this.fs = new FileSystem();
  }

  private isBinary(filePath: string): boolean {
    return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  /**
   * Replace placeholders in string
   * {{PROJECT_NAME}} -> actual value
   */
  replaceInString(content: string, variables: TemplateVariables): string {
    let result = content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, "g");
      result = result.replace(placeholder, value || "");
    });

    return result;
  }

  /**
   * Process single file: read -> replace -> write
   */
  async processFile(
    sourceFile: string,
    destFile: string,
    variables: TemplateVariables,
  ): Promise<void> {
    const content = await this.fs.readFile(sourceFile);
    const processed = this.replaceInString(content, variables);
    await this.fs.writeFile(destFile, processed);
  }

  /**
   * Process entire template folder.
   * When dryRun is true, returns list of destination paths without writing.
   */
  async processTemplate(
    templatePath: string,
    outPath: string,
    variables: TemplateVariables,
    dryRun = false,
  ): Promise<string[]> {
    const files = await this.fs.getAllFiles(templatePath);
    const destPaths: string[] = [];

    for (const file of files) {
      const relativePath = path.relative(templatePath, file);
      const processedRelativePath = this.replaceInString(relativePath, variables);
      const destPath = path.join(outPath, processedRelativePath);
      destPaths.push(destPath);

      if (!dryRun) {
        if (this.isBinary(file)) {
          await this.fs.copyFile(file, destPath);
        } else {
          await this.processFile(file, destPath, variables);
        }
      }
    }

    return destPaths;
  }
}
