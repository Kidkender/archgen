# {{PROJECT_NAME}}

## Stack
- Runtime: Node.js 18+ (TypeScript)
- Framework: Fastify v5
- ORM: Prisma v7
- Database: MariaDB / MySQL or PostgreSQL
- Cache: Redis 7 (ioredis)
- Auth: JWT (jsonwebtoken)
- Validation: Zod v4

## Common Commands
```bash
npm run dev                              # start dev server (watch mode)
npm run build                            # compile to dist/
npm test                                 # run Jest tests
npx prisma migrate dev --name <name>     # create and run migration
npx prisma studio                        # open Prisma GUI
npx prisma generate                      # regenerate client after schema change
```

## Architecture
```
src/
├── modules/         # feature modules — each has controller, service, routes, schema
├── plugins/         # Fastify plugins (prisma, redis, response)
├── middleware/       # auth, validation, rate-limit, error, logger
├── shared/          # utils, cache service, interfaces, types
├── config/          # env config validated by Zod
├── constants/       # error codes, regex
└── jobs/            # cron jobs (APScheduler-style via node-cron)
```

## Module convention
Each feature module follows:
```
src/modules/<name>/
├── <name>.controller.ts   # request handlers
├── <name>.service.ts      # business logic
├── <name>.routes.ts       # route registration
└── <name>.schema.ts       # Zod schemas + TypeScript types
```

## Available Skills
Use these skills when working on this project:

| Skill | When to use |
|-------|-------------|
| `/backend-patterns` | Fastify conventions, plugin patterns, module structure |
| `/api-design` | REST API design, response format, status codes |
| `/database-migrations` | Prisma schema changes, migration workflow |
| `/docker-patterns` | Docker & docker-compose setup |
| `/security-review` | Auth, JWT, input validation, OWASP checks |
| `/tdd-workflow` | Jest TDD approach, test structure |
| `/deployment-patterns` | CI/CD, environment config, production readiness |

## Author
{{AUTHOR}}
