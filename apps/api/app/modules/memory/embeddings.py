"""Embedding provider abstraction.

Design:
- Base class defines the contract.
- Each provider implements embed() for its API.
- Factory function selects provider by name.
- New providers can be added by subclassing EmbeddingProvider.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        ...

    @property
    def dimensions(self) -> int:
        return 768

    @property
    def name(self) -> str:
        return self.__class__.__name__.replace("Embedding", "").lower()

    @property
    def model_name(self) -> str:
        return ""


class OllamaEmbedding(EmbeddingProvider):
    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self.model = model or "nomic-embed-text"

    @property
    def dimensions(self) -> int:
        return 768

    @property
    def name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self.model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        results: list[list[float]] = []
        async with httpx.AsyncClient(timeout=30) as client:
            for text in texts:
                resp = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": self.model, "prompt": text},
                )
                resp.raise_for_status()
                data = resp.json()
                results.append(data["embedding"])
        return results


class GeminiEmbedding(EmbeddingProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model or "embedding-001"

    @property
    def dimensions(self) -> int:
        return 768

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self.model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key:
            logger.warning("Gemini API key not configured, returning zero vector")
            return [[0.0] * self.dimensions for _ in texts]

        results: list[list[float]] = []
        async with httpx.AsyncClient(timeout=30) as client:
            for text in texts:
                resp = await client.post(
                    (
                        f"https://generativelanguage.googleapis.com/v1beta/"
                        f"models/{self.model}:embedContent?key={self.api_key}"
                    ),
                    json={
                        "model": f"models/{self.model}",
                        "content": {"parts": [{"text": text}]},
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                embedding = data["embedding"]["values"]
                results.append(embedding)
        return results


class OpenAIEmbedding(EmbeddingProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else settings.openai_api_key
        self.model = model or "text-embedding-3-small"

    @property
    def dimensions(self) -> int:
        return 1536

    @property
    def name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self.model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key:
            logger.warning("OpenAI API key not configured, returning zero vector")
            return [[0.0] * self.dimensions for _ in texts]

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": self.model, "input": texts},
            )
            resp.raise_for_status()
            data = resp.json()
            sorted_embeddings = sorted(data["data"], key=lambda x: x["index"])
            return [item["embedding"] for item in sorted_embeddings]
