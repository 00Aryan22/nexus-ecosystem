import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
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
    ConversationUpdateRequest,
    PromptSuggestion,
    StartupPlanPublic,
    UsageSummary,
)
from app.schemas.common import ApiResponse
from app.services.founder_agent.prompts import PROMPT_SUGGESTIONS
from app.services.founder_agent.service import (
    delete_conversation,
    get_conversation_for_user,
    get_or_create_conversation,
    get_usage_summary,
    list_startup_plans,
    list_user_conversations,
    stream_agent_response,
    update_conversation_title,
)

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

    conv_data = AgentConversationDetail.model_validate(conv)
    conv_data.messages = [AgentMessagePublic.model_validate(m) for m in messages]
    return ApiResponse(data=conv_data)


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
    conv = await update_conversation_title(db, conversation_id, user.id, body.title)
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

    async def sse_generator():
        try:
            async for chunk in stream_agent_response(
                db,
                conversation_id,
                user.id,
                body.prompt,
                body.plan_type,
            ):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as exc:
            logger.exception("Founder agent stream failed")
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

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
