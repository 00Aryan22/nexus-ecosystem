import asyncio
import logging
from collections.abc import AsyncGenerator

import httpx

from app.core.config import settings
from app.services.llm.base import LLMProvider, ProviderHealthStatus
from app.services.llm.providers import register_all_providers
from app.services.llm.registry import ProviderRegistry

logger = logging.getLogger(__name__)

MAX_RETRIES = settings.llm_max_retries
RETRY_DELAY = settings.llm_retry_delay_seconds


class ProviderRouter:
    def __init__(self) -> None:
        self.providers: list[LLMProvider] = []

    async def _stream_with_retries(
        self,
        provider: LLMProvider,
        prompt: str,
        system: str,
        history: list[dict[str, str]],
        model: str | None = None,
    ) -> AsyncGenerator[str, None]:
        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                async for chunk in provider.stream_generate(prompt, system, history, model):
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

    async def stream_from_provider(
        self,
        provider_name: str,
        prompt: str,
        system: str,
        history: list[dict[str, str]],
        model: str | None = None,
    ) -> AsyncGenerator[str, None]:
        provider = ProviderRegistry.get(provider_name)
        async for chunk in self._stream_with_retries(provider, prompt, system, history, model):
            yield chunk

    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        async for chunk, _ in self.stream_generate_with_meta(prompt, system, history):
            yield chunk

    async def check_provider_health(self, name: str) -> bool:
        try:
            provider = ProviderRegistry.get(name)
            return await provider.health()
        except ValueError:
            return False

    async def detailed_provider_health(
        self, name: str, model: str | None = None
    ) -> ProviderHealthStatus:
        try:
            provider = ProviderRegistry.get(name)
            return await provider.detailed_health(model=model or provider.default_model or None)
        except ValueError:
            return ProviderHealthStatus.UNAVAILABLE


# Register default providers
register_all_providers()

# Create a router that knows about all providers
llm_router = ProviderRouter()
for name in ProviderRegistry.list_providers():
    llm_router.providers.append(ProviderRegistry.get(name))
