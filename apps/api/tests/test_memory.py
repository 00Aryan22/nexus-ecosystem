"""Tests for the shared AI memory module (KnowledgeDocument, MemoryService, embeddings, API)."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.memory.embeddings import (
    EmbeddingProvider,
    GeminiEmbedding,
    OllamaEmbedding,
    OpenAIEmbedding,
)
from app.modules.memory.models import KnowledgeDocument
from app.modules.memory.schemas import DocumentCreate, DocumentUpdate
from app.modules.memory.service import MemoryService
from app.modules.memory.vector_store import ChromaDBVectorStore, SearchResult, VectorStore

# ---------------------------------------------------------------------------
# Mock helpers
# ---------------------------------------------------------------------------


class FakeEmbedding(EmbeddingProvider):
    """Returns deterministic embeddings for testing."""

    def __init__(self, dims: int = 4) -> None:
        self._dims = dims
        self._name = "test"
        self._model = "test-model"

    @property
    def dimensions(self) -> int:
        return self._dims

    @property
    def name(self) -> str:
        return self._name

    @property
    def model_name(self) -> str:
        return self._model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [[float(i + j * 0.1) for j in range(self._dims)] for i in range(len(texts))]


class FakeVectorStore(VectorStore):
    """In-memory vector store for testing."""

    def __init__(self) -> None:
        self._store: dict[str, list[float]] = {}
        self._meta: dict[str, dict] = {}

    async def add(self, doc_id: str, embedding: list[float], metadata: dict | None = None) -> None:
        self._store[doc_id] = embedding
        self._meta[doc_id] = metadata or {}

    async def search(self, embedding: list[float], top_k: int = 5) -> list[SearchResult]:
        # Simple dot-product similarity
        scores: list[tuple[str, float]] = []
        for doc_id, vec in self._store.items():
            sim = sum(a * b for a, b in zip(embedding, vec, strict=False))
            scores.append((doc_id, sim))
        scores.sort(key=lambda x: x[1], reverse=True)
        return [
            SearchResult(doc_id=s, score=sc, metadata=self._meta.get(s))
            for s, sc in scores[:top_k]
        ]

    async def delete(self, doc_id: str) -> None:
        self._store.pop(doc_id, None)
        self._meta.pop(doc_id, None)

    async def count(self) -> int:
        return len(self._store)


@pytest.fixture
def fake_embedding() -> FakeEmbedding:
    return FakeEmbedding()


@pytest.fixture
def fake_vector_store() -> FakeVectorStore:
    return FakeVectorStore()


@pytest.fixture
async def memory_service(
    db_session: AsyncSession,
    fake_embedding: FakeEmbedding,
    fake_vector_store: FakeVectorStore,
) -> MemoryService:
    return MemoryService(db_session, fake_embedding, fake_vector_store)


# ---------------------------------------------------------------------------
# Embedding providers -- unit tests
# ---------------------------------------------------------------------------


class TestEmbeddingProviders:
    async def test_ollama_embedding_fallback_zero_vector(self) -> None:
        """OllamaEmbedding should attempt the HTTP call; we test the zero-vector
        path only for Gemini/OpenAI since Ollama always tries the network."""
        provider = OllamaEmbedding(base_url="http://localhost:99999", model="test")
        with pytest.raises(Exception):
            await provider.embed(["hello"])

    async def test_gemini_returns_zero_vector_without_key(self) -> None:
        provider = GeminiEmbedding(api_key="", model="embedding-001")
        result = await provider.embed(["test"])
        assert len(result) == 1
        assert result[0] == [0.0] * 768

    async def test_openai_returns_zero_vector_without_key(self) -> None:
        provider = OpenAIEmbedding(api_key="", model="text-embedding-3-small")
        result = await provider.embed(["test"])
        assert len(result) == 1
        assert result[0] == [0.0] * 1536

    async def test_openai_embeds_batch(self) -> None:
        provider = OpenAIEmbedding(api_key="", model="text-embedding-3-small")
        result = await provider.embed(["a", "b"])
        assert len(result) == 2

    async def test_embedding_provider_name_property(self) -> None:
        assert OllamaEmbedding(base_url="http://localhost:11434").name == "ollama"
        assert GeminiEmbedding(api_key="x").name == "gemini"
        assert OpenAIEmbedding(api_key="x").name == "openai"


# ---------------------------------------------------------------------------
# Vector store -- unit tests
# ---------------------------------------------------------------------------


class TestFakeVectorStore:
    async def test_add_and_search(self) -> None:
        vs = FakeVectorStore()
        await vs.add("doc1", [1.0, 0.0, 0.0], {"title": "Doc 1"})
        await vs.add("doc2", [0.0, 1.0, 0.0], {"title": "Doc 2"})
        results = await vs.search([1.0, 0.0, 0.0], top_k=2)
        assert len(results) == 2
        assert results[0].doc_id == "doc1"
        assert results[0].score > results[1].score

    async def test_delete(self) -> None:
        vs = FakeVectorStore()
        await vs.add("doc1", [1.0, 0.0])
        await vs.delete("doc1")
        assert await vs.count() == 0

    async def test_search_empty_store(self) -> None:
        vs = FakeVectorStore()
        results = await vs.search([1.0, 0.0])
        assert results == []


class TestChromaDBVectorStore:
    async def test_raises_without_chromadb(self) -> None:
        vs = ChromaDBVectorStore()
        # Force import failure via patch
        with patch.dict("sys.modules", {"chromadb": None}):
            with pytest.raises(RuntimeError, match="chromadb is not installed"):
                await vs._ensure_client()


# ---------------------------------------------------------------------------
# MemoryService -- CRUD + search tests
# ---------------------------------------------------------------------------


class TestMemoryService:
    async def test_create_document(
        self, memory_service: MemoryService, db_session: AsyncSession
    ) -> None:
        body = DocumentCreate(
            title="Test Doc", source="manual", content="Hello world memory test"
        )
        doc = await memory_service.create_document(body)

        assert doc.id is not None
        assert doc.title == "Test Doc"
        assert doc.source == "manual"
        assert doc.content == "Hello world memory test"
        assert doc.embedding_provider == "test"
        assert doc.embedding_model == "test-model"

        # Verify it's in the DB
        from sqlalchemy import select

        result = await db_session.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == doc.id)
        )
        assert result.scalar_one_or_none() is not None

    async def test_create_document_with_metadata(
        self, memory_service: MemoryService
    ) -> None:
        body = DocumentCreate(
            title="Meta Doc",
            source="api",
            content="With metadata",
            doc_metadata={"key": "value", "tags": ["a", "b"]},
        )
        doc = await memory_service.create_document(body)
        assert doc.doc_metadata == {"key": "value", "tags": ["a", "b"]}

    async def test_create_document_with_workspace(
        self, memory_service: MemoryService
    ) -> None:
        body = DocumentCreate(
            title="WS Doc", source="manual", content="Scoped doc", workspace_id="ws-123"
        )
        doc = await memory_service.create_document(body)
        assert doc.workspace_id == "ws-123"

    async def test_update_document_content(
        self, memory_service: MemoryService
    ) -> None:
        body = DocumentCreate(
            title="Original", source="manual", content="Original content"
        )
        doc = await memory_service.create_document(body)

        updated = await memory_service.update_document(
            doc.id, DocumentUpdate(content="Updated content")
        )
        assert updated is not None
        assert updated.content == "Updated content"
        assert updated.title == "Original"  # unchanged

    async def test_update_document_not_found(
        self, memory_service: MemoryService
    ) -> None:
        result = await memory_service.update_document(
            uuid.uuid4(), DocumentUpdate(title="Nope")
        )
        assert result is None

    async def test_delete_document(
        self, memory_service: MemoryService, db_session: AsyncSession
    ) -> None:
        body = DocumentCreate(
            title="Delete Me", source="manual", content="To be deleted"
        )
        doc = await memory_service.create_document(body)

        deleted = await memory_service.delete_document(doc.id)
        assert deleted is True

        from sqlalchemy import select

        result = await db_session.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == doc.id)
        )
        assert result.scalar_one_or_none() is None

    async def test_delete_document_not_found(
        self, memory_service: MemoryService
    ) -> None:
        result = await memory_service.delete_document(uuid.uuid4())
        assert result is False

    async def test_search_documents(
        self, memory_service: MemoryService
    ) -> None:
        await memory_service.create_document(
            DocumentCreate(
                title="AI Concepts",
                source="manual",
                content="Artificial intelligence and machine learning",
            )
        )
        await memory_service.create_document(
            DocumentCreate(
                title="Blockchain",
                source="manual",
                content="Decentralized ledger technology",
            )
        )
        await memory_service.create_document(
            DocumentCreate(
                title="Deep Learning",
                source="manual",
                content="Neural networks and deep learning models",
            )
        )

        results = await memory_service.search_documents(
            query="artificial intelligence", top_k=5
        )
        assert len(results) >= 1
        # The fake vector store uses simple dot product, so all should return
        # but the highest similarity should be for "AI Concepts" since
        # fake embedding produces different vectors per index.
        assert any(r.title == "AI Concepts" for r in results)

    async def test_search_documents_empty(
        self, memory_service: MemoryService
    ) -> None:
        results = await memory_service.search_documents(query="nothing", top_k=5)
        assert results == []

    async def test_search_documents_with_workspace(
        self, memory_service: MemoryService
    ) -> None:
        await memory_service.create_document(
            DocumentCreate(
                title="WS1 Doc",
                source="manual",
                content="Content A",
                workspace_id="ws-1",
            )
        )
        await memory_service.create_document(
            DocumentCreate(
                title="WS2 Doc",
                source="manual",
                content="Content B",
                workspace_id="ws-2",
            )
        )

        results = await memory_service.search_documents(
            query="content", top_k=10, workspace_id="ws-1"
        )
        assert len(results) >= 1
        assert all(r.source == "manual" for r in results)

    async def test_list_documents(
        self, memory_service: MemoryService
    ) -> None:
        await memory_service.create_document(
            DocumentCreate(title="Doc 1", source="manual", content="First")
        )
        await memory_service.create_document(
            DocumentCreate(title="Doc 2", source="manual", content="Second")
        )
        await memory_service.create_document(
            DocumentCreate(title="Doc 3", source="manual", content="Third")
        )

        docs, total = await memory_service.list_documents(page=1, page_size=2)
        assert total == 3
        assert len(docs) == 2

    async def test_list_documents_with_workspace_filter(
        self, memory_service: MemoryService
    ) -> None:
        await memory_service.create_document(
            DocumentCreate(
                title="WS1", source="manual", content="A", workspace_id="ws-1"
            )
        )
        await memory_service.create_document(
            DocumentCreate(
                title="WS2", source="manual", content="B", workspace_id="ws-2"
            )
        )

        docs, total = await memory_service.list_documents(workspace_id="ws-1")
        assert total == 1
        assert docs[0].workspace_id == "ws-1"


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _patch_router_deps():
    """Replace the router's real embedding/vector store with fakes."""
    from unittest.mock import patch

    from app.modules.memory import router as memory_router

    fake_emb = FakeEmbedding()
    fake_vs = FakeVectorStore()
    with (
        patch.object(memory_router, "_get_embedding", return_value=fake_emb),
        patch.object(memory_router, "_get_vector_store", return_value=fake_vs),
    ):
        yield


