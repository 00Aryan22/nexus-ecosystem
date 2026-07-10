from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from enum import StrEnum

import httpx


class ProviderError(Exception):
    """Sanitized provider error with a public-facing error code."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def sanitize_provider_error(exc: Exception) -> str:
    """Map internal exceptions to safe public error codes."""
    if isinstance(exc, ProviderError):
        return exc.message
    if isinstance(exc, ValueError):
        msg = str(exc)
        if "not configured" in msg.lower() or "api key" in msg.lower():
            return "PROVIDER_NOT_CONFIGURED"
        return "INVALID_REQUEST"
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        if status == 429:
            return "PROVIDER_RATE_LIMITED"
        if status in (401, 403):
            return "INVALID_PROVIDER_CREDENTIALS"
        if status == 404:
            return "MODEL_UNAVAILABLE"
        return f"PROVIDER_ERROR (HTTP {status})"
    if isinstance(exc, httpx.TimeoutException):
        return "PROVIDER_TIMEOUT"
    if isinstance(exc, httpx.ConnectError):
        return "PROVIDER_UNREACHABLE"
    return "UNAVAILABLE"


class ProviderHealthStatus(StrEnum):
    HEALTHY = "healthy"
    UNAVAILABLE = "unavailable"
    MISCONFIGURED = "misconfigured"
    RATE_LIMITED = "rate_limited"
    MODEL_UNAVAILABLE = "model_unavailable"
    LOCAL_ONLY = "local_only"
    NOT_CONFIGURED = "not_configured"


class LLMProvider(ABC):
    name: str = "unknown"
    display_name: str = "Unknown"

    @abstractmethod
    async def stream_generate(
        self,
        prompt: str,
        system: str,
        history: list[dict[str, str]],
        model: str | None = None,
    ) -> AsyncGenerator[str, None]: ...

    async def chat(self, prompt: str, system: str, history: list[dict[str, str]]) -> str:
        chunks: list[str] = []
        async for chunk in self.stream_generate(prompt, system, history):
            chunks.append(chunk)
        return "".join(chunks)

    async def health(self) -> bool:
        return True

    async def detailed_health(self, model: str | None = None) -> ProviderHealthStatus:
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
