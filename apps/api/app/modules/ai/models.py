import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import GUID


class UserAISettings(Base):
    __tablename__ = "user_ai_settings"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    default_provider: Mapped[str] = mapped_column(String(30), nullable=False, default="gemini")
    default_model: Mapped[str] = mapped_column(
        String(100), nullable=False, default="gemini-1.5-pro"
    )
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)
    top_p: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    max_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=4096)
    streaming_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    memory_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    max_retrieved_docs: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
