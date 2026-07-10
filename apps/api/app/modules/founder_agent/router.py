import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limit import check_rate_limit
from app.models.auth import User
from app.modules.founder_agent.models import AgentMessage, StartupPlan
from app.modules.founder_agent.schemas import (
    AgentConversationDetail,
    AgentConversationPublic,
    AgentMessagePublic,
    ChatRequest,
    ConversationSearchResult,
    ConversationUpdateRequest,
    PromptSuggestion,
    ProviderPreference,
    ProviderStatus,
    StartupPlanPublic,
    UsageSummary,
)
from app.schemas.common import ApiResponse
from app.services.ai.context_builder import create_context_builder
from app.services.founder_agent.prompts import PROMPT_SUGGESTIONS
from app.services.founder_agent.service import (
    delete_conversation,
    export_conversation,
    get_conversation_for_user,
    get_or_create_conversation,
    get_usage_summary,
    list_archived_conversations,
    list_startup_plans,
    list_user_conversations,
    search_conversations,
    stream_agent_response,
    update_conversation,
)
from app.services.llm.base import sanitize_provider_error
from app.services.llm.provider import ProviderRegistry
from app.services.llm.validation import validate_provider_model

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/founder-agent",
    tags=["founder_agent"],
    responses={401: {"description": "Authentication required"}},
)


@router.get(
    "/conversations",
    response_model=ApiResponse[list[AgentConversationPublic]],
    summary="List conversations",
)
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversations = await list_user_conversations(db, user.id)
    return ApiResponse(data=[AgentConversationPublic.model_validate(c) for c in conversations])


