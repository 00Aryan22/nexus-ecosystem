"""Vector store abstraction.

Design:
- Abstract base class defines the contract.
- ChromaDB implementation uses the chromadb library.
- Future implementations: pgvector, Pinecone, Weaviate.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class SearchResult:
    def __init__(self, doc_id: str, score: float, metadata: dict[str, Any] | None = None) -> None:
        self.doc_id = doc_id
        self.score = score
        self.metadata = metadata or {}


class VectorStore(ABC):
    @abstractmethod
    async def add(
        self, doc_id: str, embedding: list[float], metadata: dict[str, Any] | None = None
    ) -> None: ...

    @abstractmethod
    async def search(self, embedding: list[float], top_k: int = 5) -> list[SearchResult]: ...

    @abstractmethod
    async def delete(self, doc_id: str) -> None: ...

    @abstractmethod
    async def count(self) -> int: ...


class ChromaDBVectorStore(VectorStore):
    """ChromaDB-backed vector store.

    Supports ephemeral (in-memory) mode for testing and persistent mode
    for production. Collection is auto-created on first use.
    """

    def __init__(
        self, collection_name: str = "knowledge_documents", persist_directory: str | None = None
    ) -> None:
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self._client = None
        self._collection = None

    async def _ensure_client(self):
        if self._client is not None:
            return
        try:
            import chromadb
        except ImportError:
            raise RuntimeError("chromadb is not installed. Run: pip install chromadb")

        if self.persist_directory:
            self._client = chromadb.PersistentClient(path=self.persist_directory)
        else:
            self._client = chromadb.EphemeralClient()

        try:
            self._collection = self._client.get_collection(self.collection_name)
        except Exception:
            self._collection = self._client.create_collection(self.collection_name)

    async def add(
        self, doc_id: str, embedding: list[float], metadata: dict[str, Any] | None = None
    ) -> None:
        await self._ensure_client()
        self._collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            metadatas=[metadata or {}],
        )

    async def search(self, embedding: list[float], top_k: int = 5) -> list[SearchResult]:
        await self._ensure_client()
        results = self._collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
        )
        if not results["ids"]:
            return []

        hits: list[SearchResult] = []
        for i, doc_id in enumerate(results["ids"][0]):
            score = results["distances"][0][i] if results["distances"] else 0.0
            metadata = results["metadatas"][0][i] if results["metadatas"] else {}
            hits.append(SearchResult(doc_id=doc_id, score=score, metadata=metadata))
        return hits

    async def delete(self, doc_id: str) -> None:
        await self._ensure_client()
        self._collection.delete(ids=[doc_id])

    async def count(self) -> int:
        await self._ensure_client()
        return self._collection.count()
