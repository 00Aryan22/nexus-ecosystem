from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.llm.provider import llm_router


async def _mock_stream(*_args, **_kwargs) -> AsyncGenerator[tuple[str, str | None], None]:
    yield "Hello ", "mock"
    yield "founder!", None


@pytest.fixture
def mock_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    async def mock_stream_generate_with_meta(prompt, system, history):
        async for chunk, provider in _mock_stream():
            yield chunk, provider

    monkeypatch.setattr(llm_router, "stream_generate_with_meta", mock_stream_generate_with_meta)


@pytest.mark.asyncio
async def test_create_and_list_conversations(client: AsyncClient) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    assert create.status_code == 200
    body = create.json()
    assert body["data"]["title"] == "New Conversation"
    conversation_id = body["data"]["id"]

    listing = await client.get("/api/v1/founder-agent/conversations")
    assert listing.status_code == 200
    ids = [c["id"] for c in listing.json()["data"]]
    assert conversation_id in ids


@pytest.mark.asyncio
async def test_get_conversation_detail(client: AsyncClient) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    detail = await client.get(f"/api/v1/founder-agent/conversations/{conversation_id}")
    assert detail.status_code == 200
    assert detail.json()["data"]["messages"] == []


@pytest.mark.asyncio
async def test_founder_agent_chat_stream(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    response = await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Help me with a lean canvas", "plan_type": "lean_canvas"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    text = response.text
    assert "Hello " in text
    assert "founder!" in text
    assert "[DONE]" in text

    detail = await client.get(f"/api/v1/founder-agent/conversations/{conversation_id}")
    messages = detail.json()["data"]["messages"]
    assert len(messages) == 2
    assert messages[0]["sender"] == "user"
    assert messages[1]["sender"] == "agent"
    assert "Hello founder!" in messages[1]["content"]


@pytest.mark.asyncio
async def test_prompt_suggestions(client: AsyncClient) -> None:
    response = await client.get("/api/v1/founder-agent/prompts/suggestions")
    assert response.status_code == 200
    suggestions = response.json()["data"]
    assert len(suggestions) >= 4
    assert "prompt" in suggestions[0]


@pytest.mark.asyncio
async def test_delete_conversation(client: AsyncClient) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    delete = await client.delete(f"/api/v1/founder-agent/conversations/{conversation_id}")
    assert delete.status_code == 200
    assert delete.json()["data"]["deleted"] is True

    detail = await client.get(f"/api/v1/founder-agent/conversations/{conversation_id}")
    assert detail.status_code == 404


@pytest.mark.asyncio
async def test_founder_agent_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
        response = await unauth_client.get("/api/v1/founder-agent/conversations")
    assert response.status_code == 401
