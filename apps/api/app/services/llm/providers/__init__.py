from app.services.llm.providers.emergent import EmergentProvider
from app.services.llm.providers.gemini import GeminiProvider
from app.services.llm.providers.ollama import OllamaProvider
from app.services.llm.providers.openai import OpenAIProvider
from app.services.llm.registry import ProviderRegistry


def register_all_providers() -> None:
    """Register all known LLM providers into the global ProviderRegistry."""
    ProviderRegistry.register("emergent", EmergentProvider())
    ProviderRegistry.register("gemini", GeminiProvider())
    ProviderRegistry.register("ollama", OllamaProvider())
    ProviderRegistry.register("openai", OpenAIProvider())
