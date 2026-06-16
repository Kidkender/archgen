# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.3.1] - 2026-06-16

### Security
- Updated devDependencies to patch known CVEs (none affect published package — all are devDep-only):
  - `nodemailer` 8.0.7 → 9.0.0 (CRLF injection, TLS bypass, disableFileAccess bypass)
  - `vite` pinned to 8.0.5 (server.fs.deny bypass, WebSocket arbitrary file read)
  - `esbuild` forced to 0.28.1 via pnpm overrides (RCE via NPM_CONFIG_REGISTRY, Windows file read)
  - `picomatch` forced to 4.0.4 via pnpm overrides (ReDoS via extglob quantifiers)

## [1.3.0] - 2026-06-16

### Added
- **Go plugin** — third language, generates production-ready Go backend:
  - Router: **chi v5** (thin net/http wrapper, no framework lock-in)
  - ORM: **GORM v2** + PostgreSQL via pgx driver
  - Migration: **golang-migrate** (up/down SQL files, consistent with Alembic/Prisma)
  - Config: **godotenv** + `internal/config` struct
  - Dev: **air** hot reload + **Makefile** with `dev`, `build`, `migrate-up/down`, `test`, `lint`
  - Logger: **slog** (stdlib, no dependency)
- **`--jwt` addon (Go)** — JWT auth overlay: `AuthService`, `Claims`, bcrypt password hashing, `middleware.Auth()` chi middleware, user CRUD handlers, GORM soft-delete model, migration `000002_create_users`
- **`--module-path` flag** — Go module path (e.g. `github.com/username/my-app`); prompted interactively for Go projects, defaults to `github.com/example/<name>` in non-TTY
- **Docker addon (Go)** — multi-stage `Dockerfile` (golang:1.22-alpine → alpine:3.20), `docker-compose.yml` with PostgreSQL healthcheck
- **CI addon (Go)** — GitHub Actions workflow with PostgreSQL service, `go vet`, `go test -race`
- **Testing addon (Go)** — `tests/health_test.go` using `net/http/httptest`, no external deps
- **`archgen add jwt`** — inject JWT addon into existing Go projects; reads module path from `go.mod` for correct placeholder replacement
- Go language choice added to interactive prompts; `database` prompt skipped for Go (always PostgreSQL)
- Go project detection in `detectProjectLanguage()` via `go.mod` presence

### Fixed
- `--module-path` flag correctly maps to `options.modulePath` (previously `--module` did not bind due to Commander camelCase convention)

## [1.2.0] - 2026-06-16

### Added
- **`--observability` addon (Node.js + Python)** — production-grade observability stack:
  - Node.js: `src/telemetry.ts` (OpenTelemetry SDK auto-init), `src/plugins/metrics.plugin.ts` (Prometheus `/metrics` endpoint via `prom-client`), `src/config/sentry.ts` (Sentry stub, gated by `SENTRY_DSN`)
  - Python: `app/core/observability.py` (`instrument_app(app)` — OTel + FastAPI instrumentation + Prometheus via `prometheus-fastapi-instrumentator`), `app/core/sentry.py` (Sentry stub)
  - Both: `observability/prometheus.yml`, `observability/docker-compose.observability.yml` (Prometheus + Grafana + OTel Collector), `observability/otel-collector.yml`, `observability/grafana-dashboard.json` (request rate, p95 latency, error rate, active handles panels)
  - Does **not** overwrite `app.ts`/`main.py` — overlay is additive, safe to combine with oauth/api-docs
  - Deps injected: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`, `prom-client` (Node); `opentelemetry-sdk`, `opentelemetry-instrumentation-fastapi`, `opentelemetry-exporter-otlp-proto-http`, `prometheus-fastapi-instrumentator`, `structlog` (Python)
- **`--sentry` sub-flag** — pair with `--observability` to inject `@sentry/node` / `sentry-sdk[fastapi]` into the project manifest; also supported via `archgen add observability --sentry`
- **`--pre-commit` addon (Python only)** — git hook suite matching Node.js `--husky`:
  - `.pre-commit-config.yaml` with `ruff` (lint + format), `ruff-format`, `black`, `mypy`, trailing-whitespace, end-of-file-fixer
  - Injects `pre-commit>=3.7.0` into `[project.optional-dependencies] dev`
  - Next steps printed: `pre-commit install`
- **`archgen add observability --sentry`** — `AddAddonOptions` now accepts `sentry?: boolean` so Sentry dep injection works for post-scaffold addon injection too
- **Improved test quality in generated projects**:
  - Node.js testing addon: fixed import path bug (`../../../base/src/app` → `../src/app`); added `tests/users.test.ts` (401/200/404 flow with auth); `jest.config.js` overlay with `coverageThreshold: 80%`
  - Python testing addon: `conftest.py` now overrides `get_db` dependency → SQLite in-memory isolation; added `tests/test_auth.py` (register/login/401 flows) and `tests/test_users.py` (CRUD + auth guard); `pytest.ini` overlay with `--cov-fail-under=80`; `aiosqlite>=0.20.0` injected into dev deps automatically

### Fixed
- **Python testing addon** — `aiosqlite` (required by `sqlite+aiosqlite:///:memory:` in conftest) now injected into `[project.optional-dependencies] dev` when `--testing` is enabled
- **Python dep injection** — new `_injectPyprojectDeps(deps[])` batch helper replaces single-dep injection; new `_injectPyprojectDevDeps(deps[])` targets `[project.optional-dependencies] dev` array for dev-only packages
- **`archgen add` argument description** — removed stale `(docker|testing|ci|husky)` hint; now points to `archgen list`

