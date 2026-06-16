import pytest
from httpx import AsyncClient

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"

TEST_EMAIL = "auth@testexample.com"
TEST_PASSWORD = "SecurePass123!"
TEST_USERNAME = "authtestuser"


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post(
        REGISTER_URL,
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "username": TEST_USERNAME},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD, "username": "another"}
    await client.post(REGISTER_URL, json=payload)
    response = await client.post(REGISTER_URL, json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        REGISTER_URL,
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "username": TEST_USERNAME},
    )
    response = await client.post(
        LOGIN_URL,
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    response = await client.post(
        LOGIN_URL,
        json={"email": TEST_EMAIL, "password": "WrongPassword!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    response = await client.post(
        LOGIN_URL,
        json={"email": "nobody@example.com", "password": TEST_PASSWORD},
    )
    assert response.status_code == 401
