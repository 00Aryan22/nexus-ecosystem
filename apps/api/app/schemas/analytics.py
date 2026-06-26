from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AnalyticsEventCreate(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=100)
    event_data: dict[str, Any] | None = None
    wallet_address: str | None = Field(default=None, max_length=42)


class AnalyticsEventPublic(BaseModel):
    id: UUID
    user_id: UUID | None
    session_id: UUID | None
    event_type: str
    event_data: dict[str, Any] | None
    wallet_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    total_projects: int
    total_passports: int
    total_audits: int
    completed_audits: int
    minted_passports: int
    recent_events: list[AnalyticsEventPublic]
