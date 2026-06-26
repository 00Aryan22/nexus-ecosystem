from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectStage(StrEnum):
    IDEA = "idea"
    VALIDATED = "validated"
    BUILDING = "building"
    LAUNCHED = "launched"


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: str = Field(..., min_length=1, max_length=100)
    problem_statement: str = Field(..., min_length=10, max_length=10000)
    usp: str | None = Field(default=None, max_length=5000)
    stage: ProjectStage = ProjectStage.IDEA
    is_public: bool = False


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    industry: str | None = Field(default=None, min_length=1, max_length=100)
    problem_statement: str | None = Field(default=None, min_length=10, max_length=10000)
    usp: str | None = Field(default=None, max_length=5000)
    stage: ProjectStage | None = None
    plan_json: dict[str, Any] | None = None
    roadmap_json: dict[str, Any] | None = None
    tokenomics_json: dict[str, Any] | None = None
    is_public: bool | None = None


class ProjectPublic(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    industry: str
    problem_statement: str
    usp: str | None
    stage: str
    plan_json: dict[str, Any] | None
    roadmap_json: dict[str, Any] | None
    tokenomics_json: dict[str, Any] | None
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
