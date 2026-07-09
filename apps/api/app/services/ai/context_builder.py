"""ContextBuilder — reusable service to inject relevant workspace knowledge into prompts."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.memory.embeddings import OllamaEmbedding
from app.modules.memory.schemas import SearchResultItem
from app.modules.memory.service import MemoryService
from app.modules.memory.vector_store import ChromaDBVectorStore

logger = logging.getLogger(__name__)

DOCUMENT_TEMPLATE = """[{title}]({source})
{snippet}
Score: {score}"""

CONTEXT_TEMPLATE = """Relevant Workspace Knowledge
---

{document_block}

---

Founder Request

{prompt}"""


@dataclass
class ContextBuilderConfig:
    top_k: int = 5
    max_context_length: int = 2000
    min_similarity_score: float = 0.0


class ContextBuilder:
    def __init__(
        self,
        memory_service: MemoryService,
        config: ContextBuilderConfig | None = None,
    ) -> None:
        self.memory_service = memory_service
        self.config = config or ContextBuilderConfig()

    async def search_memory(
        self,
        query: str,
        workspace_id: str | None = None,
    ) -> list[SearchResultItem]:
        results = await self.memory_service.search_documents(
            query=query,
            top_k=self.config.top_k,
            workspace_id=workspace_id,
        )
        if self.config.min_similarity_score > 0:
            results = [
                r for r in results if r.score >= self.config.min_similarity_score
            ]
        return results

    def build_context_block(self, results: list[SearchResultItem]) -> str:
        if not results:
            return ""

        parts = []
        for doc in results:
            parts.append(
                DOCUMENT_TEMPLATE.format(
                    title=doc.title,
                    source=doc.source,
                    snippet=doc.snippet,
                    score=f"{doc.score:.2f}",
                )
            )

        block = "\n\n".join(parts)

        if len(block) > self.config.max_context_length:
            block = block[: self.config.max_context_length].rsplit(" ", 1)[0] + "..."

        return block

    def build_prompt_with_context(self, prompt: str, context_block: str) -> str:
        if not context_block:
            return prompt
        return CONTEXT_TEMPLATE.format(
            document_block=context_block,
            prompt=prompt,
        )


_embedding: OllamaEmbedding | None = None
_vector_store: ChromaDBVectorStore | None = None


def _get_embedding() -> OllamaEmbedding:
    global _embedding
    if _embedding is None:
        _embedding = OllamaEmbedding()
    return _embedding


def _get_vector_store() -> ChromaDBVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaDBVectorStore()
    return _vector_store


def create_memory_service(db: AsyncSession) -> MemoryService:
    return MemoryService(db, _get_embedding(), _get_vector_store())


def create_context_builder(
    db: AsyncSession,
    config: ContextBuilderConfig | None = None,
) -> ContextBuilder:
    return ContextBuilder(
        memory_service=create_memory_service(db),
        config=config,
    )
