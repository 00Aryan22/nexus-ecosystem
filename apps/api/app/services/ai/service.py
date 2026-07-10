from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.modules.ai.models import UserAISettings
from app.modules.ai.schemas import AISettings
from app.services.llm.registry import ProviderRegistry

_STALE_MODELS = {"gemini-1.5-pro", "gemini-1.5-flash"}


async def get_ai_settings(db: AsyncSession, user: User) -> AISettings:
    result = await db.execute(select(UserAISettings).where(UserAISettings.user_id == user.id))
    settings = result.scalars().first()
    if not settings:
        return AISettings(
            default_provider=user.default_llm_provider,
            default_model=_default_for_provider(user.default_llm_provider),
        )

    migrated = False
    model = settings.default_model
    if model in _STALE_MODELS:
        model = _default_for_provider(settings.default_provider)
        settings.default_model = model
        migrated = True

    provider = settings.default_provider or user.default_llm_provider
    if migrated:
        await db.commit()
        await db.refresh(settings)

    return AISettings(
        default_provider=provider,
        default_model=model,
        temperature=settings.temperature,
        top_p=settings.top_p,
        max_tokens=settings.max_tokens,
        streaming_enabled=settings.streaming_enabled,
        memory_enabled=settings.memory_enabled,
        max_retrieved_docs=settings.max_retrieved_docs,
    )


async def update_ai_settings(db: AsyncSession, user: User, update: AISettings) -> AISettings:
    result = await db.execute(select(UserAISettings).where(UserAISettings.user_id == user.id))
    settings = result.scalars().first()
    if not settings:
        settings = UserAISettings(
            user_id=user.id,
        )
        db.add(settings)

    settings.default_provider = update.defaultProvider
    settings.default_model = update.defaultModel
    settings.temperature = update.temperature
    settings.top_p = update.topP
    settings.max_tokens = update.maxTokens
    settings.streaming_enabled = update.streamingEnabled
    settings.memory_enabled = update.memoryEnabled
    settings.max_retrieved_docs = update.maxRetrievedDocs

    # Sync default provider to User model for backward compat
    user.default_llm_provider = update.defaultProvider
    db.add(user)

    await db.commit()
    await db.refresh(settings)
    return AISettings(
        default_provider=settings.default_provider,
        default_model=settings.default_model,
        temperature=settings.temperature,
        top_p=settings.top_p,
        max_tokens=settings.max_tokens,
        streaming_enabled=settings.streaming_enabled,
        memory_enabled=settings.memory_enabled,
        max_retrieved_docs=settings.max_retrieved_docs,
    )


def _default_for_provider(provider: str) -> str:
    try:
        p = ProviderRegistry.get(provider)
        return p.default_model
    except ValueError:
        return "gemini-2.0-flash"
