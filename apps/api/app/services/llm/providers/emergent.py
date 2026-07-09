import json
import logging

import httpx

from app.core.config import settings
from app.services.llm.base import LLMProvider, ProviderHealthStatus

logger = logging.getLogger(__name__)


class EmergentProvider(LLMProvider):
    name = "emergent"
    display_name = "Emergent AI"

    def __init__(self, api_key: str | None = None, endpoint: str | None = None):
        self.api_key = api_key or settings.emergent_api_key
        self.endpoint = endpoint or settings.emergent_endpoint

    async def stream_generate(self, prompt: str, system: str, history: list[dict[str, str]]):
        if not self.api_key:
            raise ValueError("Emergent API Key not configured")

        messages = (
            [{"role": "system", "content": system}]
            + history
            + [{"role": "user", "content": prompt}]
        )

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": "emergent-universal", "messages": messages, "stream": True},
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

    async def detailed_health(self) -> ProviderHealthStatus:
        if not self.api_key:
            return ProviderHealthStatus.MISCONFIGURED
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.endpoint,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "emergent-universal",
                        "messages": [{"role": "user", "content": "ping"}],
                        "stream": False,
                    },
                )
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                if resp.status_code == 429:
                    return ProviderHealthStatus.RATE_LIMITED
                if resp.status_code in (401, 403):
                    return ProviderHealthStatus.MISCONFIGURED
                return ProviderHealthStatus.UNAVAILABLE
        except httpx.ConnectError:
            return ProviderHealthStatus.UNAVAILABLE
        except Exception:
            return ProviderHealthStatus.UNAVAILABLE

    async def model_list(self) -> list[str]:
        return ["emergent-universal"]

    @property
    def default_model(self) -> str:
        return "emergent-universal"
