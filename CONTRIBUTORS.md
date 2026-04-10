# Contributors

Thanks to everyone who has contributed to **archgen**!

---

## Core Maintainer

| Name | GitHub | Role |
|------|--------|------|
| Kidkender | [@Kidkender](https://github.com/Kidkender) | Creator & Maintainer |

---

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/Kidkender/archgen/issues) first
2. Open a new issue with a clear title and description
3. Include your OS, Node.js version, and `archgen --version`
4. Paste the exact command that failed and the error output

### Submitting a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b feat/my-feature` or `fix/my-bug`
3. Make your changes following the conventions below
4. Run tests: `pnpm test`
5. Run type check: `pnpm exec tsc --noEmit`
6. Open a PR against `main`

### Development Setup

```bash
git clone https://github.com/Kidkender/archgen.git
cd archgen
pnpm install
pnpm build
pnpm link --global   # use 'archgen' command pointing to local dist/
```

### Conventions

- **No `console.log`** in `core/` or `plugins/` — use `logger` from `core/logger.ts`
- **Throw `ArchGenError`** in core code — never call `process.exit()` outside the CLI layer
- **Use `path.join()`** for all path construction — no string concatenation
- **Template placeholders** use `{{DOUBLE_CURLY}}` syntax
- **Addon overlays** must go through `templateEngine.processTemplate()`, not `fs.copyFolder()`
- Commit messages follow: `type: description` (`feat`, `fix`, `chore`, `docs`, `test`)

### Adding a New Language Plugin

See the [Architecture section in CLAUDE.md](.claude/CLAUDE.md#adding-a-new-language-plugin) for the full guide.

### Adding a New Addon (Node.js)

1. Create `plugins/node/template/addons/<addon-name>/` with overlay files
2. Add an entry to `getAddonEntries()` in `plugins/node/index.ts`
3. Add the addon name to `nodeConfig.addons` in `plugins/node/config.ts`
4. If the addon requires extra npm packages, add them to `applyAddon()` and `generate()` in `plugins/node/index.ts`
5. Add next steps hint to `showNextSteps()` if needed

---

## License

By contributing, you agree that your contributions will be licensed under the [ISC License](./package.json).
