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
async def test_mint_passport_creates_nft_record(client: AsyncClient) -> None:
    payload = {
        "skill_category": "Engineering",
        "skill_name": "Solidity Smart Contracts",
        "evidence_url": "https://github.com/example/repo",
        "evidence_description": "Audited 3 production DeFi protocols.",
    }
    create = await client.post("/api/v1/passports", json=payload)
    passport_id = create.json()["data"]["id"]

    mint = await client.post(f"/api/v1/passports/{passport_id}/mint")
    assert mint.status_code == 200
    body = mint.json()["data"]
    assert body["status"] == "minted"
    assert body["nft_record"] is not None
    assert body["nft_record"]["contract_address"]
    assert body["ipfs_metadata_uri"] is not None


@pytest.mark.asyncio
async def test_mint_rejects_invalid_wallet_address(client: AsyncClient) -> None:
    payload = {
        "skill_category": "Engineering",
        "skill_name": "Solidity Smart Contracts",
        "evidence_url": "https://github.com/example/repo",
        "evidence_description": "Audited 3 production DeFi protocols.",
    }
    create = await client.post("/api/v1/passports", json=payload)
    passport_id = create.json()["data"]["id"]

    mint = await client.post(
        f"/api/v1/passports/{passport_id}/mint",
        json={"wallet_address": "not-a-wallet"},
    )
    assert mint.status_code == 422


@pytest.mark.asyncio
async def test_verify_and_history_endpoints(client: AsyncClient) -> None:
    create = await client.post(
        "/api/v1/passports",
        json={
            "skill_category": "Engineering",
            "skill_name": "Hardhat Security",
            "evidence_url": "https://github.com/example/hardhat",
            "evidence_description": "Built secure deployment workflow.",
        },
    )
    passport_id = create.json()["data"]["id"]

    verify = await client.post(
        "/api/v1/passports/verify",
        json={
            "passport_id": passport_id,
            "evaluation_score": 91,
            "evaluation_notes": "Excellent implementation",
            "status": "approved",
        },
    )
    assert verify.status_code == 200
    assert verify.json()["data"]["status"] == "approved"
    assert verify.json()["data"]["evaluation_score"] == "91.00"

    history = await client.get("/api/v1/passports/history")
    assert history.status_code == 200
    assert history.json()["meta"]["total"] >= 1

    reputation = await client.get("/api/v1/passports/reputation")
    assert reputation.status_code == 200
    assert reputation.json()["data"]["score"] >= 90


@pytest.mark.asyncio
async def test_passports_require_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/passports")
    assert response.status_code == 401
