import pytest
from httpx import AsyncClient

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
USERS_URL = "/api/v1/users"


async def _get_token(client: AsyncClient, email: str, password: str, username: str) -> str:
    await client.post(REGISTER_URL, json={"email": email, "password": password, "username": username})
    res = await client.post(LOGIN_URL, json={"email": email, "password": password})
    return res.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_list_users_unauthenticated(client: AsyncClient):
    response = await client.get(USERS_URL)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_users_authenticated(client: AsyncClient):
    token = await _get_token(client, "userslist@example.com", "Pass1234!", "userslistuser")
    response = await client.get(USERS_URL, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    token = await _get_token(client, "usersget@example.com", "Pass1234!", "usersgetuser")
    response = await client.get(f"{USERS_URL}/99999", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient):
    token = await _get_token(client, "userme@example.com", "Pass1234!", "usermeuser")
    response = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code in (200, 404)
