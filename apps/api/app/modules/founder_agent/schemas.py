from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AgentMessagePublic(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentConversationPublic(BaseModel):
    id: str
    user_id: UUID
    title: str | None = None
    is_pinned: bool = False
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentConversationDetail(AgentConversationPublic):
    messages: list[AgentMessagePublic] = []

    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    plan_type: str | None = Field(
        default=None,
        description="Optional framework hint (e.g. lean_canvas, swot, pitch_deck)",
    )
    provider: str | None = Field(
        default=None,
        description="Optional LLM provider override (emergent, gemini, ollama)",
    )
    model: str | None = Field(
        default=None,
        description="Optional model override (e.g. gemini-2.0-flash, gpt-4o)",
    )
    enable_memory: bool = Field(
        default=True,
        description="Enable semantic memory search to inject relevant workspace knowledge",
    )


class ProviderPreference(BaseModel):
    provider: str = Field(default="gemini", description="Default LLM provider")


class ProviderStatus(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    displayName: str = Field(validation_alias="display_name")
    available: bool
    configured: bool
    healthStatus: str | None = Field(default=None, validation_alias="health_status")


class StartupPlanPublic(BaseModel):
    id: str
    conversation_id: str
    plan_type: str
    content_json: Any
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AIOutputPublic(BaseModel):
    id: str
    conversation_id: str
    output_type: str
    content: str
    provider: str
    tokens_used: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UsageStatPublic(BaseModel):
    id: str
    feature: str
    provider: str
    tokens_input: int
    tokens_output: int
    latency_ms: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UsageSummary(BaseModel):
    total_requests: int
    total_tokens_input: int
    total_tokens_output: int
    avg_latency_ms: float
    by_provider: dict[str, int]


class PromptSuggestion(BaseModel):
    label: str
    prompt: str
    plan_type: str | None = None


class ConversationUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    is_pinned: bool | None = None
    is_archived: bool | None = None


class ConversationSearchResult(BaseModel):
    id: str
    title: str | None = None
    match_preview: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
