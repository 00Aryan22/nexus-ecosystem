"""Tests for ContextBuilder — memory context injection for Founder Agent."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.modules.memory.schemas import SearchResultItem
from app.services.ai.context_builder import (
    ContextBuilder,
    ContextBuilderConfig,
)


def _make_result(
    *,
    title: str = "Doc Title",
    source: str = "manual",
    snippet: str = "Some relevant content here.",
    score: float = 0.85,
) -> SearchResultItem:
    return SearchResultItem(
        id=uuid4(),
        title=title,
        source=source,
        snippet=snippet,
        score=score,
        doc_metadata=None,
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def mock_memory_service() -> AsyncMock:
    svc = AsyncMock()
    svc.search_documents = AsyncMock(return_value=[])
    return svc


@pytest.fixture
def builder(mock_memory_service: AsyncMock) -> ContextBuilder:
    return ContextBuilder(memory_service=mock_memory_service)


# ---------------------------------------------------------------------------
# search_memory
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_search_memory_returns_results(
    builder: ContextBuilder, mock_memory_service: AsyncMock
) -> None:
    results = [_make_result(title="Founder Guide", score=0.92)]
    mock_memory_service.search_documents.return_value = results

    got = await builder.search_memory(query="how to start a startup")
    assert len(got) == 1
    assert got[0].title == "Founder Guide"
    mock_memory_service.search_documents.assert_awaited_once_with(
        query="how to start a startup",
        top_k=5,
        workspace_id=None,
    )


@pytest.mark.asyncio
async def test_search_memory_empty_when_no_results(
    builder: ContextBuilder, mock_memory_service: AsyncMock
) -> None:
    mock_memory_service.search_documents.return_value = []
    got = await builder.search_memory(query="something unknown")
    assert got == []


@pytest.mark.asyncio
async def test_search_memory_filters_by_workspace(
    builder: ContextBuilder, mock_memory_service: AsyncMock
) -> None:
    results = [_make_result(title="Workspace Doc")]
    mock_memory_service.search_documents.return_value = results

    got = await builder.search_memory(query="test", workspace_id="ws-1")
    assert len(got) == 1
    mock_memory_service.search_documents.assert_awaited_once_with(
        query="test",
        top_k=5,
        workspace_id="ws-1",
    )


@pytest.mark.asyncio
async def test_search_memory_filters_by_min_similarity(mock_memory_service: AsyncMock) -> None:
    results = [
        _make_result(title="High Match", score=0.9),
        _make_result(title="Low Match", score=0.3),
        _make_result(title="Medium Match", score=0.6),
    ]
    mock_memory_service.search_documents.return_value = results
    builder = ContextBuilder(
        memory_service=mock_memory_service,
        config=ContextBuilderConfig(min_similarity_score=0.5),
    )

    got = await builder.search_memory(query="test")
    assert len(got) == 2
    assert all(r.score >= 0.5 for r in got)


# ---------------------------------------------------------------------------
# build_context_block
# ---------------------------------------------------------------------------


class TestBuildContextBlock:
    def test_empty_results_returns_empty_string(self, builder: ContextBuilder) -> None:
        assert builder.build_context_block([]) == ""

    def test_single_result(self, builder: ContextBuilder) -> None:
        doc = _make_result(
            title="Startup Guide",
            source="docs.nexus.ai",
            snippet="First steps for founders.",
            score=0.95,
        )
        block = builder.build_context_block([doc])
        assert "Startup Guide" in block
        assert "docs.nexus.ai" in block
        assert "First steps for founders." in block
        assert "0.95" in block

    def test_multiple_results_separated(self, builder: ContextBuilder) -> None:
        docs = [
            _make_result(title="Doc A", snippet="Content A", score=0.9),
            _make_result(title="Doc B", snippet="Content B", score=0.8),
        ]
        block = builder.build_context_block(docs)
        assert block.count("[Doc A]") == 1
        assert block.count("[Doc B]") == 1

    def test_context_length_limit(self) -> None:
        doc = _make_result(
            title="Long Doc",
            source="wiki",
            snippet="A" * 500,
            score=0.9,
        )
        builder = ContextBuilder(
            memory_service=AsyncMock(),
            config=ContextBuilderConfig(max_context_length=100),
        )
        block = builder.build_context_block([doc])
        assert len(block) <= 105  # allow for trailing "..."
        assert block.endswith("...")


# ---------------------------------------------------------------------------
# build_prompt_with_context
# ---------------------------------------------------------------------------


class TestBuildPromptWithContext:
    def test_no_context_returns_original_prompt(self, builder: ContextBuilder) -> None:
        result = builder.build_prompt_with_context("Hello", "")
        assert result == "Hello"

    def test_with_context_injects_block(self, builder: ContextBuilder) -> None:
        context = "[Doc Title](source)\nSnippet\nScore: 0.90"
        result = builder.build_prompt_with_context("Founder Request", context)
        assert "Relevant Workspace Knowledge" in result
        assert "---" in result
        assert context in result
        assert "Founder Request" in result
        assert result.endswith("Founder Request")


# ---------------------------------------------------------------------------
# Top-k config
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_respects_custom_top_k(mock_memory_service: AsyncMock) -> None:
    mock_memory_service.search_documents.return_value = [_make_result() for _ in range(10)]
    builder = ContextBuilder(
        memory_service=mock_memory_service,
        config=ContextBuilderConfig(top_k=3),
    )
    await builder.search_memory(query="test")
    mock_memory_service.search_documents.assert_awaited_once_with(
        query="test",
        top_k=3,
        workspace_id=None,
    )