### Tests
- **New unit test file** `observability-addon.test.ts` — 18 tests covering Node and Python observability wiring, pre-commit overlay, sentry flag, aiosqlite injection, dry-run guards, and no-app.ts-overwrite assertion
- Total: **160 unit tests** (up from 142)

## [1.1.0] - 2026-06-02

### Added
- **Python parity — 5 new Python addons** bringing Python to feature parity with Node.js:
  - `--email` — SMTP email service via built-in `smtplib`; `app/core/email.py` + `app/services/external/email_service.py` with `send`, `send_welcome`, `send_password_reset`, `send_notification`
  - `--s3` — AWS S3 / Cloudflare R2 / MinIO storage via `boto3`; `app/core/storage.py` + `app/services/external/storage_service.py` with `upload`, `get_presigned_url`, `delete`, `exists`; injects `boto3>=1.35.0` into `pyproject.toml`
  - `--oauth` — Google + GitHub OAuth2 via `httpx` (already in base deps); `app/core/oauth.py`, `app/services/oauth_service.py`, `app/routes/api/v1/oauth.py`; routes at `/api/v1/oauth/google` and `/api/v1/oauth/github`
  - `--api-docs` — Custom OpenAPI schema with rich description + tag metadata; `app/core/openapi.py` + `main.py` override; Swagger UI at `/docs`, ReDoc at `/redoc`
  - `--websocket` — Native FastAPI WebSocket with JWT auth; `app/routes/ws/notifications.py` + `app/services/notification_service.py` (`NotificationManager` with `send_to_user`, `broadcast`)
- **Queue addons** — background job processing for both stacks:
  - **Node.js `--queue`** — BullMQ + Redis: `src/plugins/queue.plugin.ts` (queue registry), `src/services/queue.service.ts` (wrapper with retry logic), `src/workers/example.worker.ts`; injects `bullmq>=5.0.0`
  - **Python `--queue`** — arq + Redis (Redis already in base stack): `app/services/queue_service.py` (pool + `enqueue()` helper), `app/workers/example_worker.py` (`WorkerSettings` for arq CLI); injects `arq>=0.26.0`
- **`archgen config` command** — preset management via `.archgenrc.json`:
  - `archgen config init` — interactive wizard to create `.archgenrc.json` with default language, author, docker/testing/ci preferences
  - `archgen config show` — display active preset (searches upward from cwd)
  - `archgen config reset` — delete `.archgenrc.json` from cwd
  - `archgen create` now auto-loads preset; CLI flags always take priority
- **Interactive addon discovery** — `archgen create` interactive mode now shows a multiselect for all extra addons (websocket, oauth, api-docs, email, s3, queue) so users can discover and enable them without memorising flags
- **`--queue` flag** — new global flag for both Node and Python

### Fixed
- CLI flag descriptions updated: removed stale "Node.js only" labels from `--websocket`, `--oauth`, `--api-docs`, `--email`, `--s3` which now also work for Python

### Tests
- **17 new unit tests** in `python-plugin.test.ts` covering all 5 new Python addons (metadata + apply/skip logic)
- Total: **142 unit tests** (up from 125)

