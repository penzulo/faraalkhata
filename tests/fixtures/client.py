from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.main import app


@pytest.fixture(scope="function")
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
