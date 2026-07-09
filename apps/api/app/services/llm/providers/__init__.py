import logging

from app.core.config import settings
from app.services.llm.providers.emergent import EmergentProvider
from app.services.llm.providers.gemini import GeminiProvider
from app.services.llm.providers.ollama import OllamaProvider
from app.services.llm.providers.openai import OpenAIProvider
from app.services.llm.registry import ProviderRegistry

logger = logging.getLogger(__name__)


def register_all_providers() -> None:
    """Register all known LLM providers into the global ProviderRegistry.

    Only registers providers that have the minimum required configuration.
    """
    # Always register core providers (Gemini, OpenAI, Ollama) even without keys
    # — they handle missing keys with clear error messages at runtime.
    ProviderRegistry.register("gemini", GeminiProvider())
    ProviderRegistry.register("openai", OpenAIProvider())
    ProviderRegistry.register("ollama", OllamaProvider())

    # Emergent provider requires an explicit API key to be configured.
    # Without a key the provider would always fail at runtime.
    if settings.emergent_api_key:
        ProviderRegistry.register("emergent", EmergentProvider())
    else:
        logger.info("Emergent provider skipped: EMERGENT_API_KEY not set")
