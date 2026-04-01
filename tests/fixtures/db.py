from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.base import Base

engine = create_async_engine(
    "sqlite+aiosqlite:///test.db",
    poolclass=NullPool,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)


@pytest.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
