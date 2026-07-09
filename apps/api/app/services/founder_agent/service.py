import datetime
import io
import json
import logging
import time
from uuid import UUID

from fastapi import HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.modules.founder_agent.models import (
    AgentConversation,
    AgentMessage,
    AIOutput,
    StartupPlan,
    UsageStat,
)
from app.services.ai.context_builder import ContextBuilder
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
        .where(AgentConversation.is_archived.is_(False))
        .order_by(AgentConversation.is_pinned.desc(), AgentConversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def list_archived_conversations(db: AsyncSession, user_id: UUID) -> list[AgentConversation]:
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.user_id == user_id)
        .where(AgentConversation.is_archived.is_(True))
        .order_by(AgentConversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def search_conversations(
    db: AsyncSession,
    user_id: UUID,
    query: str,
) -> list[dict[str, object]]:
    pattern = f"%{query.lower()}%"

    conv_ids_result = await db.execute(
        select(AgentConversation.id)
        .outerjoin(AgentMessage, AgentMessage.conversation_id == AgentConversation.id)
        .where(
            AgentConversation.user_id == user_id,
            or_(
                func.lower(AgentConversation.title).like(pattern),
                func.lower(AgentMessage.content).like(pattern),
            ),
        )
        .distinct()
    )
    conv_ids = [row[0] for row in conv_ids_result.fetchall()]
    if not conv_ids:
        return []

    convs_result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.id.in_(conv_ids))
        .order_by(AgentConversation.updated_at.desc())
    )
    conversations = convs_result.scalars().all()

    results: list[dict[str, object]] = []
    for conv in conversations:
        match_preview = None
        msg_result = await db.execute(
            select(AgentMessage.content)
            .where(
                AgentMessage.conversation_id == conv.id,
                func.lower(AgentMessage.content).like(pattern),
            )
            .order_by(AgentMessage.created_at.asc())
            .limit(1)
        )
        matching_msg = msg_result.scalar_one_or_none()
        if matching_msg:
            preview = matching_msg[:200]
            if len(matching_msg) > 200:
                preview += "..."
            match_preview = preview

        results.append(
            {
                "id": conv.id,
                "title": conv.title,
                "match_preview": match_preview,
                "created_at": conv.created_at,
                "updated_at": conv.updated_at,
            }
        )

    return results


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


async def update_conversation(
    db: AsyncSession,
    conversation_id: str,
    user_id: UUID,
    title: str | None = None,
    is_pinned: bool | None = None,
    is_archived: bool | None = None,
) -> AgentConversation | None:
    conversation = await get_conversation_for_user(db, conversation_id, user_id)
    if not conversation:
        return None
    if title is not None:
        conversation.title = title
    if is_pinned is not None:
        conversation.is_pinned = is_pinned
    if is_archived is not None:
        conversation.is_archived = is_archived
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
    provider_name: str | None = None,
    context_builder: ContextBuilder | None = None,
    enable_memory: bool = True,
):
    plan_type = detect_plan_type(prompt, plan_type_hint)
    enhanced_prompt = build_enhanced_prompt(prompt, plan_type)

    if context_builder and enable_memory:
        results = await context_builder.search_memory(query=prompt)
        context_block = context_builder.build_context_block(results)
        enhanced_prompt = context_builder.build_prompt_with_context(enhanced_prompt, context_block)

    history = await get_conversation_history(db, conversation_id)
    llm_history = history
    if history and history[-1]["role"] == "user" and history[-1]["content"] == prompt:
        llm_history = history[:-1]

    start = time.perf_counter()
    full_response = ""
    resolved_provider = provider_name or "gemini"

    if provider_name:
        async for chunk in llm_router.stream_from_provider(
            provider_name=resolved_provider,
            prompt=enhanced_prompt,
            system=SYSTEM_PROMPT_FOUNDER_AGENT,
            history=llm_history,
        ):
            full_response += chunk
            yield chunk
    else:
        async for chunk, provider in llm_router.stream_generate_with_meta(
            prompt=enhanced_prompt,
            system=SYSTEM_PROMPT_FOUNDER_AGENT,
            history=llm_history,
        ):
            if provider:
                resolved_provider = provider
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
        provider=resolved_provider,
        tokens_used=tokens_input + tokens_output,
    )
    await record_usage(
        db,
        user_id=user_id,
        provider=resolved_provider,
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


def _role_label(sender: str) -> str:
    return "User" if sender == "user" else "Founder Agent"


async def export_conversation_as_markdown(
    db: AsyncSession, conversation_id: str, user_id: UUID
) -> str:
    conv = await get_conversation_for_user(db, conversation_id, user_id)
    if not conv:
        return ""

    lines: list[str] = [f"# Conversation: {conv.title or 'Untitled'}"]
    result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conversation_id)
        .order_by(AgentMessage.created_at.asc())
    )
    for msg in result.scalars().all():
        label = _role_label(msg.sender)
        ts = msg.created_at.strftime("%Y-%m-%d %H:%M UTC")
        lines.append(f"\n## {label} ({ts})")
        lines.append(msg.content)
    lines.append("")  # trailing newline
    return "\n".join(lines)


