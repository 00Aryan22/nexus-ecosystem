from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AuditStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class AuditSubmit(BaseModel):
    contract_name: str | None = Field(default=None, max_length=255)
    source_code: str = Field(..., min_length=1, max_length=200_000)


class AuditPublic(BaseModel):
    id: UUID
    user_id: UUID
    contract_name: str | None
    source_hash: str
    status: str
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    overall_risk: str | None
    report_summary: str | None
    ai_model_used: str
    processing_ms: int | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class AuditDetail(AuditPublic):
    report_json: dict[str, Any] | None = None


class GasOptimizationRequest(BaseModel):
    contract_name: str | None = Field(default=None, max_length=255)
    source_code: str = Field(..., min_length=1, max_length=200_000)


class GasOptimizationItem(BaseModel):
    title: str
    description: str
    recommendation: str
    estimated_savings: str | None = None


class GasOptimizationResponse(BaseModel):
    optimizations: list[GasOptimizationItem]
    estimated_gas_savings: str
    contract_name: str | None = None
