import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

SAMPLE_CONTRACT = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
}
"""


@pytest.mark.asyncio
async def test_submit_and_list_audits(client: AsyncClient) -> None:
    submit = await client.post(
        "/api/v1/audits/submit",
        json={"contract_name": "Vault", "source_code": SAMPLE_CONTRACT},
    )
    assert submit.status_code == 201
    audit_id = submit.json()["data"]["id"]
    assert submit.json()["data"]["status"] == "queued"
    assert submit.json()["data"]["source_hash"]

    get_one = await client.get(f"/api/v1/audits/{audit_id}")
    assert get_one.status_code == 200

    report = await client.get(f"/api/v1/audits/{audit_id}/report")
    assert report.status_code == 200

    listing = await client.get("/api/v1/audits")
    assert listing.status_code == 200
    assert listing.json()["meta"]["total"] >= 1


@pytest.mark.asyncio
async def test_audits_require_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/audits/submit",
            json={"source_code": "contract X {}"},
        )
    assert response.status_code == 401
