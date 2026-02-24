import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from main import app

TEST_DATABASE_URL =  "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def db_session():
    """Create test database session"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client():
    """Create test client"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client
