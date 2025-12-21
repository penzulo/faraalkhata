import asyncio
from collections.abc import AsyncGenerator

import pytest

# from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///test.db"

engine = create_async_engine(
    TEST_DATABASE_URL, poolclass=NullPool, connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)


@pytest.fixture(scope="session")
def event_loop():
    """
    Create an instance of the default event loop for each test case.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession, None]:
    """
    Creates a fresh database for every test function.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# @pytest.fixture(scope="function")
# async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
#     async def override_get_db():
#         yield session

#     app.dependency_overrides[get_db] = override_get_db

#     async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as c:
#         yield c

#     app.dependency_overrides.clear()
