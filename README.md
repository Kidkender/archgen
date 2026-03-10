# archgen

> A CLI tool that generates production-ready backend projects in seconds — so you can focus on building, not configuring.

---

## Quick Start

```bash
npm install -g archgen

archgen create my-app
```

Answer a few prompts. Your project is ready in under a second.

---

## Example Output

```
$ archgen create my-app

✔ Select a language  › Node.js (TypeScript + Fastify)
✔ Include Docker setup? › yes
✔ Include testing setup? › yes

⠸ Generating my-app...
✔ Done in 0.18s

┌────────────────────────────────────────────────────┐
│  🎉 Project created successfully!                  │
├────────────────────────────────────────────────────┤
│  Project      my-app                               │
│  Language     Node.js (TypeScript + Fastify)       │
│  Docker       yes                                  │
│  Testing      yes                                  │
│  Time         0.18s                                │
├────────────────────────────────────────────────────┤
│  Next steps:                                       │
│  $ cd my-app                                       │
│  $ npm install                                     │
│  $ cp .env.example .env                            │
│  $ docker-compose up -d                            │
└────────────────────────────────────────────────────┘
```

---

## The Problem

Every new project starts the same way — folder structure, TypeScript config, linting, logging, auth middleware, database setup, Docker...

That's **20–60 minutes of repetitive work** before you write a single line of business logic.

**archgen eliminates that entirely.**

---

## Features

- ⚡ Generates a complete backend project in under 1 second
- 🧱 Opinionated architecture — clean, consistent, maintainable
- 🔐 Built-in authentication, logging, error handling, and validation
- 🌐 Multi-language support — Node.js and Python
- 🐳 Optional Docker + docker-compose setup
- 🧪 Optional testing setup with example test files
- 💬 Interactive CLI prompts — no flags required

---

## Supported Stacks

Generated projects can be either a **Node.js** or **Python** backend — each with a fully wired architecture ready to run.

| Language | Stack |
|----------|-------|
| Node.js  | TypeScript · Fastify · Prisma · Redis · JWT · Zod · Pino · Swagger |
| Python   | FastAPI · SQLAlchemy 2.0 · Alembic · Redis · Pydantic v2 · APScheduler |

### Generated Project Structure

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
└── pyproject.toml
```

---

## Usage

```bash
# Interactive mode — recommended
archgen create my-app

# With flags
archgen create my-app --language node --docker --testing
archgen create my-api --language python --docker
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-l, --language` | `node` or `python` | prompt |
| `--docker` | Include Dockerfile + docker-compose | `false` |
| `--testing` | Include testing setup | `false` |
| `-a, --author` | Author name | `Your Name` |
| `-d, --description` | Project description | — |

---

## Philosophy

archgen is intentionally **opinionated**.

Instead of offering dozens of configuration options, it provides a carefully designed architecture that works well for most backend services out of the box. No plugin system, no template marketplace — just a well-structured project that's ready to ship.

---

## Requirements

- Node.js >= 18

---

## License

ISC © [Kidkender](https://github.com/kidkender)
