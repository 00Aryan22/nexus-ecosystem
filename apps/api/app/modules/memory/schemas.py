import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DocumentCreate(BaseModel):
    workspace_id: str | None = None
    title: str = Field(..., min_length=1, max_length=255)
    source: str = Field(..., max_length=100)
    content: str = Field(..., min_length=1)
    doc_metadata: dict[str, Any] | None = None


class DocumentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    source: str | None = Field(None, max_length=100)
    content: str | None = Field(None, min_length=1)
    doc_metadata: dict[str, Any] | None = None


class DocumentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: str | None
    title: str
    source: str
    content: str
    doc_metadata: dict[str, Any] | None
    embedding_provider: str
    embedding_model: str
    created_at: datetime
    updated_at: datetime


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=50)
    workspace_id: str | None = None


class SearchResultItem(BaseModel):
    id: uuid.UUID
    title: str
    source: str
    snippet: str
    score: float
    doc_metadata: dict[str, Any] | None
    created_at: datetime
