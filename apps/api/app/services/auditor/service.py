"""AI Smart Contract Auditor — core service logic."""

import hashlib
import json
import logging
import re
import time
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import Audit
from app.models.auth import User
from app.schemas.audit import AuditSubmit
from app.services.auditor.prompts import SYSTEM_PROMPT_AUDITOR, build_audit_prompt
from app.services.llm.provider import llm_router

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _hash_source(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()[:64]


def _count_severities(vulns: list[dict]) -> dict[str, int]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for v in vulns:
        sev = v.get("severity", "info").lower()
        if sev in counts:
            counts[sev] += 1
    return counts


def _overall_risk(critical: int, high: int, medium: int, low: int) -> str:
    if critical > 0:
        return "critical"
    if high > 0:
        return "high"
    if medium > 0:
        return "medium"
    if low > 0:
        return "low"
    return "info"


def _extract_json(raw: str) -> dict:
    """Extract the first valid JSON object from the LLM response."""
    raw = raw.strip()
    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass
    # Find the first {...} block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    # Return minimal fallback so the audit record can still be saved
    return {
        "executive_summary": "AI analysis completed — JSON parsing failed; raw output stored.",
        "overall_risk": "medium",
        "risk_score": 50,
        "vulnerabilities": [],
        "gas_optimizations": [],
        "best_practices": [],
        "raw_output": raw[:5000],
    }


# ---------------------------------------------------------------------------
# Streaming analysis — yields SSE-compatible text chunks AND saves to DB
# ---------------------------------------------------------------------------


async def stream_audit_analysis(
    db: AsyncSession,
    audit_id: UUID,
    source_code: str,
    contract_name: str | None,
):
    """
    Async generator that:
    1. Yields progress SSE events ({"event": "progress", "text": "..."})
    2. Calls the LLM provider chain to generate the security report
    3. Saves the completed report back to the Audit row
    4. Yields a final SSE event with the full report JSON
    """
    start = time.perf_counter()

    # Mark audit as processing
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        yield json.dumps({"event": "error", "text": "Audit record not found"})
        return

    audit.status = "processing"
    await db.commit()
    await db.refresh(audit)

    yield json.dumps({"event": "progress", "text": "Initializing AI security scanner..."})

    prompt = build_audit_prompt(source_code, contract_name)
    full_response = ""
    provider_name = "unknown"

    yield json.dumps({"event": "progress", "text": "Analyzing contract with AI..."})

    try:
        async for chunk, provider in llm_router.stream_generate_with_meta(
            prompt=prompt,
            system=SYSTEM_PROMPT_AUDITOR,
            history=[],
        ):
            if provider:
                provider_name = provider
                yield json.dumps({"event": "progress", "text": f"Using {provider} model..."})
            full_response += chunk

        yield json.dumps({"event": "progress", "text": "Parsing security report..."})

        report_data = _extract_json(full_response)
        vulns = report_data.get("vulnerabilities", [])
        counts = _count_severities(vulns)
        overall = report_data.get("overall_risk") or _overall_risk(
            counts["critical"], counts["high"], counts["medium"], counts["low"]
        )
        latency_ms = int((time.perf_counter() - start) * 1000)

        # Enrich report with model info
        report_data["ai_model_used"] = provider_name
        report_data["processing_ms"] = latency_ms

        # Build summary
        summary_parts = [report_data.get("executive_summary", "")]
        if vulns:
            summary_parts.append(
                f"Found: {counts['critical']} critical, {counts['high']} high, "
                f"{counts['medium']} medium, {counts['low']} low issue(s)."
            )
        report_summary = " ".join(p for p in summary_parts if p)

        # Refresh audit to get latest version from database (handle stale object)
        result = await db.execute(select(Audit).where(Audit.id == audit_id))
        audit = result.scalar_one_or_none()
        if not audit:
            yield json.dumps({"event": "error", "text": "Audit record not found"})
            return

        audit.status = "complete"
        audit.report_json = report_data
        audit.report_summary = report_summary[:2000]
        audit.critical_count = counts["critical"]
        audit.high_count = counts["high"]
        audit.medium_count = counts["medium"]
        audit.low_count = counts["low"]
        audit.info_count = counts["info"]
        audit.overall_risk = overall
        audit.ai_model_used = provider_name
        audit.processing_ms = latency_ms
        audit.completed_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(audit)

        yield json.dumps({"event": "complete", "report": report_data})

    except Exception as exc:
        logger.exception("Audit analysis failed for audit_id=%s", audit_id)
        audit.status = "failed"
        audit.report_summary = f"Analysis failed: {exc!s}"[:500]
        await db.commit()
        yield json.dumps({"event": "error", "text": str(exc)})


# ---------------------------------------------------------------------------
# Non-streaming synchronous analysis (used when SSE is not requested)
# ---------------------------------------------------------------------------


async def run_audit_analysis(
    db: AsyncSession,
    audit_id: UUID,
    source_code: str,
    contract_name: str | None,
) -> Audit:
    """Run analysis synchronously, save result, return updated Audit."""
    collected = []
    async for chunk in stream_audit_analysis(db, audit_id, source_code, contract_name):
        collected.append(chunk)

    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise ValueError(f"Audit {audit_id} not found after analysis")
    return audit


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------


async def create_audit(db: AsyncSession, user: User, body: AuditSubmit) -> Audit:
    audit = Audit(
        user_id=user.id,
        contract_name=body.contract_name,
        source_code=body.source_code,
        source_hash=_hash_source(body.source_code),
        status="queued",
    )
    db.add(audit)
    await db.flush()
    await db.refresh(audit)
    return audit


async def get_audit_for_user(db: AsyncSession, audit_id: UUID, user_id: UUID) -> Audit | None:
    result = await db.execute(select(Audit).where(Audit.id == audit_id, Audit.user_id == user_id))
    return result.scalar_one_or_none()


async def list_user_audits(
    db: AsyncSession, user_id: UUID, page: int = 1, page_size: int = 20
) -> tuple[list[Audit], int]:
    from sqlalchemy import func

    base = select(Audit).where(Audit.user_id == user_id)
    count_q = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_q.scalar_one()

    offset = (page - 1) * page_size
    items_q = await db.execute(
        base.order_by(Audit.created_at.desc()).offset(offset).limit(page_size)
    )
    return list(items_q.scalars().all()), total


async def delete_audit(db: AsyncSession, audit_id: UUID, user_id: UUID) -> bool:
    from sqlalchemy import delete

    result = await db.execute(delete(Audit).where(Audit.id == audit_id, Audit.user_id == user_id))
    await db.commit()
    return result.rowcount > 0
