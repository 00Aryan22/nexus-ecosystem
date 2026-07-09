import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.auth import User
from app.modules.ai.schemas import AIModelPublic, AIProviderHealth, AIProviderPublic, AISettings
from app.schemas.common import ApiResponse
from app.services.ai.service import get_ai_settings, update_ai_settings
from app.services.llm.registry import ProviderRegistry
from app.services.llm.router import llm_router

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    responses={401: {"description": "Authentication required"}},
)


@router.get(
    "/providers",
    response_model=ApiResponse[list[AIProviderPublic]],
    summary="List all available AI providers",
)
async def list_providers():
    providers: list[AIProviderPublic] = []
    for name in ProviderRegistry.list_providers():
        p = ProviderRegistry.get(name)
        providers.append(
            AIProviderPublic(
                id=name,
                displayName=p.display_name,
                healthy=True,
                defaultModel=p.default_model,
                supportsStreaming=p.supports_streaming,
                supportsVision=p.supports_vision,
            )
        )
    return ApiResponse(data=providers)


@router.get(
    "/providers/{provider}/models",
    response_model=ApiResponse[list[AIModelPublic]],
    summary="List available models for a provider (path param)",
)
async def list_providers_models(provider: str):
    try:
        p = ProviderRegistry.get(provider)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    models = await p.model_list()
    return ApiResponse(data=[AIModelPublic(id=m) for m in models])


@router.get(
    "/models",
    response_model=ApiResponse[list[AIModelPublic]],
    summary="List available models for a provider (query param)",
)
async def list_models(
    provider: str = Query(..., description="Provider ID (e.g. gemini, ollama, openai)"),
):
    try:
        p = ProviderRegistry.get(provider)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    models = await p.model_list()
    return ApiResponse(data=[AIModelPublic(id=m) for m in models])


@router.get(
    "/settings",
    response_model=ApiResponse[AISettings],
    summary="Get user AI settings",
)
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    settings = await get_ai_settings(db, user)
    return ApiResponse(data=settings)


@router.put(
    "/settings",
    response_model=ApiResponse[AISettings],
    summary="Update user AI settings",
)
async def update_settings(
    body: AISettings,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    available = ProviderRegistry.list_providers()
    if body.defaultProvider not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown provider '{body.defaultProvider}'. Available: {', '.join(available)}",
        )

    settings = await update_ai_settings(db, user, body)
    return ApiResponse(data=settings)


@router.get(
    "/health",
    response_model=ApiResponse[list[AIProviderHealth]],
    summary="Get health status of all AI providers",
)
async def provider_health():
    results: list[AIProviderHealth] = []
    for name in ProviderRegistry.list_providers():
        p = ProviderRegistry.get(name)
        configured = await p.health()
        status = await llm_router.detailed_provider_health(name)
        results.append(
            AIProviderHealth(
                provider=name,
                displayName=p.display_name,
                status=status.value,
                configured=configured,
            )
        )
    return ApiResponse(data=results)
