import json
import logging

import httpx

from app.core.config import settings
from app.services.llm.base import LLMProvider, ProviderHealthStatus

logger = logging.getLogger(__name__)

OPENAI_MODELS = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
]


class OpenAIProvider(LLMProvider):
    name = "openai"
    display_name = "OpenAI"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.openai_api_key

    async def stream_generate(
        self,
        prompt: str,
        system: str,
        history: list[dict[str, str]],
        model: str | None = None,
    ):
        if not self.api_key:
            raise ValueError("OpenAI API Key not configured")

        model_name = model or self.default_model
        messages = (
            [{"role": "system", "content": system}]
            + history
            + [{"role": "user", "content": prompt}]
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": model_name, "messages": messages, "stream": True},
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            payload = json.loads(data)
                            chunk = (
                                payload.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            )
                            if chunk:
                                yield chunk
                        except json.JSONDecodeError:
                            continue

    async def health(self) -> bool:
        return bool(self.api_key)

    async def detailed_health(self, model: str | None = None) -> ProviderHealthStatus:
        if not self.api_key:
            return ProviderHealthStatus.NOT_CONFIGURED
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                if resp.status_code == 429:
                    return ProviderHealthStatus.RATE_LIMITED
                if resp.status_code == 401:
                    return ProviderHealthStatus.MISCONFIGURED
                return ProviderHealthStatus.UNAVAILABLE
        except httpx.ConnectError:
            return ProviderHealthStatus.UNAVAILABLE
        except Exception:
            return ProviderHealthStatus.UNAVAILABLE

    async def model_list(self) -> list[str]:
        if not self.api_key:
            return list(OPENAI_MODELS)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m["id"] for m in data.get("data", [])]
                    gpt_models = [m for m in models if "gpt" in m.lower()]
                    return sorted(gpt_models)[:20] if gpt_models else sorted(models)[:20]
        except Exception:
            pass
        return list(OPENAI_MODELS)

    @property
    def default_model(self) -> str:
        return settings.openai_default_model

    @property
    def supports_model_listing(self) -> bool:
        return True

    @property
    def supports_vision(self) -> bool:
        return True
