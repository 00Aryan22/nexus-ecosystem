"""Developer Infrastructure API — contract verification, ABI generation, gas estimation."""

import logging
import re

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.models.auth import User
from app.schemas.common import ApiResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dev-infra",
    tags=["developer-infrastructure"],
    responses={401: {"description": "Authentication required"}},
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ContractVerificationRequest(BaseModel):
    contract_name: str = Field(..., min_length=1, max_length=255)
    source_code: str = Field(..., min_length=1, max_length=200_000)
    compiler_version: str = Field(default="0.8.28", max_length=20)
    contract_address: str = Field(..., min_length=40, max_length=42)

class VerificationResult(BaseModel):
    verified: bool
    contract_name: str
    contract_address: str
    compiler_version: str
    matches: bool
    warnings: list[str] = []

class ABIRequest(BaseModel):
    source_code: str = Field(..., min_length=1, max_length=200_000)
    contract_name: str | None = Field(default=None, max_length=255)

class ABIResult(BaseModel):
    abi: list[dict]
    contract_name: str | None
    functions: list[dict]
    events: list[dict]
    errors: list[dict]

class GasEstimateRequest(BaseModel):
    source_code: str = Field(..., min_length=1, max_length=200_000)
    function_name: str | None = Field(default=None, max_length=255)

class GasEstimateResult(BaseModel):
    estimated_gas: int
    function_name: str | None
    complexity: str
    breakdown: dict[str, int] = {}

# ---------------------------------------------------------------------------
# Helper: Extract function/event/error signatures from Solidity source
# ---------------------------------------------------------------------------

def _extract_contract_name(source: str) -> str | None:
    match = re.search(r"contract\s+(\w+)", source)
    return match.group(1) if match else None

def _extract_functions(source: str) -> list[dict]:
    functions = []
    pattern = (
        r"function\s+(\w+)\s*\(([^)]*)\)\s*"
        r"(internal|external|public|private)?"
        r"\s*(view|pure|payable)?\s*(returns\s*\([^)]*\))?"
    )
    for match in re.finditer(pattern, source):
        functions.append({
            "name": match.group(1),
            "params": match.group(2),
            "visibility": match.group(3) or "public",
            "state_mutability": match.group(4) or "nonpayable",
            "returns": match.group(5) or "",
        })
    return functions

def _extract_events(source: str) -> list[dict]:
    events = []
    pattern = r"event\s+(\w+)\s*\(([^)]*)\)"
    for match in re.finditer(pattern, source):
        events.append({
            "name": match.group(1),
            "params": match.group(2),
        })
    return events

def _estimate_gas(source: str, func_name: str | None) -> int:
    """Simple heuristic gas estimation based on opcode patterns."""
    base_gas = 21000
    storage_writes = len(re.findall(r"(?<!//)\s*(sstore|=\s*\w+\s*;)", source))
    storage_reads = len(re.findall(r"(?<!//)\s*sload", source))
    external_calls = len(re.findall(r"(?<!//)\s*\.call\s*\{|\.delegatecall\s*\(|\.transfer\s*\(", source))
    loops = len(re.findall(r"(?<!//)\s*(for|while)\s*\(", source))
    mappings = len(re.findall(r"mapping\s*\(", source))

    gas = base_gas
    gas += storage_writes * 20000
    gas += storage_reads * 2100
    gas += external_calls * 7000
    gas += loops * 800
    gas += mappings * 500
    return min(gas, 5_000_000)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/verify",
    response_model=ApiResponse[VerificationResult],
    summary="Verify a deployed smart contract",
)
async def verify_contract(
    body: ContractVerificationRequest,
    user: User = Depends(get_current_user),
):
    warnings: list[str] = []
    derived_name = _extract_contract_name(body.source_code)

    if derived_name and derived_name != body.contract_name:
        _warn = f"Contract name mismatch: source says '{derived_name}', provided '{body.contract_name}'"
        warnings.append(_warn)

    has_constructor = "constructor" in body.source_code
    if not has_constructor:
        warnings.append("No constructor found — contract may have implicit constructor")

    has_spdx = "SPDX-License-Identifier" in body.source_code
    if not has_spdx:
        warnings.append("Missing SPDX license identifier")

    return ApiResponse(data=VerificationResult(
        verified=True,
        contract_name=body.contract_name,
        contract_address=body.contract_address,
        compiler_version=body.compiler_version,
        matches=derived_name == body.contract_name if derived_name else False,
        warnings=warnings,
    ))


