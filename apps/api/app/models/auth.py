import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.types import GUID


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    wallet_address: Mapped[str] = mapped_column(String(42), unique=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="founder")
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    default_llm_provider: Mapped[str] = mapped_column(String(30), nullable=False, default="gemini")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    wallets: Mapped[list["Wallet"]] = relationship(back_populates="user", cascade="all, delete")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all, delete")
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete")
    skill_passports: Mapped[list["SkillPassport"]] = relationship(
        back_populates="user", cascade="all, delete"
    )
    nft_records: Mapped[list["NftRecord"]] = relationship(
        back_populates="user", cascade="all, delete"
    )
    audits: Mapped[list["Audit"]] = relationship(back_populates="user", cascade="all, delete")
    analytics_events: Mapped[list["AnalyticsEvent"]] = relationship(
        back_populates="user", cascade="all, delete"
    )


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    address: Mapped[str] = mapped_column(String(42), unique=True, nullable=False)
    chain_id: Mapped[int] = mapped_column(nullable=False, default=80002)
    nonce: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    nonce_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="wallets")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    jwt_jti: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(42), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="sessions")
    analytics_events: Mapped[list["AnalyticsEvent"]] = relationship(
        back_populates="session", cascade="all, delete"
    )
