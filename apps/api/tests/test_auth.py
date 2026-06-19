import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_auth_nonce_invalid_wallet() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/auth/nonce?wallet=invalid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_auth_nonce_valid_format() -> None:
    transport = ASGITransport(app=app)
    wallet = "0x1234567890123456789012345678901234567890"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(f"/api/v1/auth/nonce?wallet={wallet}")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["nonce"]
    assert "NEXUS AI" in body["data"]["message"]