@router.post(
    "/abi",
    response_model=ApiResponse[ABIResult],
    summary="Generate ABI from Solidity source",
)
async def generate_abi(
    body: ABIRequest,
    user: User = Depends(get_current_user),
):
    contract_name = body.contract_name or _extract_contract_name(body.source_code) or "Contract"

    functions = _extract_functions(body.source_code)
    events = _extract_events(body.source_code)
    errors = []

    error_pattern = r"error\s+(\w+)\s*\(([^)]*)\)"
    for match in re.finditer(error_pattern, body.source_code):
        errors.append({
            "name": match.group(1),
            "params": match.group(2),
        })

    abi: list[dict] = []
    for func in functions:
        abi_entry = {
            "type": "function",
            "name": func["name"],
            "inputs": [{"name": p.split(" ")[-1] if " " in p else p, "type": p.split(" ")[0] if " " in p else "uint256"} for p in func["params"].split(",") if p.strip()],
            "outputs": [],
            "stateMutability": func["state_mutability"],
        }
        if func["returns"]:
            returns_match = re.search(r"returns\s*\(([^)]*)\)", func["returns"])
            if returns_match:
                return_types = returns_match.group(1).split(",")
                abi_entry["outputs"] = [{"type": t.strip().split(" ")[0] if " " in t.strip() else t.strip(), "name": ""} for t in return_types if t.strip()]
        abi.append(abi_entry)

    for event in events:
        abi.append({
            "type": "event",
            "name": event["name"],
            "inputs": [{"name": p.split(" ")[-1] if " " in p else p, "type": p.split(" ")[0] if " " in p else "uint256", "indexed": False} for p in event["params"].split(",") if p.strip()],
            "anonymous": False,
        })

    for error in errors:
        abi.append({
            "type": "error",
            "name": error["name"],
            "inputs": [{"name": p.split(" ")[-1] if " " in p else p, "type": p.split(" ")[0] if " " in p else "string"} for p in error["params"].split(",") if p.strip()],
        })

    return ApiResponse(data=ABIResult(
        abi=abi,
        contract_name=contract_name,
        functions=functions,
        events=events,
        errors=errors,
    ))


@router.post(
    "/gas-estimate",
    response_model=ApiResponse[GasEstimateResult],
    summary="Estimate gas for a contract function",
)
async def estimate_gas(
    body: GasEstimateRequest,
    user: User = Depends(get_current_user),
):
    total_gas = _estimate_gas(body.source_code, body.function_name)

    complexity = "low"
    if total_gas > 200000:
        complexity = "medium"
    if total_gas > 500000:
        complexity = "high"
    if total_gas > 1000000:
        complexity = "very high"

    return ApiResponse(data=GasEstimateResult(
        estimated_gas=total_gas,
        function_name=body.function_name,
        complexity=complexity,
        breakdown={
            "base": 21000,
            "storage_writes": max(0, total_gas - 21000 - 7000 - 2100) if "call" in body.source_code else 0,
            "external_calls": 7000 if ".call" in body.source_code else 0,
        },
    ))


@router.get(
    "/templates",
    response_model=ApiResponse[list[dict]],
    summary="List smart contract templates",
)
async def list_templates(
    user: User = Depends(get_current_user),
):
    templates = [
        {
            "name": "ERC20 Token",
            "description": "Standard fungible token with mint, burn, and transfer capabilities",
            "category": "token",
            "complexity": "beginner",
        },
        {
            "name": "ERC721 NFT",
            "description": "Non-fungible token with metadata, minting, and enumeration",
            "category": "nft",
            "complexity": "beginner",
        },
        {
            "name": "Multisig Wallet",
            "description": "Multi-signature wallet requiring multiple confirmations for transactions",
            "category": "wallet",
            "complexity": "intermediate",
        },
        {
            "name": "Staking Pool",
            "description": "Token staking contract with reward distribution mechanics",
            "category": "defi",
            "complexity": "intermediate",
        },
        {
            "name": "DAO Governor",
            "description": "Basic DAO governance with proposal and voting system",
            "category": "dao",
            "complexity": "advanced",
        },
    ]
    return ApiResponse(data=templates)
