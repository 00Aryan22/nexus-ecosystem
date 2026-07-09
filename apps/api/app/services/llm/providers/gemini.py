import json
import logging

import httpx

from app.core.config import settings
from app.services.llm.base import LLMProvider, ProviderHealthStatus

logger = logging.getLogger(__name__)

GEMINI_MODELS = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"]


class GeminiProvider(LLMProvider):
    name = "gemini"
    display_name = "Gemini"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.gemini_api_key

    async def stream_generate(self, prompt: str, system: str, history: list[dict[str, str]]):
        if not self.api_key:
            raise ValueError("Gemini API Key not configured")

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-pro:streamGenerateContent?alt=sse&key={self.api_key}"
        )

        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "systemInstruction": {"role": "system", "parts": [{"text": system}]},
            "contents": contents,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        try:
                            chunk_data = json.loads(data)
                            if "candidates" in chunk_data and chunk_data["candidates"]:
                                parts = (
                                    chunk_data["candidates"][0].get("content", {}).get("parts", [])
                                )
                                if parts:
                                    text = parts[0].get("text", "")
                                    if text:
                                        yield text
                        except json.JSONDecodeError:
                            continue

    async def health(self) -> bool:
        return bool(self.api_key)

    async def detailed_health(self) -> ProviderHealthStatus:
        if not self.api_key:
            return ProviderHealthStatus.MISCONFIGURED
        try:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-1.5-pro:generateContent?key={self.api_key}"
            )
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": "ping"}]}]},
                )
                if resp.status_code == 200:
                    return ProviderHealthStatus.HEALTHY
                if resp.status_code == 429:
                    return ProviderHealthStatus.RATE_LIMITED
                if resp.status_code == 403:
                    return ProviderHealthStatus.MISCONFIGURED
                return ProviderHealthStatus.UNAVAILABLE
        except httpx.ConnectError:
            return ProviderHealthStatus.UNAVAILABLE
        except Exception:
            return ProviderHealthStatus.UNAVAILABLE

    async def model_list(self) -> list[str]:
        return list(GEMINI_MODELS)

    @property
    def default_model(self) -> str:
        return "gemini-1.5-pro"

    @property
    def supports_model_listing(self) -> bool:
        return True

    @property
    def supports_vision(self) -> bool:
        return True
