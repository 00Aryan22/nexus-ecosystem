import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.llm.registry import ProviderRegistry

# ---------------------------------------------------------------------------
# Provider Registry & Selection
# ---------------------------------------------------------------------------


def test_ai_provider_registry_has_openai() -> None:
    providers = ProviderRegistry.list_providers()
    assert "openai" in providers


def test_ai_provider_registry_get_openai() -> None:
    p = ProviderRegistry.get("openai")
    assert p.name == "openai"
    assert p.display_name == "OpenAI"


def test_ai_provider_registry_get_gemini() -> None:
    p = ProviderRegistry.get("gemini")
    assert p.default_model == "gemini-1.5-pro"


def test_ai_provider_registry_get_ollama() -> None:
    p = ProviderRegistry.get("ollama")
    assert p.default_model != ""


def test_ai_provider_registry_invalid() -> None:
    with pytest.raises(ValueError, match="Unknown provider"):
        ProviderRegistry.get("nonexistent")


# ---------------------------------------------------------------------------
# Provider metadata
# ---------------------------------------------------------------------------


def test_provider_metadata_supports_streaming() -> None:
    for name in ProviderRegistry.list_providers():
        p = ProviderRegistry.get(name)
        assert isinstance(p.supports_streaming, bool)


def test_provider_metadata_supports_vision() -> None:
    assert ProviderRegistry.get("gemini").supports_vision is True
    assert ProviderRegistry.get("openai").supports_vision is True
    assert ProviderRegistry.get("ollama").supports_vision is False
    assert ProviderRegistry.get("emergent").supports_vision is False


def test_provider_metadata_supports_model_listing() -> None:
    assert ProviderRegistry.get("gemini").supports_model_listing is True
    assert ProviderRegistry.get("openai").supports_model_listing is True
    assert ProviderRegistry.get("ollama").supports_model_listing is True
    assert ProviderRegistry.get("emergent").supports_model_listing is False


# ---------------------------------------------------------------------------
# Provider model listing
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_gemini_model_list() -> None:
    p = ProviderRegistry.get("gemini")
    models = await p.model_list()
    assert "gemini-1.5-pro" in models
    assert "gemini-1.5-flash" in models


@pytest.mark.asyncio
async def test_emergent_model_list() -> None:
    p = ProviderRegistry.get("emergent")
    models = await p.model_list()
    assert "emergent-universal" in models


@pytest.mark.asyncio
async def test_openai_model_list_fallback() -> None:
    p = ProviderRegistry.get("openai")
    models = await p.model_list()
    # Falls back to hardcoded list when no API key configured
    assert "gpt-4o" in models


# ---------------------------------------------------------------------------
# API Endpoint: GET /ai/providers
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_providers_endpoint(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/providers")
    assert response.status_code == 200
    data = response.json()["data"]
    ids = [p["id"] for p in data]
    assert "emergent" in ids
    assert "gemini" in ids
    assert "ollama" in ids
    assert "openai" in ids
    for provider in data:
        assert "displayName" in provider
        assert "healthy" in provider
        assert isinstance(provider["healthy"], bool)
        assert "defaultModel" in provider
        assert "supportsStreaming" in provider
        assert isinstance(provider["supportsStreaming"], bool)
        assert "supportsVision" in provider
        assert isinstance(provider["supportsVision"], bool)


# ---------------------------------------------------------------------------
# API Endpoint: GET /ai/providers/{provider}/models
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_providers_models_gemini(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/providers/gemini/models")
    assert response.status_code == 200
    data = response.json()["data"]
    ids = [m["id"] for m in data]
    assert "gemini-1.5-pro" in ids


@pytest.mark.asyncio
async def test_ai_providers_models_emergent(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/providers/emergent/models")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) >= 1
    assert data[0]["id"] == "emergent-universal"


@pytest.mark.asyncio
async def test_ai_providers_models_invalid_provider(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/providers/nonexistent/models")
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# API Endpoint: GET /ai/models?provider=
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_models_gemini(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/models", params={"provider": "gemini"})
    assert response.status_code == 200
    data = response.json()["data"]
    ids = [m["id"] for m in data]
    assert "gemini-1.5-pro" in ids


@pytest.mark.asyncio
async def test_ai_models_emergent(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/models", params={"provider": "emergent"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) >= 1
    assert data[0]["id"] == "emergent-universal"


@pytest.mark.asyncio
async def test_ai_models_invalid_provider(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/models", params={"provider": "nonexistent"})
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# API Endpoint: GET /ai/settings
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_settings_get_defaults(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/settings")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "defaultProvider" in data
    assert "defaultModel" in data
    assert "temperature" in data
    assert "topP" in data
    assert "maxTokens" in data
    assert "streamingEnabled" in data
    assert data["streamingEnabled"] is True
    assert data["defaultProvider"] != ""


# ---------------------------------------------------------------------------
# API Endpoint: PUT /ai/settings
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_settings_update(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/ai/settings",
        json={
            "defaultProvider": "ollama",
            "defaultModel": "llama3",
            "temperature": 0.5,
            "topP": 0.9,
            "maxTokens": 2048,
            "streamingEnabled": False,
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["defaultProvider"] == "ollama"
    assert data["defaultModel"] == "llama3"
    assert data["temperature"] == 0.5
    assert data["topP"] == 0.9
    assert data["maxTokens"] == 2048
    assert data["streamingEnabled"] is False

    # Verify persistence
    get_resp = await client.get("/api/v1/ai/settings")
    get_data = get_resp.json()["data"]
    assert get_data["defaultProvider"] == "ollama"
    assert get_data["defaultModel"] == "llama3"


@pytest.mark.asyncio
async def test_ai_settings_invalid_provider(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/ai/settings",
        json={
            "defaultProvider": "nonexistent",
            "defaultModel": "test",
            "temperature": 0.7,
            "topP": 1.0,
            "maxTokens": 4096,
            "streamingEnabled": True,
        },
    )
    assert response.status_code == 400
    assert "Unknown provider" in response.text


# ---------------------------------------------------------------------------
# API Endpoint: GET /ai/health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_health(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ai/health")
    assert response.status_code == 200
    data = response.json()["data"]
    assert isinstance(data, list)
    names = [p["provider"] for p in data]
    assert "emergent" in names
    assert "gemini" in names
    assert "ollama" in names
    assert "openai" in names
    for provider in data:
        assert "displayName" in provider
        assert "status" in provider
        assert "configured" in provider


# ---------------------------------------------------------------------------
# Auth required for AI endpoints
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ai_settings_requires_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth:
        response = await unauth.get("/api/v1/ai/settings")
    assert response.status_code == 401
