from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class PassportStatus(StrEnum):
    PENDING = "pending"
    EVALUATING = "evaluating"
    APPROVED = "approved"
    REJECTED = "rejected"
    MINTING = "minting"
    MINTED = "minted"


class SkillPassportCreate(BaseModel):
    skill_category: str = Field(..., min_length=1, max_length=100)
    skill_name: str = Field(..., min_length=1, max_length=255)
    evidence_url: HttpUrl
    evidence_description: str | None = Field(default=None, max_length=5000)


class PassportMintRequest(BaseModel):
    wallet_address: str | None = Field(default=None, max_length=42)


class SkillPassportUpdate(BaseModel):
    skill_category: str | None = Field(default=None, min_length=1, max_length=100)
    skill_name: str | None = Field(default=None, min_length=1, max_length=255)
    evidence_url: HttpUrl | None = None
    evidence_description: str | None = Field(default=None, max_length=5000)
    evaluation_score: Decimal | None = Field(default=None, ge=0, le=100)
    evaluation_notes: str | None = Field(default=None, max_length=10000)
    status: PassportStatus | None = None
    ipfs_metadata_uri: str | None = Field(default=None, max_length=500)


class NftRecordPublic(BaseModel):
    id: UUID
    passport_id: UUID
    user_id: UUID
    token_id: int
    contract_address: str
    chain_id: int
    tx_hash: str
    block_number: int
    metadata_json: dict[str, Any]
    minted_at: datetime

    model_config = {"from_attributes": True}


class SkillPassportPublic(BaseModel):
    id: UUID
    user_id: UUID
    skill_category: str
    skill_name: str
    evidence_url: str
    evidence_description: str | None
    evaluation_score: Decimal
    evaluation_notes: str | None
    status: str
    ipfs_metadata_uri: str | None
    created_at: datetime
    updated_at: datetime
    nft_record: NftRecordPublic | None = None

    model_config = {"from_attributes": True}
