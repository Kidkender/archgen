# {{PROJECT_NAME}}

## Stack
- Runtime: Python 3.11+
- Framework: FastAPI
- ORM: SQLAlchemy 2.0 + Alembic
- Database: PostgreSQL (default) or SQLite
- Cache: Redis 7 (redis-py)
- Auth: PyJWT + passlib[bcrypt]
- Validation: Pydantic v2

## Common Commands
```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -e .
cp .env.example .env

uvicorn main:app --reload         # start dev server
alembic upgrade head              # run migrations
alembic revision --autogenerate -m "<name>"  # create migration
pytest                            # run tests
pytest --cov=app --cov-report=term-missing   # with coverage
ruff check . && ruff format .     # lint + format
```

## Architecture
```
app/
├── api/             # route handlers (FastAPI routers)
├── core/            # config, security, dependencies
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas (request/response)
├── services/        # business logic
├── repositories/    # database access layer
└── jobs/            # scheduled tasks (APScheduler)
alembic/             # migration files
tests/               # pytest test suite
```

## Module convention
Each feature follows:
```
app/
├── api/<name>.py          # FastAPI router + handlers
├── models/<name>.py       # SQLAlchemy model
├── schemas/<name>.py      # Pydantic request/response schemas
├── services/<name>.py     # business logic
└── repositories/<name>.py # DB queries
```

## Available Skills
Use these skills when working on this project:

| Skill | When to use |
|-------|-------------|
| `/python-patterns` | FastAPI conventions, Pythonic idioms, type hints |
| `/python-testing` | pytest setup, fixtures, async testing |
| `/backend-patterns` | API conventions, service layer, repository pattern |
| `/postgres-patterns` | SQLAlchemy queries, indexes, transactions |
| `/database-migrations` | Alembic migration workflow |
| `/docker-patterns` | Docker & docker-compose setup |
| `/security-review` | Auth, JWT, input validation, OWASP checks |

## Author
{{AUTHOR}}
