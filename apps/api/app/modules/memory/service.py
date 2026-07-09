"""MemoryService — shared AI memory CRUD + semantic search."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.memory.embeddings import EmbeddingProvider
from app.modules.memory.models import KnowledgeDocument
from app.modules.memory.schemas import (
    DocumentCreate,
    DocumentUpdate,
    SearchResultItem,
)
from app.modules.memory.vector_store import VectorStore


def _snippet(content: str, max_chars: int = 200) -> str:
    return content[:max_chars].rsplit(" ", 1)[0] if len(content) > max_chars else content


class MemoryService:
    def __init__(
        self, db: AsyncSession, embedding: EmbeddingProvider, vector_store: VectorStore
    ) -> None:
        self.db = db
        self.embedding = embedding
        self.vector_store = vector_store

    async def create_document(self, body: DocumentCreate) -> KnowledgeDocument:
        content = body.content
        embeddings = await self.embedding.embed([content])
        embedding_vector = embeddings[0]

        doc = KnowledgeDocument(
            workspace_id=body.workspace_id,
            title=body.title,
            source=body.source,
            content=content,
            doc_metadata=body.doc_metadata,
            embedding_provider=self.embedding.name,
            embedding_model=self.embedding.model_name,
        )
        self.db.add(doc)
        await self.db.flush()

        await self.vector_store.add(
            doc_id=str(doc.id),
            embedding=embedding_vector,
            metadata={
                "title": doc.title,
                "source": doc.source,
                "workspace_id": doc.workspace_id or "",
            },
        )

        await self.db.refresh(doc)
        return doc

    async def update_document(
        self, doc_id: uuid.UUID, body: DocumentUpdate
    ) -> KnowledgeDocument | None:
        result = await self.db.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == doc_id)
        )
        doc = result.scalar_one_or_none()
        if doc is None:
            return None

        update_data = body.model_dump(exclude_unset=True)
        needs_reembed = "content" in update_data

        for key, value in update_data.items():
            setattr(doc, key, value)

        if needs_reembed:
            embeddings = await self.embedding.embed([doc.content])
            embedding_vector = embeddings[0]
            await self.vector_store.delete(str(doc.id))
            await self.vector_store.add(
                doc_id=str(doc.id),
                embedding=embedding_vector,
                metadata={
                    "title": doc.title,
                    "source": doc.source,
                    "workspace_id": doc.workspace_id or "",
                },
            )

        await self.db.flush()
        await self.db.refresh(doc)
        return doc

    async def delete_document(self, doc_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == doc_id)
        )
        doc = result.scalar_one_or_none()
        if doc is None:
            return False

        await self.db.delete(doc)
        await self.vector_store.delete(str(doc.id))
        return True

    async def search_documents(
        self, query: str, top_k: int = 5, workspace_id: str | None = None
    ) -> list[SearchResultItem]:
        embeddings = await self.embedding.embed([query])
        query_vector = embeddings[0]

        hits = await self.vector_store.search(query_vector, top_k=top_k)

        if not hits:
            return []

        doc_ids = [uuid.UUID(h.doc_id) for h in hits if h.doc_id]
        stmt = select(KnowledgeDocument).where(KnowledgeDocument.id.in_(doc_ids))
        if workspace_id:
            stmt = stmt.where(KnowledgeDocument.workspace_id == workspace_id)

        result = await self.db.execute(stmt)
        docs = {str(d.id): d for d in result.scalars().all()}

        items: list[SearchResultItem] = []
        for hit in hits:
            doc = docs.get(hit.doc_id)
            if doc is None:
                continue
            # Chroma returns L2 distance as score; convert to similarity (0-1)
            score = max(0.0, 1.0 - hit.score / 10.0)
            items.append(
                SearchResultItem(
                    id=doc.id,
                    title=doc.title,
                    source=doc.source,
                    snippet=_snippet(doc.content),
                    score=round(score, 4),
                    doc_metadata=doc.doc_metadata,
                    created_at=doc.created_at,
                )
            )

        return items

    async def list_documents(
        self, workspace_id: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[KnowledgeDocument], int]:
        base = select(KnowledgeDocument)
        count_base = select(func.count(KnowledgeDocument.id))

        if workspace_id:
            base = base.where(KnowledgeDocument.workspace_id == workspace_id)
            count_base = count_base.where(
                KnowledgeDocument.workspace_id == workspace_id
            )

        total_result = await self.db.execute(count_base)
        total = total_result.scalar_one()

        base = (
            base.order_by(KnowledgeDocument.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(base)

        return list(result.scalars().all()), total
