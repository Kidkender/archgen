# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Features

- ✅ Fastify - Fast and low overhead web framework
- ✅ TypeScript - Type safety
- ✅ Prisma - Modern ORM with type safety
- ✅ Zod - Schema validation
- ✅ Pino - High-performance logging
- ✅ Redis - Caching and rate limiting
- ✅ JWT Authentication
- ✅ Docker & Docker Compose
- ✅ Testing with Jest
- ✅ API Documentation (Swagger)

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL 8+ / MariaDB 11+
- Redis 7+ (optional)

### Installation

1. Clone repository:
```bash
git clone <repository-url>
cd {{PROJECT_NAME}}
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate
```

6. Start development server:
```bash
npm run dev
```

### Docker Setup
```bash
docker-compose up -d
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:3000/docs

## Project Structure
```
{{PROJECT_NAME}}/
├── src/
│   ├── config/          # Configuration (env, database, redis, logger)
│   ├── middleware/      # Middleware (auth, error, logger, rate-limit, validation)
│   ├── modules/         # Feature modules
│   │   ├── users/       # User module
│   │   ├── auth/        # Authentication module
│   │   └── health/      # Health check module
│   ├── constants/       # Constants
│   ├── app.ts          # Fastify app setup
│   ├── routes.ts       # Route aggregator
│   └── index.ts        # Application entry point
├── prisma/             # Database schema and migrations
├── tests/              # Test files
└── docker-compose.yml  # Docker services
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

### Health
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (checks dependencies)
- `GET /health/live` - Liveness check

### Auth
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Users
- `GET /api/v1/users` - List users (requires auth)
- `GET /api/v1/users/:id` - Get user by ID (requires auth)
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id` - Update user (requires auth)
- `DELETE /api/v1/users/:id` - Delete user (requires auth)

## Environment Variables

See `.env.example` for all available environment variables.

## Testing
```bash
npm test
npm run test:watch
```

## License

MIT

## Author

{{AUTHOR}}
