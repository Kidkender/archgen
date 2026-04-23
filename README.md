# archgen

> A CLI tool that generates production-ready backend projects in seconds — so you can focus on building, not configuring.

---

## Quick Start

```bash
npm install -g @kidkender/archgen

archgen create my-app
```

Answer a few prompts. Your project is ready in under a second.

---

## Features

- Generate a complete backend project in under 1 second
- Opinionated architecture — clean, consistent, maintainable
- Built-in authentication, logging, error handling, and validation
- Multi-language support — Node.js and Python
- Optional Docker + docker-compose setup
- Optional testing setup with example test files
- Optional GitHub Actions CI workflow
- Optional WebSocket support with Socket.io + JWT auth
- Optional OAuth2 (Google + GitHub) via `@fastify/oauth2`
- Optional API documentation via Scalar + Swagger UI
- Optional Claude Code setup — `CLAUDE.md` + pre-configured skills for Claude Code agent
- Optional Cursor setup — `.cursor/skills/` with pre-configured skills for Cursor agent
- Auto update notifier — hints when a new version is available
- Interactive CLI prompts — no flags required
- Post-scaffold addon injection with `archgen add`

---

## Supported Stacks

| Language | Stack |
|----------|-------|
| Node.js  | TypeScript · Fastify · Prisma · MariaDB/MySQL · Redis · JWT · Zod · Pino · Swagger |
| Python   | FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL · Redis · Pydantic v2 · APScheduler |

---

## Usage

### Interactive mode (recommended)

```bash
archgen create my-app
```

### With flags

```bash
archgen create my-api --language node --docker --testing --ci
archgen create my-api --language node --all           # enable all addons at once
archgen create my-service --language python --author "John Doe"
archgen create my-app --database postgresql
archgen create my-app --claude-code                   # add Claude Code setup (CLAUDE.md + skills)
archgen create my-app --cursor                        # add Cursor agent setup (.cursor/skills/)
archgen create my-app --claude-code --cursor          # add both AI agent setups
archgen create my-app --force                         # overwrite existing directory
archgen create my-app --dry-run                       # preview files without writing
archgen create my-app --skip-git                      # skip automatic git init
```

### Inject addons into an existing project

```bash
cd my-existing-project
archgen add docker
archgen add testing
archgen add ci
archgen add websocket       # Socket.io + JWT auth + notification helpers
archgen add oauth           # Google + GitHub OAuth2 routes
archgen add api-docs        # Scalar UI at /reference + Swagger UI at /docs
archgen add claude-code     # Claude Code setup (CLAUDE.md + .claude/skills/)
archgen add cursor          # Cursor agent setup (.cursor/skills/)
archgen add ci --dry-run    # preview changes without writing
```

### Other commands

```bash
archgen list                # list available languages and addons
archgen info node           # show full stack details for a language
archgen doctor              # check that required tools are installed
```

---

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-l, --language` | `node` or `python` | prompt |
| `--database` | `mysql` or `postgresql` (Node.js only) | prompt |
| `--docker` | Include Dockerfile + docker-compose | `false` |
| `--testing` | Include testing setup | `false` |
| `--ci` | Include GitHub Actions CI workflow | `false` |
| `--all` | Enable docker + testing + ci at once | `false` |
| `--websocket` | Include Socket.io WebSocket support | `false` |
| `--oauth` | Include Google + GitHub OAuth2 | `false` |
| `--api-docs` | Include Scalar + Swagger API docs | `false` |
| `-a, --author` | Author name | `Your Name` |
| `-d, --description` | Project description | — |
| `--force` | Overwrite existing directory | `false` |
| `--dry-run` | Preview files without writing | `false` |
| `--skip-git` | Skip automatic git init | `false` |

---

## Generated Project Structure

**Node.js**
```
my-app/
├── src/
│   ├── config/        # env, database, redis, logger
│   ├── middleware/    # auth, error handling, rate limiting
│   ├── modules/       # auth, users, health — ready to extend
│   ├── shared/        # utils, cache, exceptions, types
│   └── jobs/          # background job scheduler
├── prisma/
├── tests/
├── .env.example
├── .editorconfig
└── package.json
```

**Python**
```
my-api/
├── app/
│   ├── core/          # config, database, redis, logging
│   ├── middleware/    # auth, error, logging, rate limiting
│   ├── schedulers/    # background jobs with APScheduler
│   ├── schemas/       # Pydantic request/response models
│   └── routes/        # API routers
├── migrations/
├── tests/
├── .env.example
├── .editorconfig
└── pyproject.toml
```

---

## Requirements

- Node.js >= 18
- git (optional — for auto `git init`)
- Docker (optional — for `--docker` addon)

---

## License

ISC © [Kidkender](https://github.com/kidkender)
