import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: false,
  shims: true,
  loader: {
    '.py': 'copy',
    '.md': 'copy',
    '.json': 'copy',
    '.toml': 'copy',
    '.ini': 'copy',
    '.yml': 'copy',
    '.yaml': 'copy',
    '.txt': 'copy',
    '.example': 'copy',
  },
  onSuccess: async () => {
    const fs = require("fs");
    const path = require("path");

    await fs.copy(
      path.join(__dirname, "src/plugins/node/template"),
      path.join(__dirname, "dist/plugins/node/template")
    )

    await fs.copy(
      path.join(__dirname, "src/plugins/python/template"),
      path.join(__dirname, "dist/plugins/python/template")
    )

    console.log("template files copies")
  }
});
