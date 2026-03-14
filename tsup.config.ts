import { copy } from "fs-extra";
import { basename, dirname, join } from "path";
import { defineConfig } from "tsup";
import { fileURLToPath } from "url";

const SKIP_DIRS = new Set(["node_modules", ".git", "__pycache__", "venv", ".venv", "dist"]);
const templateFilter = (src: string) => !SKIP_DIRS.has(basename(src));

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: false,
  shims: true,
  loader: {
    ".py": "copy",
    ".md": "copy",
    ".json": "copy",
    ".toml": "copy",
    ".ini": "copy",
    ".yml": "copy",
    ".yaml": "copy",
    ".txt": "copy",
    ".example": "copy",
  },
  onSuccess: async () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));

    await copy(
      join(__dirname, "plugins/node/template"),
      join(__dirname, "dist/plugins/node/template"),
      { filter: templateFilter },
    );

    await copy(
      join(__dirname, "plugins/python/template"),
      join(__dirname, "dist/plugins/python/template"),
      { filter: templateFilter },
    );

    console.log("✓ Template files copied");
  },
});