class TestMemoryAPI:
    @pytest.mark.asyncio
    async def test_create_document_endpoint(self, client: AsyncClient) -> None:
        payload = {"title": "API Doc", "source": "api", "content": "Created via API"}
        response = await client.post("/api/v1/memory/documents", json=payload)
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["title"] == "API Doc"
        assert data["source"] == "api"
        assert data["content"] == "Created via API"
        assert "id" in data
        assert "embedding_provider" in data

    @pytest.mark.asyncio
    async def test_create_document_invalid(self, client: AsyncClient) -> None:
        payload = {"title": "", "source": "", "content": ""}
        response = await client.post("/api/v1/memory/documents", json=payload)
        # 422 validation error
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_list_documents_endpoint(self, client: AsyncClient) -> None:
        # Create a couple first
        await client.post(
            "/api/v1/memory/documents",
            json={"title": "L1", "source": "manual", "content": "List test 1"},
        )
        await client.post(
            "/api/v1/memory/documents",
            json={"title": "L2", "source": "manual", "content": "List test 2"},
        )

        response = await client.get("/api/v1/memory/documents")
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) >= 2
        ids = [d["id"] for d in data]
        assert len(ids) == len(set(ids))  # no duplicates

    @pytest.mark.asyncio
    async def test_list_documents_pagination(self, client: AsyncClient) -> None:
        for i in range(3):
            await client.post(
                "/api/v1/memory/documents",
                json={
                    "title": f"P{i}",
                    "source": "manual",
                    "content": f"Page doc {i}",
                },
            )

        response = await client.get("/api/v1/memory/documents?page=1&page_size=2")
        assert response.status_code == 200
        body = response.json()
        assert len(body["data"]) == 2
        assert body["meta"]["total"] >= 3
        assert body["meta"]["total_pages"] >= 2

    @pytest.mark.asyncio
    async def test_delete_document_endpoint(self, client: AsyncClient) -> None:
        create_resp = await client.post(
            "/api/v1/memory/documents",
            json={"title": "Del", "source": "manual", "content": "Delete me"},
        )
        doc_id = create_resp.json()["data"]["id"]

        delete_resp = await client.delete(f"/api/v1/memory/documents/{doc_id}")
        assert delete_resp.status_code == 200
        assert delete_resp.json()["data"]["deleted"] is True

        # Verify it's gone
        list_resp = await client.get("/api/v1/memory/documents")
        ids = [d["id"] for d in list_resp.json()["data"]]
        assert doc_id not in ids

    @pytest.mark.asyncio
    async def test_delete_document_not_found(self, client: AsyncClient) -> None:
        response = await client.delete(f"/api/v1/memory/documents/{uuid.uuid4()}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_search_documents_endpoint(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/memory/documents",
            json={
                "title": "Rockets",
                "source": "manual",
                "content": "SpaceX Falcon 9 rocket launch",
            },
        )
        await client.post(
            "/api/v1/memory/documents",
            json={
                "title": "Cars",
                "source": "manual",
                "content": "Tesla electric vehicle",
            },
        )

        response = await client.post(
            "/api/v1/memory/search",
            json={"query": "rocket", "top_k": 5},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) >= 1
        assert "score" in data[0]
        assert "snippet" in data[0]
        assert "source" in data[0]

    @pytest.mark.asyncio
    async def test_search_empty_query(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/memory/search", json={"query": "", "top_k": 5}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_no_results(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/memory/search",
            json={"query": "zzzzzznonexistent", "top_k": 5},
        )
        assert response.status_code == 200
        assert response.json()["data"] == []

    @pytest.mark.asyncio
    async def test_memory_endpoints_require_auth(self) -> None:
        from httpx import ASGITransport, AsyncClient

        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as unauth:
            response = await unauth.get("/api/v1/memory/documents")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_search_with_workspace(self, client: AsyncClient) -> None:
        await client.post(
            "/api/v1/memory/documents",
            json={
                "title": "WS Search",
                "source": "manual",
                "content": "Workspace content",
                "workspace_id": "ws-s1",
            },
        )

        response = await client.post(
            "/api/v1/memory/search",
            json={"query": "content", "top_k": 5, "workspace_id": "ws-s1"},
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data) >= 1
