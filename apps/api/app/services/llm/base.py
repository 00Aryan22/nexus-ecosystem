from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from enum import StrEnum


class ProviderHealthStatus(StrEnum):
    HEALTHY = "healthy"
    UNAVAILABLE = "unavailable"
    MISCONFIGURED = "misconfigured"
    RATE_LIMITED = "rate_limited"


class LLMProvider(ABC):
    name: str = "unknown"
    display_name: str = "Unknown"

    @abstractmethod
    async def stream_generate(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        ...

    async def chat(
        self, prompt: str, system: str, history: list[dict[str, str]]
    ) -> str:
        chunks: list[str] = []
        async for chunk in self.stream_generate(prompt, system, history):
            chunks.append(chunk)
        return "".join(chunks)

    async def health(self) -> bool:
        return True

    async def detailed_health(self) -> ProviderHealthStatus:
        ok = await self.health()
        return ProviderHealthStatus.HEALTHY if ok else ProviderHealthStatus.UNAVAILABLE

    async def model_list(self) -> list[str]:
        return []

    @property
    def default_model(self) -> str:
        return ""

    @property
    def supports_streaming(self) -> bool:
        return True

    @property
    def supports_model_listing(self) -> bool:
        return False

    @property
    def supports_vision(self) -> bool:
        return False
