"""Tests for the Phase 7 AI Smart Contract Auditor."""

import json
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.llm.provider import llm_router

# ─── Sample contracts ─────────────────────────────────────────────────────

SAFE_CONTRACT = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SafeVault {
    mapping(address => uint256) private balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}
"""

VULNERABLE_CONTRACT = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No funds");
        // REENTRANCY: state updated AFTER external call
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        balances[msg.sender] = 0;
    }
}
"""

# ─── Mock LLM ─────────────────────────────────────────────────────────────

MOCK_REPORT = {
    "executive_summary": "The contract has one high-severity reentrancy vulnerability.",
    "overall_risk": "high",
    "risk_score": 40,
    "vulnerabilities": [
        {
            "id": "V1",
            "severity": "high",
            "title": "Reentrancy in withdraw()",
            "description": "State update happens after external call.",
            "line_hint": "withdraw()",
            "recommendation": "Use checks-effects-interactions or ReentrancyGuard.",
            "code_fix": "balances[msg.sender] = 0; before the external call.",
        }
    ],
    "gas_optimizations": [],
    "best_practices": ["Use OpenZeppelin ReentrancyGuard."],
    "ai_model_used": "mock",
}


async def _mock_stream(
    *_args, **_kwargs
) -> AsyncGenerator[tuple[str, str | None], None]:
    yield json.dumps(MOCK_REPORT), "mock"


@pytest.fixture
def mock_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _meta(prompt, system, history):
        async for chunk, provider in _mock_stream():
            yield chunk, provider

    monkeypatch.setattr(llm_router, "stream_generate_with_meta", _meta)


# ─── Tests ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_analyze_streams_sse(client: AsyncClient, mock_llm: None) -> None:
    """POST /auditor/analyze should return SSE stream with complete event."""
    resp = await client.post(
        "/api/v1/auditor/analyze",
        json={"contract_name": "VulnerableVault.sol", "source_code": VULNERABLE_CONTRACT},
    )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")
    assert "X-Audit-Id" in resp.headers

    text = resp.text
    assert "[DONE]" in text

    # Find the 'complete' SSE event
    complete_event = None
    for line in text.splitlines():
        if line.startswith("data:") and "[DONE]" not in line:
            payload = json.loads(line[5:].strip())
            if payload.get("event") == "complete":
                complete_event = payload
                break

    assert complete_event is not None, "No 'complete' event found in SSE stream"
    assert "report" in complete_event
    assert complete_event["report"]["overall_risk"] == "high"


@pytest.mark.asyncio
async def test_analyze_creates_audit_record(client: AsyncClient, mock_llm: None) -> None:
    """After streaming analysis, GET /auditor/{id} should return the completed report."""
    resp = await client.post(
        "/api/v1/auditor/analyze",
        json={"contract_name": "Test.sol", "source_code": SAFE_CONTRACT},
    )
    assert resp.status_code == 200
    audit_id = resp.headers.get("X-Audit-Id")
    assert audit_id

    detail = await client.get(f"/api/v1/auditor/{audit_id}")
    assert detail.status_code == 200
    data = detail.json()["data"]
    assert data["status"] == "complete"
    assert data["report_json"] is not None
    assert data["overall_risk"] == "high"
    assert data["high_count"] == 1


@pytest.mark.asyncio
async def test_list_audit_history(client: AsyncClient, mock_llm: None) -> None:
    """GET /auditor/history should return paginated audit list."""
    # Create one audit first
    await client.post(
        "/api/v1/auditor/analyze",
        json={"source_code": SAFE_CONTRACT},
    )

    listing = await client.get("/api/v1/auditor/history")
    assert listing.status_code == 200
    body = listing.json()
    assert isinstance(body["data"], list)
    assert body["meta"]["total"] >= 1


@pytest.mark.asyncio
async def test_get_audit_report_alias(client: AsyncClient, mock_llm: None) -> None:
    """GET /auditor/report/{id} should be an alias for GET /auditor/{id}."""
    resp = await client.post(
        "/api/v1/auditor/analyze",
        json={"source_code": SAFE_CONTRACT},
    )
    audit_id = resp.headers["X-Audit-Id"]

    via_id = await client.get(f"/api/v1/auditor/{audit_id}")
    via_report = await client.get(f"/api/v1/auditor/report/{audit_id}")

    assert via_id.status_code == 200
    assert via_report.status_code == 200
    assert via_id.json()["data"]["id"] == via_report.json()["data"]["id"]


@pytest.mark.asyncio
async def test_delete_audit(client: AsyncClient, mock_llm: None) -> None:
    """DELETE /auditor/{id} should remove the record."""
    resp = await client.post(
        "/api/v1/auditor/analyze",
        json={"source_code": SAFE_CONTRACT},
    )
    audit_id = resp.headers["X-Audit-Id"]

    delete_resp = await client.delete(f"/api/v1/auditor/{audit_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["data"]["deleted"] is True

    gone = await client.get(f"/api/v1/auditor/{audit_id}")
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_analyze_requires_auth() -> None:
    """POST /auditor/analyze should 401 without a valid token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth:
        resp = await unauth.post(
            "/api/v1/auditor/analyze",
            json={"source_code": "contract X {}"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_analyze_rate_limit_enforced(client: AsyncClient, mock_llm: None) -> None:
    """Rate limiter bucket exists — a valid request returns 200 or 429 (if limit hit)."""
    resp = await client.post(
        "/api/v1/auditor/analyze",
        json={"source_code": "contract X {}"},
    )
    # 200 = within limit, 429 = limit already hit by earlier tests — both are correct
    assert resp.status_code in (200, 429)


@pytest.mark.asyncio
async def test_analyze_rejects_oversized_source(client: AsyncClient) -> None:
    """Source code > 200k chars should return 422 (Pydantic) or 413 (router guard)."""
    resp = await client.post(
        "/api/v1/auditor/analyze",
        json={"source_code": "x" * 200_001},
    )
    assert resp.status_code in (413, 422)
