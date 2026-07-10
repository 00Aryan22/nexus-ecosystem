import logging

from app.services.llm.registry import ProviderRegistry

logger = logging.getLogger(__name__)

SUPPORTED_MODELS: dict[str, list[str]] = {}


async def _build_supported_map() -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for name in ProviderRegistry.list_providers():
        try:
            p = ProviderRegistry.get(name)
            result[name] = await p.model_list()
        except Exception:
            result[name] = []
    return result


async def validate_provider_model(provider_name: str, model: str | None) -> str | None:
    if model is None:
        return None
    if not SUPPORTED_MODELS:
        SUPPORTED_MODELS.update(await _build_supported_map())
    valid = SUPPORTED_MODELS.get(provider_name, [])
    if model in valid:
        return model
    p = ProviderRegistry.get(provider_name)
    default = p.default_model
    logger.warning(
        "Invalid model '%s' for provider '%s'. Supported: %s. Falling back to '%s'.",
        model,
        provider_name,
        valid or "unknown",
        default,
    )
    return default
