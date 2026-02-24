# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Features

- ✅ FastAPI with async/await
- ✅ SQLAlchemy 2.0 with async support
- ✅ Pydantic v2 for validation
- ✅ Redis for caching
- ✅ Background schedulers (APScheduler)
- ✅ Comprehensive middleware (auth, logging, rate limiting, error handling)
- ✅ Database migrations (Alembic)
- ✅ Docker & Docker Compose
- ✅ Testing with pytest
- ✅ Code formatting (Black, Ruff)

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone repository:
```bash
git clone <repository-url>
cd {{PROJECT_NAME}}
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -e .
```

4. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations:
```bash
alembic upgrade head
```

6. Start server:
```bash
uvicorn main:app --reload
```

### Docker Setup
```bash
docker-compose up -d
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure
```
{{PROJECT_NAME}}/
├── app/
│   ├── core/          # Core configuration
│   ├── models/        # Database models
│   ├── routes/        # API endpoints
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   ├── middleware/    # Request/response middleware
│   ├── schedulers/    # Background jobs
│   └── utils/         # Utilities
├── migrations/        # Database migrations
├── tests/            # Test suite
└── main.py           # Application entry
```

## Testing
```bash
pytest
pytest --cov=app  # With coverage
```

## License

MIT

## Author

{{AUTHOR}}
