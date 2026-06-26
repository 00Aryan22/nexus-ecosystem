from typing import TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse[T](BaseModel):
    data: T | None = None
    error: dict | None = None
    meta: dict = Field(default_factory=dict)


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
