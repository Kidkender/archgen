import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint"""
    response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Service is healthy"


@pytest.mark.asyncio
async def test_liveness_check(client: AsyncClient):
    """Test liveness check endpoint"""
    response = await client.get("/health/live")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