## [1.0.8] - 2026-05-14

### Added
- **Email addon** (`--email`) — injects `nodemailer` into Node.js projects: `src/config/email.ts` (Zod-validated SMTP env), `src/plugins/email.plugin.ts` (Fastify decorator), `src/modules/email/` with `EmailService` (`send`, `sendWelcome`, `sendPasswordReset`, `sendNotification`), `.env.example` overlay with `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`
- **S3 addon** (`--s3`) — injects `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` into Node.js projects: `src/config/storage.ts` (Zod-validated env with optional `S3_ENDPOINT` for R2/MinIO), `src/plugins/storage.plugin.ts` (Fastify decorator), `src/modules/storage/` with `StorageService` (`upload`, `getPresignedUrl`, `delete`, `exists`)
- **`archgen upgrade`** command — re-applies all addons from `.archgen-meta.json` using the latest templates; updates meta version to current CLI version; supports `--dry-run`
- **ora spinner** — animated spinner during `archgen create` for better UX; respects `--quiet` and `--verbose` flags
- **Integration tests** — `tests/integration/email-smtp.test.ts` (real Gmail SMTP) and `tests/integration/s3.test.ts` (real AWS S3); both skip gracefully via `describe.skipIf()` when env vars are absent
- **Unit tests** — `tests/unit/email-s3-addon.test.ts` (33 tests: addon entries + dep injection for email/s3) and `tests/unit/upgrader.test.ts` (14 tests: readMeta + upgrade behavior)

## [1.0.7] - 2026-04-23

### Added
- **Claude Code addon** (`--claude-code`) — injects `CLAUDE.md` (project context with stack, commands, architecture) and `.claude/skills/` with pre-configured skills into generated projects: `backend-patterns`, `api-design`, `database-migrations`, `docker-patterns`, `security-review`, `tdd-workflow`, `deployment-patterns` (Node.js); `python-patterns`, `python-testing`, `backend-patterns`, `postgres-patterns`, `database-migrations`, `docker-patterns`, `security-review` (Python)
- **Cursor addon** (`--cursor`) — injects `.cursor/skills/` with the same skill set (same content, `skill.md` format) for Cursor Agent
- **AI agent multi-select prompt** — when neither `--claude-code` nor `--cursor` is passed, interactive mode shows a multiselect: `Claude Code` and `Cursor` can be selected independently or together
- Both addons work with `archgen add claude-code` and `archgen add cursor` on existing projects

### Fixed
- Integration snapshot tests: `mockFs.exists` now returns `true` for template/addon paths so addon conditions are correctly evaluated in test environment

## [1.0.6] - 2026-04-10

### Fixed
- **WebSocket addon**: Socket.io now uses `transports: ['websocket']` to avoid conflict with Fastify's HTTP router (polling transport was returning 404)
- **OAuth2 addon**: Updated `generateAuthorizationUri` calls to `@fastify/oauth2` v8 API — now requires `(request, reply)` instead of `({ state })`
- **OAuth2 addon**: Added `@fastify/cookie` as required dependency for `@fastify/oauth2` v8 state cookie management
- **OAuth2 addon**: Added `src/app.ts` overlay — cookie, googleOAuth2, githubOAuth2, and oauthRoutes are now auto-registered; no manual integration needed
- **`archgen add`**: Overrode `applyAddon()` in `NodePlugin` to merge addon-specific dependencies into `package.json` (previously only `generate()` did this)

## [1.0.5] - 2026-04-10

