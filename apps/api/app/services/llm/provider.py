import asyncio
import json
import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = settings.llm_max_retries
RETRY_DELAY = settings.llm_retry_delay_seconds


class LLMProvider(ABC):
    name: str = "unknown"

    @abstractmethod
    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        pass


class EmergentProvider(LLMProvider):
    name = "emergent"

    def __init__(self, api_key: str | None = None, endpoint: str | None = None):
        self.api_key = api_key or settings.emergent_api_key
        self.endpoint = endpoint or settings.emergent_endpoint

    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
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


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.gemini_api_key

    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
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


class OllamaProvider(LLMProvider):
    name = "ollama"

    def __init__(self, endpoint: str | None = None, model: str | None = None):
        self.endpoint = endpoint or settings.ollama_chat_url
        self.model = model or settings.ollama_model

    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
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


class ProviderRouter:
    def __init__(self) -> None:
        self.providers: list[LLMProvider] = [
            EmergentProvider(),
            GeminiProvider(),
            OllamaProvider(),
        ]

    async def _stream_with_retries(
        self, provider: LLMProvider, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                async for chunk in provider.stream_generate(prompt, system, history):
                    yield chunk
                return
            except (httpx.HTTPError, ValueError, RuntimeError) as exc:
                last_error = exc
                logger.warning(
                    "Provider %s attempt %s failed: %s",
                    provider.name,
                    attempt + 1,
                    exc,
                )
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
        if last_error:
            raise last_error

    async def stream_generate_with_meta(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[tuple[str, str | None], None]:
        last_error: Exception | None = None
        for provider in self.providers:
            try:
                stream = self._stream_with_retries(provider, prompt, system, history)
                first_chunk = await stream.__anext__()
                yield first_chunk, provider.name
                async for chunk in stream:
                    yield chunk, None
                return
            except StopAsyncIteration:
                return
            except Exception as exc:
                logger.warning("Provider %s failed: %s", provider.name, exc)
                last_error = exc
                continue

        raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")

    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        async for chunk, _ in self.stream_generate_with_meta(prompt, system, history):
            yield chunk


llm_router = ProviderRouter()
