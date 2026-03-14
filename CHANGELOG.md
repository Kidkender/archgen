# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.2] - 2026-03-13

### Fixed
- Exclude `node_modules`, `.git`, `__pycache__`, `venv` when copying templates to dist
- Binary files in templates now copied verbatim instead of being read as UTF-8
- Removed duplicate `validateProjectName()` — validation now handled solely by `getNameError()`
- Swagger title placeholder `{PROJECT_NAME}` → `{{PROJECT_NAME}}`
- CLI version now read dynamically from `package.json` (was hardcoded `0.1.0`)
- `Object.keys(registry)` → `registry.list()` in unsupported language error message
- Python testing addon files now actually copied (was logging but not writing files)
- Rollback: partially created project directory is removed on generation failure
- Docker and testing addons now processed through template engine (placeholder replacement)
- Filename placeholders (`{{PROJECT_NAME}}` in path components) now replaced correctly
- `dotenv` added to Node template dependencies
- Node template database stack unified to MySQL/MariaDB (removed PostgreSQL mismatch)
- `DATABASE_URL` validation changed from `z.string().url()` to `z.string().min(1)` for mysql:// compatibility
- Prompt cancel handling hardened — exits cleanly if answers are incomplete
- Python `__all__` in middleware uses string literals instead of class references
- Path traversal explicitly prevented in project name handling

### Added
- Database choice for Node.js: MySQL/MariaDB (default) or PostgreSQL via `--database` flag or interactive prompt
- PostgreSQL template overlay: `@prisma/adapter-pg`, `PrismaPg` adapter, `schema.prisma`, `.env.example`, `package.json`
- Separate `docker-pg` addon with `postgres:15-alpine` docker-compose for PostgreSQL users
- Expanded Node template `.gitignore` (dist, logs, OS files, IDE, lock files)
- `archgen list` command to show available languages and addons
- `--force` flag to overwrite existing project directory
- `--dry-run` flag to preview files without writing
- `git init` automatically run in generated projects
- Custom help output with banner and usage examples
- `"exports"` and `"module"` fields in package.json for proper ESM support
- `"publishConfig": { "access": "public" }` for scoped npm package
- TypeScript strict mode enabled (`strict: true`)
- Unit test suite (vitest) for `getNameError`, `TemplateEngine.replaceInString`, `PluginRegistry`
- `CHANGELOG.md`

## [1.0.0] - 2026-03-12

### Added
- Initial release
- Node.js (TypeScript + Fastify + Prisma + Redis + JWT) scaffold
- Python (FastAPI + SQLAlchemy + Alembic + Redis + Pydantic v2) scaffold
- Docker addon support
- Testing addon support (Jest / pytest)
- Interactive prompts via `prompts` library
- Plugin-based architecture for extensibility
