from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.llm.provider import ProviderRegistry, llm_router


async def _mock_stream(*_args, **_kwargs) -> AsyncGenerator[tuple[str, str | None], None]:
    yield "Hello ", "mock"
    yield "founder!", None


async def _mock_chunks(*_args, **_kwargs) -> AsyncGenerator[str, None]:
    yield "Hello "
    yield "founder!"


@pytest.fixture
def mock_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    async def mock_stream_generate_with_meta(prompt, system, history):
        async for chunk, provider in _mock_stream():
            yield chunk, provider

    async def mock_stream_from_provider(provider_name, prompt, system, history, **kwargs):
        async for chunk in _mock_chunks():
            yield chunk

    monkeypatch.setattr(llm_router, "stream_generate_with_meta", mock_stream_generate_with_meta)
    monkeypatch.setattr(llm_router, "stream_from_provider", mock_stream_from_provider)


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


@pytest.mark.asyncio
async def test_rename_conversation(client: AsyncClient) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    rename = await client.patch(
        f"/api/v1/founder-agent/conversations/{conversation_id}",
        json={"title": "My Renamed Chat"},
    )
    assert rename.status_code == 200
    assert rename.json()["data"]["title"] == "My Renamed Chat"
    assert rename.json()["data"]["id"] == conversation_id

    detail = await client.get(f"/api/v1/founder-agent/conversations/{conversation_id}")
    assert detail.json()["data"]["title"] == "My Renamed Chat"


@pytest.mark.asyncio
async def test_rename_nonexistent_conversation(client: AsyncClient) -> None:
    rename = await client.patch(
        "/api/v1/founder-agent/conversations/nonexistent-id",
        json={"title": "Wont Work"},
    )
    assert rename.status_code == 404


@pytest.mark.asyncio
async def test_search_conversations_by_message_content(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Help me with a lean canvas"},
    )

    search = await client.get(
        "/api/v1/founder-agent/conversations/search",
        params={"q": "Hello"},
    )
    assert search.status_code == 200
    data = search.json()["data"]
    assert len(data) >= 1
    assert data[0]["id"] == conversation_id
    assert data[0]["match_preview"] is not None
    assert "Hello" in data[0]["match_preview"]


@pytest.mark.asyncio
async def test_search_conversations_no_results(client: AsyncClient) -> None:
    search = await client.get(
        "/api/v1/founder-agent/conversations/search",
        params={"q": "zzzzzzz_nonexistent_zzzzzzz"},
    )
    assert search.status_code == 200
    assert search.json()["data"] == []


@pytest.mark.asyncio
async def test_search_conversations_empty_query(client: AsyncClient) -> None:
    search = await client.get(
        "/api/v1/founder-agent/conversations/search",
        params={"q": ""},
    )
    assert search.status_code == 200
    assert search.json()["data"] == []


