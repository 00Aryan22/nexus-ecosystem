from app.services.llm.base import LLMProvider


class ProviderRegistry:
    _providers: dict[str, LLMProvider] = {}

    @classmethod
    def register(cls, name: str, provider: LLMProvider) -> None:
        cls._providers[name] = provider

    @classmethod
    def get(cls, name: str) -> LLMProvider:
        if name not in cls._providers:
            raise ValueError(f"Unknown provider: {name}")
        return cls._providers[name]

    @classmethod
    def list_providers(cls) -> list[str]:
        return list(cls._providers.keys())

    @classmethod
    def list_registered(cls) -> dict[str, str]:
        return {name: p.display_name for name, p in cls._providers.items()}

    @classmethod
    def clear(cls) -> None:
        cls._providers.clear()