@router.get(
    "/conversations/search",
    response_model=ApiResponse[list[ConversationSearchResult]],
    summary="Search conversations",
)
async def search_conversations_endpoint(
    q: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not q.strip():
        return ApiResponse(data=[])
    results = await search_conversations(db, user.id, q.strip())
    return ApiResponse(data=[ConversationSearchResult.model_validate(r) for r in results])


@router.post(
    "/conversations",
    response_model=ApiResponse[AgentConversationPublic],
    summary="Create new conversation",
)
async def create_conversation(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await get_or_create_conversation(db, user)
    return ApiResponse(data=AgentConversationPublic.model_validate(conv))


@router.get(
    "/conversations/archived",
    response_model=ApiResponse[list[AgentConversationPublic]],
    summary="List archived conversations",
)
async def list_archived(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversations = await list_archived_conversations(db, user.id)
    return ApiResponse(data=[AgentConversationPublic.model_validate(c) for c in conversations])


@router.get(
    "/conversations/{conversation_id}",
    response_model=ApiResponse[AgentConversationDetail],
    summary="Get conversation history",
)
async def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await get_conversation_for_user(db, conversation_id, user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages_result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conversation_id)
        .order_by(AgentMessage.created_at.asc())
    )
    messages = messages_result.scalars().all()

    # Build the detail schema from the ORM object + eagerly loaded messages.
    # Do NOT pass the ORM conversation directly to AgentConversationDetail.model_validate
    # because that triggers lazy-loading the `messages` relationship outside an
    # async greenlet (MissingGreenlet error).
    conv_data = AgentConversationDetail(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[AgentMessagePublic.model_validate(m) for m in messages],
    )
    return ApiResponse(data=conv_data)


@router.get(
    "/conversations/{conversation_id}/export",
    summary="Export a conversation in markdown, JSON, or PDF format",
    responses={
        200: {
            "content": {
                "text/markdown": {},
                "application/json": {},
                "application/pdf": {},
            },
        },
        400: {"description": "Unsupported format"},
        404: {"description": "Conversation not found"},
    },
)
async def get_conversation_export(
    conversation_id: str,
    fmt: str = Query("md", alias="format", description="Export format: md, json, or pdf"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content, media_type = await export_conversation(db, conversation_id, user.id, fmt)
    filename_suffix = fmt
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="conversation-{conversation_id[:8]}.{filename_suffix}"'
            )
        },
    )


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ApiResponse[AgentConversationPublic],
    summary="Update conversation title",
)
async def patch_conversation(
    conversation_id: str,
    body: ConversationUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await update_conversation(
        db,
        conversation_id,
        user.id,
        title=body.title,
        is_pinned=body.is_pinned,
        is_archived=body.is_archived,
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ApiResponse(data=AgentConversationPublic.model_validate(conv))


@router.delete(
    "/conversations/{conversation_id}",
    response_model=ApiResponse[dict[str, bool]],
    summary="Delete conversation",
)
async def remove_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_conversation(db, conversation_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ApiResponse(data={"deleted": True})


@router.post(
    "/conversations/{conversation_id}/chat",
    summary="Chat with the Founder Agent",
    description="Streams SSE response chunks back to the client.",
)
async def chat_with_agent(
    conversation_id: str,
    body: ChatRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_rate_limit(request, bucket="founder_agent:chat", limit=20, window_seconds=60)

    conv = await get_conversation_for_user(db, conversation_id, user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    from app.services.founder_agent.service import append_message

    await append_message(db, conversation_id, "user", body.prompt)

    resolved_provider = body.provider or user.default_llm_provider

    resolved_model = await validate_provider_model(resolved_provider, body.model)

    context_builder = create_context_builder(db) if body.enable_memory else None

    async def sse_generator():
        try:
            async for chunk in stream_agent_response(
                db,
                conversation_id,
                user.id,
                body.prompt,
                body.plan_type,
                provider_name=resolved_provider,
                model_name=resolved_model,
                context_builder=context_builder,
                enable_memory=body.enable_memory,
            ):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as exc:
            logger.exception("Founder agent stream failed")
            safe_error = sanitize_provider_error(exc)
            yield f"data: {json.dumps({'error': safe_error})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get(
    "/conversations/{conversation_id}/plans",
    response_model=ApiResponse[list[StartupPlanPublic]],
    summary="List startup plans for a conversation",
)
async def get_conversation_plans(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await get_conversation_for_user(db, conversation_id, user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    plans = await list_startup_plans(db, conversation_id, user.id)
    return ApiResponse(data=[StartupPlanPublic.model_validate(p) for p in plans])


@router.get(
    "/plans/{plan_id}",
    response_model=ApiResponse[StartupPlanPublic],
    summary="Get a startup plan by ID",
)
async def get_plan(
    plan_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StartupPlan).where(StartupPlan.id == plan_id, StartupPlan.user_id == user.id)
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return ApiResponse(data=StartupPlanPublic.model_validate(plan))


@router.get(
    "/usage",
    response_model=ApiResponse[UsageSummary],
    summary="Get founder agent usage statistics",
)
async def get_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    summary = await get_usage_summary(db, user.id)
    return ApiResponse(data=UsageSummary.model_validate(summary))


@router.get(
    "/prompts/suggestions",
    response_model=ApiResponse[list[PromptSuggestion]],
    summary="Get prompt suggestions for the Founder Agent",
)
async def get_prompt_suggestions():
    suggestions = [PromptSuggestion.model_validate(s) for s in PROMPT_SUGGESTIONS]
    return ApiResponse(data=suggestions)


@router.get(
    "/provider/preferences",
    response_model=ApiResponse[ProviderPreference],
    summary="Get user's LLM provider preferences",
)
async def get_provider_preferences(
    user: User = Depends(get_current_user),
):
    return ApiResponse(data=ProviderPreference(provider=user.default_llm_provider))


@router.put(
    "/provider/preferences",
    response_model=ApiResponse[ProviderPreference],
    summary="Update user's LLM provider preferences",
)
async def update_provider_preferences(
    body: ProviderPreference,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    available = ProviderRegistry.list_providers()
    if body.provider not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown provider '{body.provider}'. Available: {', '.join(available)}",
        )
    user.default_llm_provider = body.provider
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return ApiResponse(data=ProviderPreference(provider=user.default_llm_provider))


@router.get(
    "/provider/status",
    response_model=ApiResponse[list[ProviderStatus]],
    summary="Get health status of all LLM providers",
)
async def get_provider_status():
    results: list[ProviderStatus] = []
    for name in ProviderRegistry.list_providers():
        provider = ProviderRegistry.get(name)
        configured = await provider.health()
        health_status = await provider.detailed_health()
        available = health_status.value in ("healthy",)
        results.append(
            ProviderStatus(
                name=name,
                displayName=provider.display_name,
                available=available,
                configured=configured,
                health_status=health_status.value,
            )
        )
    return ApiResponse(data=results)
