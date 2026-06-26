import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_create_and_get_passport(client: AsyncClient) -> None:
    payload = {
        "skill_category": "Engineering",
        "skill_name": "Solidity Smart Contracts",
        "evidence_url": "https://github.com/example/repo",
        "evidence_description": "Audited 3 production DeFi protocols.",
    }
    create = await client.post("/api/v1/passports", json=payload)
    assert create.status_code == 201
    passport_id = create.json()["data"]["id"]
    assert create.json()["data"]["status"] == "pending"

    get_one = await client.get(f"/api/v1/passports/{passport_id}")
    assert get_one.status_code == 200

    listing = await client.get("/api/v1/passports")
    assert listing.status_code == 200
    assert listing.json()["meta"]["total"] >= 1


@pytest.mark.asyncio
async def test_passports_require_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/passports")
    assert response.status_code == 401
