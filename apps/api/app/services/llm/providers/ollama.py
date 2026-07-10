import json
import logging

import httpx

from app.core.config import settings
from app.services.llm.base import LLMProvider, ProviderHealthStatus

logger = logging.getLogger(__name__)


class OllamaProvider(LLMProvider):
    name = "ollama"
    display_name = "Ollama"

    def __init__(
        self,
        endpoint: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
    ):
        self.endpoint = endpoint or settings.ollama_chat_url
        self.model = model or settings.ollama_model
        self.api_key = api_key or settings.ollama_api_key

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def stream_generate(
        self,
        prompt: str,
        system: str,
        history: list[dict[str, str]],
        model: str | None = None,
    ):
        model_name = model or self.model
        messages = (
            [{"role": "system", "content": system}]
            + history
            + [{"role": "user", "content": prompt}]
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.endpoint,
                headers=self._headers(),
                json={"model": model_name, "messages": messages, "stream": True},
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
        if not settings.ollama_base_url:
            return False
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(settings.ollama_tags_url, headers=self._headers())
                return resp.status_code == 200
        except httpx.ConnectError:
            return False
        except Exception:
            return False

    async def detailed_health(self, model: str | None = None) -> ProviderHealthStatus:
        if not settings.ollama_base_url:
            return ProviderHealthStatus.NOT_CONFIGURED

        if "localhost" in settings.ollama_base_url or "127.0.0.1" in settings.ollama_base_url:
            if settings.app_env == "production":
                return ProviderHealthStatus.LOCAL_ONLY

        if not self.api_key:
            return ProviderHealthStatus.NOT_CONFIGURED

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(settings.ollama_tags_url, headers=self._headers())
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                if resp.status_code == 401:
                    return ProviderHealthStatus.MISCONFIGURED
                if resp.status_code == 403:
                    return ProviderHealthStatus.MISCONFIGURED
                if resp.status_code == 404:
                    return ProviderHealthStatus.MODEL_UNAVAILABLE
                if resp.status_code == 429:
                    return ProviderHealthStatus.RATE_LIMITED
                return ProviderHealthStatus.UNAVAILABLE
        except httpx.ConnectError:
            return ProviderHealthStatus.UNAVAILABLE
        except httpx.TimeoutException:
            return ProviderHealthStatus.UNAVAILABLE
        except Exception:
            return ProviderHealthStatus.UNAVAILABLE

    async def model_list(self) -> list[str]:
        if not settings.ollama_base_url:
            return []
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(settings.ollama_tags_url, headers=self._headers())
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
