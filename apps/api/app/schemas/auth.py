from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ApiResponse[T](BaseModel):
    data: T | None = None
    error: dict | None = None
    meta: dict = Field(default_factory=dict)


class NonceData(BaseModel):
    nonce: str
    message: str
    expires_at: datetime


class VerifyRequest(BaseModel):
    wallet: str = Field(..., min_length=42, max_length=42)
    signature: str = Field(..., min_length=10)
    message: str = Field(..., min_length=10)


class UserPublic(BaseModel):
    id: UUID
    wallet_address: str
    username: str | None = None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class AuthTokens(BaseModel):
    access_token: str
    user: UserPublic


class VerifyData(BaseModel):
    access_token: str
    user: UserPublic
