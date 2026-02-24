import asyncio
import email

from app.core.database import async_session_maker, init_db
from app.models.user import User
from app.utils.security import hash_password


async def create_sample_data():
    async with async_session_maker() as session:
        admin = User(
            email="admin@example.com",
            username="admin",
            hashed_password=hash_password("admin123"),
            is_active=True
        )

        session.add(admin)
        await session.commit()
        print("Sample data created successfully")

async def main():
    """Main function"""
    await init_db()
    print("Database initialized successfully")
    await create_sample_data()

if __name__ == "__main__":
    asyncio.run(main())
