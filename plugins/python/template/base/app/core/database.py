
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
      settings.DATABASE_URL,
      pool_pre_ping=True,
      pool_size=20,
      max_overflow=10,
      pool_timeout=30,
      pool_recycle=3600,
      echo=False,
      connect_args={
          "keepalives": 1,
          "keepalives_idle": 30,
          "keepalives_interval": 10,
          "keepalives_count": 5,
      },
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
