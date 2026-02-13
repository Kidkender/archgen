import path from "path";
import { FileSystem } from "./file-system";

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
   * Process entire template folder
   */
  async processTemplate(
    templatePath: string,
    outPath: string,
    variables: TemplateVariables,
  ): Promise<void> {
    const files = await this.fs.getAllFiles(templatePath);
    for (const file of files) {
      const relativePath = path.relative(templatePath, file);
      const destPath = path.join(outPath, relativePath);

      await this.processFile(file, destPath, variables);
    }
  }
}