async def export_conversation_as_json(db: AsyncSession, conversation_id: str, user_id: UUID) -> str:
    conv = await get_conversation_for_user(db, conversation_id, user_id)
    if not conv:
        return ""

    result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conversation_id)
        .order_by(AgentMessage.created_at.asc())
    )
    messages = result.scalars().all()

    payload = {
        "conversation": {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        },
        "messages": [
            {
                "id": msg.id,
                "sender": msg.sender,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            }
            for msg in messages
        ],
        "metadata": {
            "exported_at": datetime.datetime.now(datetime.UTC).isoformat(),
            "message_count": len(messages),
            "format": "json",
            "version": "1.0",
        },
    }
    return json.dumps(payload, indent=2, default=str)


async def export_conversation_as_pdf(
    db: AsyncSession, conversation_id: str, user_id: UUID
) -> bytes:
    conv = await get_conversation_for_user(db, conversation_id, user_id)
    if not conv:
        return b""

    result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conversation_id)
        .order_by(AgentMessage.created_at.asc())
    )
    messages = result.scalars().all()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )
    styles = getSampleStyleSheet()
    story: list = []

    story.append(Paragraph(f"Conversation: {conv.title or 'Untitled'}", styles["Title"]))
    created_str = conv.created_at.strftime("%Y-%m-%d %H:%M UTC") if conv.created_at else "N/A"
    story.append(Paragraph(f"Created: {created_str}", styles["Normal"]))
    story.append(Spacer(1, 0.2 * inch))

    for msg in messages:
        label = _role_label(msg.sender)
        ts = msg.created_at.strftime("%Y-%m-%d %H:%M UTC") if msg.created_at else ""
        story.append(Paragraph(f"<b>{label}</b> ({ts})", styles["Heading2"]))
        story.append(Spacer(1, 0.1 * inch))
        # Escape HTML entities in content for reportlab
        safe_content = msg.content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(safe_content, styles["Normal"]))
        story.append(Spacer(1, 0.15 * inch))

    doc.build(story)
    return buf.getvalue()


SUPPORTED_EXPORT_FORMATS = frozenset({"md", "json", "pdf"})


async def export_conversation(
    db: AsyncSession,
    conversation_id: str,
    user_id: UUID,
    fmt: str,
) -> tuple[str | bytes, str]:
    """Export a conversation in the requested format.

    Returns (content, media_type).
    Raises HTTPException(404) if not found, HTTPException(400) if format invalid.
    """
    if fmt not in SUPPORTED_EXPORT_FORMATS:
        supported = ", ".join(sorted(SUPPORTED_EXPORT_FORMATS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported export format '{fmt}'. Supported: {supported}",
        )

    if fmt == "json":
        content = await export_conversation_as_json(db, conversation_id, user_id)
        if not content:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return content, "application/json"
    elif fmt == "pdf":
        content = await export_conversation_as_pdf(db, conversation_id, user_id)
        if not content:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return content, "application/pdf"
    else:
        content = await export_conversation_as_markdown(db, conversation_id, user_id)
        if not content:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return content, "text/markdown"
