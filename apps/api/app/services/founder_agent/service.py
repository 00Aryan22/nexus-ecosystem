import logging
import time
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.modules.founder_agent.models import (
    AgentConversation,
    AgentMessage,
    AIOutput,
    StartupPlan,
    UsageStat,
)
from app.services.founder_agent.prompts import (
    SYSTEM_PROMPT_FOUNDER_AGENT,
    build_enhanced_prompt,
    detect_plan_type,
)
from app.services.llm.provider import llm_router

logger = logging.getLogger(__name__)


async def get_or_create_conversation(
    db: AsyncSession,
    user: User,
    conversation_id: str | None = None,
) -> AgentConversation:
    if conversation_id:
        result = await db.execute(
            select(AgentConversation).where(
                AgentConversation.id == conversation_id,
                AgentConversation.user_id == user.id,
            )
        )
        conversation = result.scalars().first()
        if conversation:
            return conversation

    conversation = AgentConversation(user_id=user.id, title="New Conversation")
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def list_user_conversations(db: AsyncSession, user_id: UUID) -> list[AgentConversation]:
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.user_id == user_id)
        .order_by(AgentConversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation_for_user(
    db: AsyncSession,
    conversation_id: str,
    user_id: UUID,
) -> AgentConversation | None:
    result = await db.execute(
        select(AgentConversation).where(
            AgentConversation.id == conversation_id,
            AgentConversation.user_id == user_id,
        )
    )
    return result.scalars().first()


async def delete_conversation(db: AsyncSession, conversation_id: str, user_id: UUID) -> bool:
    result = await db.execute(
        delete(AgentConversation).where(
            AgentConversation.id == conversation_id,
            AgentConversation.user_id == user_id,
        )
    )
    await db.commit()
    return result.rowcount > 0


async def update_conversation_title(
    db: AsyncSession,
    conversation_id: str,
    user_id: UUID,
    title: str,
) -> AgentConversation | None:
    conversation = await get_conversation_for_user(db, conversation_id, user_id)
    if not conversation:
        return None
    conversation.title = title
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_conversation_history(db: AsyncSession, conversation_id: str) -> list[dict[str, str]]:
    result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conversation_id)
        .order_by(AgentMessage.created_at.asc())
    )
    messages = result.scalars().all()

    history: list[dict[str, str]] = []
    for msg in messages:
        history.append(
            {
                "role": "user" if msg.sender == "user" else "assistant",
                "content": msg.content,
            }
        )
    return history


async def append_message(
    db: AsyncSession,
    conversation_id: str,
    sender: str,
    content: str,
) -> AgentMessage:
    msg = AgentMessage(
        conversation_id=conversation_id,
        sender=sender,
        content=content,
    )
    db.add(msg)

    result = await db.execute(
        select(AgentConversation).where(AgentConversation.id == conversation_id)
    )
    conversation = result.scalars().first()
    if conversation and conversation.title == "New Conversation" and sender == "user":
        conversation.title = content[:80] + ("..." if len(content) > 80 else "")

    await db.commit()
    await db.refresh(msg)
    return msg


async def save_startup_plan(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: UUID,
    plan_type: str,
    content: str,
) -> StartupPlan:
    plan = StartupPlan(
        conversation_id=conversation_id,
        user_id=user_id,
        plan_type=plan_type,
        content_json={"markdown": content, "plan_type": plan_type},
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


async def save_ai_output(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: UUID,
    output_type: str,
    content: str,
    provider: str,
    tokens_used: int | None = None,
) -> AIOutput:
    output = AIOutput(
        conversation_id=conversation_id,
        user_id=user_id,
        output_type=output_type,
        content=content,
        provider=provider,
        tokens_used=tokens_used,
    )
    db.add(output)
    await db.commit()
    await db.refresh(output)
    return output


async def record_usage(
    db: AsyncSession,
    *,
    user_id: UUID,
    provider: str,
    tokens_input: int,
    tokens_output: int,
    latency_ms: int,
) -> UsageStat:
    stat = UsageStat(
        user_id=user_id,
        feature="founder_agent",
        provider=provider,
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        latency_ms=latency_ms,
    )
    db.add(stat)
    await db.commit()
    await db.refresh(stat)
    return stat


async def get_usage_summary(db: AsyncSession, user_id: UUID) -> dict[str, object]:
    result = await db.execute(
        select(
            func.count(UsageStat.id),
            func.coalesce(func.sum(UsageStat.tokens_input), 0),
            func.coalesce(func.sum(UsageStat.tokens_output), 0),
            func.coalesce(func.avg(UsageStat.latency_ms), 0),
        ).where(
            UsageStat.user_id == user_id,
            UsageStat.feature == "founder_agent",
        )
    )
    total_requests, tokens_in, tokens_out, avg_latency = result.one()

    provider_result = await db.execute(
        select(UsageStat.provider, func.count(UsageStat.id))
        .where(UsageStat.user_id == user_id, UsageStat.feature == "founder_agent")
        .group_by(UsageStat.provider)
    )
    by_provider = {row[0]: row[1] for row in provider_result.all()}

    return {
        "total_requests": int(total_requests or 0),
        "total_tokens_input": int(tokens_in or 0),
        "total_tokens_output": int(tokens_out or 0),
        "avg_latency_ms": float(avg_latency or 0),
        "by_provider": by_provider,
    }


async def list_startup_plans(
    db: AsyncSession,
    conversation_id: str,
    user_id: UUID,
) -> list[StartupPlan]:
    conversation = await get_conversation_for_user(db, conversation_id, user_id)
    if not conversation:
        return []
    result = await db.execute(
        select(StartupPlan)
        .where(StartupPlan.conversation_id == conversation_id)
        .order_by(StartupPlan.created_at.desc())
    )
    return list(result.scalars().all())


async def stream_agent_response(
    db: AsyncSession,
    conversation_id: str,
    user_id: UUID,
    prompt: str,
    plan_type_hint: str | None = None,
):
    plan_type = detect_plan_type(prompt, plan_type_hint)
    enhanced_prompt = build_enhanced_prompt(prompt, plan_type)
    history = await get_conversation_history(db, conversation_id)
    llm_history = history
    if history and history[-1]["role"] == "user" and history[-1]["content"] == prompt:
        llm_history = history[:-1]

    start = time.perf_counter()
    full_response = ""
    provider_name = "unknown"

    async for chunk, provider in llm_router.stream_generate_with_meta(
        prompt=enhanced_prompt,
        system=SYSTEM_PROMPT_FOUNDER_AGENT,
        history=llm_history,
    ):
        if provider:
            provider_name = provider
        full_response += chunk
        yield chunk

    latency_ms = int((time.perf_counter() - start) * 1000)
    tokens_input = len(prompt.split())
    tokens_output = len(full_response.split())

    await append_message(db, conversation_id, "agent", full_response)
    await save_ai_output(
        db,
        conversation_id=conversation_id,
        user_id=user_id,
        output_type=plan_type or "chat",
        content=full_response,
        provider=provider_name,
        tokens_used=tokens_input + tokens_output,
    )
    await record_usage(
        db,
        user_id=user_id,
        provider=provider_name,
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        latency_ms=latency_ms,
    )

    if plan_type:
        await save_startup_plan(
            db,
            conversation_id=conversation_id,
            user_id=user_id,
            plan_type=plan_type,
            content=full_response,
        )
        logger.info(
            "Saved startup plan type=%s conversation=%s user=%s",
            plan_type,
            conversation_id,
            user_id,
        )