### Added
- **WebSocket addon** (`--websocket`) — injects Socket.io into Node.js projects: `src/plugins/socket.plugin.ts` with JWT auth middleware, personal rooms per user; `src/modules/notification/` with `sendToUser()`, `broadcast()`, `sendToRoom()` helpers
- **OAuth2 addon** (`--oauth`) — injects `@fastify/oauth2` with Google + GitHub providers: `src/modules/oauth/` (routes, service, schema), `src/config/oauth.ts` (Zod-validated env), `.env.example` overlay with `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, `APP_URL`
- **API Docs addon** (`--api-docs`) — injects `@scalar/fastify-api-reference` Scalar UI at `/reference` and Swagger UI at `/docs`: `src/plugins/docs.plugin.ts`
- **Update notifier** — passive check on every command; shows upgrade hint if a newer version exists on npm (24h cache, 3s timeout, silent on error)

### Changed
- `NodePlugin.generate()` now merges addon dependencies programmatically into `package.json` after template overlay — prevents last addon from overwriting earlier addon deps

## [1.0.4] - 2026-04-01

### Added
- **`BasePlugin` abstract class** (`core/base-plugin.ts`) — shared `generate()` and `applyAddon()` logic extracted from Node/Python plugins; plugins now only define variables, template paths, and addon entries
- **`ArchGenError` class** (`core/errors.ts`) — typed errors with `.code` field; `ArchGen.create()` and `ArchGen.addAddon()` now throw instead of calling `process.exit()`
- **`--output <dir>` flag** — create projects outside the current directory: `archgen create my-app --output /tmp/projects`
- **`--quiet` flag** — suppress all output except errors
- **`--verbose` flag** — show debug-level output
- **Colored dry-run output** for `archgen add --dry-run` — green `[new]` / yellow `[overwrite]` per file
- **`archgen completion [bash|zsh|fish]`** — print shell completion script: `source <(archgen completion bash)`
- **Husky + lint-staged addon** (`--husky`) for Node.js — generates `.husky/pre-commit` and `lint-staged.config.mjs`
- **Python SQLite support** (`--database sqlite`) — overlay with `aiosqlite` driver, SQLite-configured `database.py`, `config.py`, `.env.example`, `pyproject.toml`
- **`.archgen-meta.json`** written to generated project root with `{ version, language, addons, database, generatedAt, projectName }`
- **Plugin unit tests** — `tests/unit/node-plugin.test.ts` and `tests/unit/python-plugin.test.ts` (26 tests total)
- **E2E snapshot tests** — `tests/integration/snapshot.test.ts` captures template call paths for regression detection
- Logger now supports `setLevel("quiet" | "normal" | "verbose")` — `debug()` gated behind verbose mode

### Changed
- `process.exit()` removed from `core/archgen.ts` — CLI layer now handles exit codes; `ArchGen` is safe to use as a library
- `NodePlugin` and `PythonPlugin` now extend `BasePlugin` with no duplicated logic
- Database prompt in interactive mode now supports both Node.js (mysql/postgresql) and Python (postgresql/sqlite)
- `--database` validation is now language-aware in `cli/command/index.ts`
- `archgen add` argument hint updated to include `husky`
- Python `StackInfo.database` updated to reflect SQLite support

### Fixed
- `archgen add --dry-run` now shows whether each file is new or would overwrite an existing file

## [1.0.3] - 2026-03-27

### Added
- **`archgen add <addon>`** — inject addons (docker/testing/ci) into an existing project without regenerating
- **`archgen info <language>`** — display full stack details (runtime, framework, ORM, cache, auth, validation, testing)
- **`archgen doctor`** — check that required tools (Node, npm, git, Docker, Python) are installed
- **`--ci` flag** — include GitHub Actions CI workflow at creation time
- **`--skip-git` flag** — skip automatic `git init` after project generation
- **`--all` flag** — shorthand for `--docker --testing --ci`
- **`--database` validation** — error immediately on invalid value instead of silent fallback
- **CI addon** for Node.js: `.github/workflows/ci.yml` with MariaDB + Redis services, Node 18.x/20.x matrix
- **CI addon** for Python: `.github/workflows/ci.yml` with PostgreSQL + Redis services, Python 3.11/3.12 matrix
- **ESLint v9 flat config** (`eslint.config.mjs`) replaces deprecated `.eslintrc.json` in Node template
- **`.editorconfig`** added to both Node.js and Python generated templates
- **`postinstall: prisma generate`** in Node template — Prisma client generated automatically after `npm install`
- Expanded test suite: 42+ unit tests, integration tests, Docker integration test
- `pnpm test:integration` and `pnpm test:docker` scripts for separate test runs

### Fixed
- Docker template: `JWT_SECRET` missing from `docker-compose.yml` environment (caused immediate crash on `docker-compose up`)
- Docker template: no `restart: on-failure` on app service (permanent crash if MariaDB not ready)
- Docker template: `npm ci` → `npm install` in Dockerfile (new projects have no `package-lock.json`)
- Database prompt now correctly hidden when user selects Python (was always shown regardless of language)
- `console.log` in `cli/prompts.ts` replaced with `logger` (convention consistency)

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
