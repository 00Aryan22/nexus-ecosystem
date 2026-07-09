from pydantic import BaseModel, ConfigDict, Field


class AIProviderPublic(BaseModel):
    id: str
    displayName: str
    healthy: bool
    defaultModel: str
    supportsStreaming: bool
    supportsVision: bool


class AIModelPublic(BaseModel):
    id: str


class AISettings(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    defaultProvider: str = Field(default="gemini", validation_alias="default_provider")
    defaultModel: str = Field(default="gemini-1.5-pro", validation_alias="default_model")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    topP: float = Field(default=1.0, ge=0.0, le=1.0, validation_alias="top_p")
    maxTokens: int = Field(default=4096, ge=1, le=128000, validation_alias="max_tokens")
    streamingEnabled: bool = Field(default=True, validation_alias="streaming_enabled")
    memoryEnabled: bool = Field(default=True, validation_alias="memory_enabled")
    maxRetrievedDocs: int = Field(default=5, ge=1, le=50, validation_alias="max_retrieved_docs")


class AIProviderHealth(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str
    displayName: str = Field(validation_alias="display_name")
    status: str
    configured: bool
