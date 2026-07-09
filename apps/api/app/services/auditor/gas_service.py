"""Gas optimization analysis service."""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.services.llm.provider import llm_router

logger = logging.getLogger(__name__)

GAS_SYSTEM_PROMPT = (
    "You are an expert in Solidity gas optimization. Focus only on gas-related improvements."
)


async def analyze_gas_optimizations(
    db: AsyncSession,
    user: User,
    source_code: str,
    contract_name: str | None = None,
) -> dict:
    prompt = f"Analyze this Solidity contract for gas optimization opportunities:\n\n```solidity\n{source_code}\n```"
    if contract_name:
        prompt = f"Analyze {contract_name} for gas optimization opportunities:\n\n```solidity\n{source_code}\n```"

    full_response = ""
    async for chunk, provider in llm_router.stream_generate_with_meta(
        prompt=prompt,
        system=GAS_SYSTEM_PROMPT,
        history=[],
    ):
        full_response += chunk

    full_response = full_response.strip()
    try:
        result = json.loads(full_response)
    except json.JSONDecodeError:
        import re

        match = re.search(r"\{.*\}", full_response, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
            except json.JSONDecodeError:
                result = {"optimizations": [], "estimated_gas_savings": "unknown"}
        else:
            result = {"optimizations": [], "estimated_gas_savings": "unknown"}

    if "optimizations" not in result:
        result["optimizations"] = []

    return {
        "optimizations": result.get("optimizations", []),
        "estimated_gas_savings": result.get("estimated_gas_savings", "unknown"),
        "contract_name": contract_name,
    }
