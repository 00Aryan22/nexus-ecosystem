import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.auth import User
from app.modules.memory.embeddings import OllamaEmbedding
from app.modules.memory.schemas import (
    DocumentCreate,
    DocumentPublic,
    SearchQuery,
    SearchResultItem,
)
from app.modules.memory.service import MemoryService
from app.modules.memory.vector_store import ChromaDBVectorStore
from app.schemas.common import ApiResponse, PaginationMeta

logger = logging.getLogger(__name__)

# Lazy singletons for the embedding provider and vector store.
_embedding = None
_vector_store = None


def _get_embedding():
    global _embedding
    if _embedding is None:
        _embedding = OllamaEmbedding()
    return _embedding


def _get_vector_store():
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaDBVectorStore()
    return _vector_store


def _get_service(db: AsyncSession) -> MemoryService:
    return MemoryService(db, _get_embedding(), _get_vector_store())


router = APIRouter(
    prefix="/memory",
    tags=["memory"],
    responses={401: {"description": "Authentication required"}},
)


@router.get(
    "/documents",
    response_model=ApiResponse[list[DocumentPublic]],
    summary="List knowledge documents",
)
async def list_documents(
    workspace_id: str | None = Query(None, description="Filter by workspace ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = _get_service(db)
    docs, total = await service.list_documents(
        workspace_id=workspace_id, page=page, page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size
    meta = PaginationMeta(
        page=page, page_size=page_size, total=total, total_pages=total_pages
    )
    return ApiResponse(
        data=[DocumentPublic.model_validate(d) for d in docs],
        meta=meta.model_dump(),
    )


@router.post(
    "/documents",
    response_model=ApiResponse[DocumentPublic],
    status_code=201,
    summary="Create a knowledge document",
)
async def create_document(
    body: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = _get_service(db)
    doc = await service.create_document(body)
    return ApiResponse(data=DocumentPublic.model_validate(doc))


@router.delete(
    "/documents/{document_id}",
    response_model=ApiResponse[dict],
    summary="Delete a knowledge document",
)
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = _get_service(db)
    deleted = await service.delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return ApiResponse(data={"deleted": True})


@router.post(
    "/search",
    response_model=ApiResponse[list[SearchResultItem]],
    summary="Semantic search across knowledge documents",
)
async def search_documents(
    body: SearchQuery,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = _get_service(db)
    results = await service.search_documents(
        query=body.query, top_k=body.top_k, workspace_id=body.workspace_id
    )
    return ApiResponse(data=results)