@pytest.mark.asyncio
async def test_search_conversations_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
        response = await unauth_client.get(
            "/api/v1/founder-agent/conversations/search",
            params={"q": "test"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_usage_summary_returns_zeros_when_no_usage(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/v1/founder-agent/usage")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["total_requests"] == 0
    assert body["total_tokens_input"] == 0
    assert body["total_tokens_output"] == 0
    assert "by_provider" in body


@pytest.mark.asyncio
async def test_usage_summary_after_chat(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Help me with a lean canvas"},
    )

    response = await client.get("/api/v1/founder-agent/usage")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["total_requests"] >= 1
    assert body["total_tokens_output"] > 0
    assert "by_provider" in body


@pytest.mark.asyncio
async def test_usage_summary_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
        response = await unauth_client.get("/api/v1/founder-agent/usage")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Conversation Export Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_export_markdown(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Explain lean canvas"},
    )

    response = await client.get(
        f"/api/v1/founder-agent/conversations/{conversation_id}/export",
        params={"format": "md"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/markdown")
    assert "Content-Disposition" in response.headers
    assert "attachment;" in response.headers["content-disposition"]
    body = response.text
    assert "# Conversation:" in body
    assert "## User" in body
    assert "## Founder Agent" in body
    assert "Explain lean canvas" in body


@pytest.mark.asyncio
async def test_export_json(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Explain lean canvas"},
    )

    response = await client.get(
        f"/api/v1/founder-agent/conversations/{conversation_id}/export",
        params={"format": "json"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert "conversation" in data
    assert "messages" in data
    assert "metadata" in data
    assert len(data["messages"]) >= 2
    assert data["metadata"]["format"] == "json"
    assert data["metadata"]["version"] == "1.0"


@pytest.mark.asyncio
async def test_export_pdf(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Explain lean canvas"},
    )

    response = await client.get(
        f"/api/v1/founder-agent/conversations/{conversation_id}/export",
        params={"format": "pdf"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:5] == b"%PDF-"
    assert len(response.content) > 200


@pytest.mark.asyncio
async def test_export_invalid_format(client: AsyncClient) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    response = await client.get(
        f"/api/v1/founder-agent/conversations/{conversation_id}/export",
        params={"format": "docx"},
    )
    assert response.status_code == 400
    assert "Unsupported" in response.text


@pytest.mark.asyncio
async def test_export_nonexistent_conversation(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/founder-agent/conversations/nonexistent-id/export",
        params={"format": "md"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_export_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
        response = await unauth_client.get(
            "/api/v1/founder-agent/conversations/some-id/export",
            params={"format": "md"},
        )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Provider Selection Tests
# ---------------------------------------------------------------------------


def test_provider_registry_list() -> None:
    providers = ProviderRegistry.list_providers()
    assert "gemini" in providers
    assert "ollama" in providers


def test_provider_registry_get() -> None:
    gemini = ProviderRegistry.get("gemini")
    assert gemini.name == "gemini"
    assert gemini.display_name == "Gemini"


def test_provider_registry_invalid() -> None:
    with pytest.raises(ValueError, match="Unknown provider"):
        ProviderRegistry.get("nonexistent")


@pytest.mark.asyncio
async def test_provider_preferences_get(client: AsyncClient) -> None:
    response = await client.get("/api/v1/founder-agent/provider/preferences")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "provider" in data
    assert isinstance(data["provider"], str)


@pytest.mark.asyncio
async def test_provider_preferences_update(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/founder-agent/provider/preferences",
        json={"provider": "ollama"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["provider"] == "ollama"

    # Verify persistence
    get_response = await client.get("/api/v1/founder-agent/provider/preferences")
    assert get_response.json()["data"]["provider"] == "ollama"


@pytest.mark.asyncio
async def test_provider_preferences_invalid(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/founder-agent/provider/preferences",
        json={"provider": "nonexistent"},
    )
    assert response.status_code == 400
    assert "Unknown provider" in response.text


@pytest.mark.asyncio
async def test_provider_status(client: AsyncClient) -> None:
    response = await client.get("/api/v1/founder-agent/provider/status")
    assert response.status_code == 200
    data = response.json()["data"]
    assert isinstance(data, list)
    names = [p["name"] for p in data]
    registered = ProviderRegistry.list_providers()
    if "emergent" in registered:
        assert "emergent" in names
    assert "gemini" in names
    assert "ollama" in names
    for provider in data:
        assert "displayName" in provider
        assert isinstance(provider["configured"], bool)
        assert isinstance(provider["available"], bool)


@pytest.mark.asyncio
async def test_chat_with_provider_override(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    response = await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Explain lean canvas", "provider": "gemini"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    text = response.text
    assert "Hello " in text
    assert "founder!" in text


@pytest.mark.asyncio
async def test_chat_without_provider_fallback(client: AsyncClient, mock_llm: None) -> None:
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    response = await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Explain lean canvas"},
    )
    assert response.status_code == 200
    assert "founder!" in response.text


# ---------------------------------------------------------------------------
# Memory Integration Tests
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def patch_context_builder(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch create_context_builder to return a ContextBuilder with a mock
    MemoryService that returns empty results. This prevents the real embedding
    provider and vector store from being initialised during tests."""
    from app.services.ai.context_builder import ContextBuilder

    mock_memory = AsyncMock()
    mock_memory.search_documents = AsyncMock(return_value=[])

    def _make_mock_builder(db):
        return ContextBuilder(memory_service=mock_memory)

    monkeypatch.setattr(
        "app.modules.founder_agent.router.create_context_builder",
        _make_mock_builder,
    )


@pytest.mark.asyncio
async def test_chat_with_memory_disabled(
    client: AsyncClient, mock_llm: None, patch_context_builder: None
) -> None:
    """enable_memory=False should skip context injection and stream normally."""
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    response = await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Explain lean canvas", "enable_memory": False},
    )
    assert response.status_code == 200
    assert "Hello " in response.text
    assert "founder!" in response.text
    assert "[DONE]" in response.text


@pytest.mark.asyncio
async def test_chat_with_memory_enabled_no_results(
    client: AsyncClient, mock_llm: None, patch_context_builder: None
) -> None:
    """enable_memory=True (default) with no search results still streams normally."""
    create = await client.post("/api/v1/founder-agent/conversations")
    conversation_id = create.json()["data"]["id"]

    response = await client.post(
        f"/api/v1/founder-agent/conversations/{conversation_id}/chat",
        json={"prompt": "Help me brainstorm ideas"},
    )
    assert response.status_code == 200
    assert "Hello " in response.text
    assert "founder!" in response.text
