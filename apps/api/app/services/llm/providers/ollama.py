import json
import logging

import httpx

from app.core.config import settings
from app.services.llm.base import LLMProvider, ProviderHealthStatus

logger = logging.getLogger(__name__)


class OllamaProvider(LLMProvider):
    name = "ollama"
    display_name = "Ollama (Local)"

    def __init__(self, endpoint: str | None = None, model: str | None = None):
        self.endpoint = endpoint or settings.ollama_chat_url
        self.model = model or settings.ollama_model

    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ):
        messages = (
            [{"role": "system", "content": system}]
            + history
            + [{"role": "user", "content": prompt}]
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.endpoint,
                json={"model": self.model, "messages": messages, "stream": True},
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    try:
                        payload = json.loads(line)
                        chunk = payload.get("message", {}).get("content", "")
                        if chunk:
                            yield chunk
                    except json.JSONDecodeError:
                        continue

    async def health(self) -> bool:
        base = settings.ollama_base_url.rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{base}/api/tags")
                return resp.status_code == 200
        except httpx.ConnectError:
            return False
        except Exception:
            return False

    async def detailed_health(self) -> ProviderHealthStatus:
        base = settings.ollama_base_url.rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{base}/api/tags")
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                if resp.status_code == 429:
                    return ProviderHealthStatus.RATE_LIMITED
                return ProviderHealthStatus.UNAVAILABLE
        except httpx.ConnectError:
            return ProviderHealthStatus.UNAVAILABLE
        except Exception:
            return ProviderHealthStatus.UNAVAILABLE

    async def model_list(self) -> list[str]:
        base = settings.ollama_base_url.rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{base}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    @property
    def default_model(self) -> str:
        return self.model

    @property
    def supports_model_listing(self) -> bool:
        return True

    @property
    def supports_vision(self) -> bool:
        return False
