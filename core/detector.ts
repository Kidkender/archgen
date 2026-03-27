import fs from "fs-extra";
import path from "path";

export type DetectedLanguage = "node" | "python" | null;

export function detectProjectLanguage(cwd: string): DetectedLanguage {
  const pkgPath = path.join(cwd, "package.json");
  const pyprojectPath = path.join(cwd, "pyproject.toml");
  const mainPyPath = path.join(cwd, "main.py");

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if ("fastify" in deps) return "node";
    } catch {
      // not parseable
    }
  }

  if (fs.existsSync(pyprojectPath) || fs.existsSync(mainPyPath)) {
    return "python";
  }

  return null;
}
