from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_repo_root(start: Path) -> Path | None:
    """Walk up from *start* looking for the monorepo root.

    Checks each ancestor directory for markers in priority order:
    .git directory, then package.json, then pyproject.toml.
    Returns the nearest ancestor that contains any marker.
    Returns None if no marker is found before reaching the user's
    home directory — process environment will still be used.
    """
    home = Path.home().resolve()
    for parent in [start.resolve()] + list(start.resolve().parents):
        if parent == home:
            break
        if (parent / ".git").exists():
            return parent
        if (parent / "package.json").exists():
            return parent
        if (parent / "pyproject.toml").exists():
            return parent
    return None


def _env_file_paths(root: Path | None) -> list[Path]:
    """Return a tuple of .env file paths, skipping any that don't exist."""
    if root is None:
        return []
    paths: list[Path] = []
    for name in (".env.local", ".env"):
        candidate = root / name
        if candidate.exists():
            paths.append(candidate)
    return paths


_REPO_ROOT = _find_repo_root(Path(__file__).resolve())
_ENV_FILES = _env_file_paths(_REPO_ROOT)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES or None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NEXUS AI API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = ""

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret_key(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters long. "
                'Generate one with: python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return v

    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    cors_origins: str = "https://nexus-ecosystem-web.vercel.app,http://localhost:3000"

    siwe_domain: str = "localhost"
    siwe_uri: str = "http://localhost:3000"
    siwe_chain_id: int = 80002
    siwe_nonce_ttl_seconds: int = 300

    cookie_access_name: str = "nexus_access_token"
    cookie_refresh_name: str = "nexus_refresh_token"
    cookie_csrf_name: str = "nexus_csrf_token"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    emergent_api_key: str = ""
    emergent_endpoint: str = "https://api.emergent.ai/v1/chat/completions"
    gemini_api_key: str = ""
    openai_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    ollama_api_key: str = ""
    ollama_api_mode: str = "native"
    openai_default_model: str = "gpt-4o-mini"
    llm_max_retries: int = 2
    llm_retry_delay_seconds: float = 0.5

    pinata_jwt: str = Field(default="", validation_alias=AliasChoices("pinata_jwt", "PINATA_JWT"))
    pinata_base_url: str = Field(
        default="https://api.pinata.cloud/pinning/pinJSONToIPFS",
        validation_alias=AliasChoices("pinata_base_url", "PINATA_BASE_URL"),
    )
    passport_contract_address: str = Field(
        default="0x9812A27c5950ECf7c4A4EF3dFdB02CDa6BbeF21A",
        validation_alias=AliasChoices(
            "passport_contract_address",
            "SKILL_PASSPORT_CONTRACT_ADDRESS",
        ),
    )
    passport_chain_id: int = Field(
        default=80002,
        validation_alias=AliasChoices("passport_chain_id", "NEXT_PUBLIC_CHAIN_ID"),
    )
    polygon_amoy_rpc_url: str = Field(
        default="",
        validation_alias=AliasChoices("polygon_amoy_rpc_url", "POLYGON_AMOY_RPC_URL"),
    )
    deployer_private_key: str = Field(
        default="",
        validation_alias=AliasChoices("deployer_private_key", "DEPLOYER_PRIVATE_KEY"),
    )
    alchemy_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("alchemy_api_key", "ALCHEMY_API_KEY"),
    )
    alchemy_polygon_amoy_rpc_url: str = Field(
        default="",
        validation_alias=AliasChoices(
            "alchemy_polygon_amoy_rpc_url",
            "ALCHEMY_POLYGON_AMOY_RPC_URL",
        ),
    )
    stitch_url: str = Field(
        default="https://stitch.googleapis.com/mcp",
        validation_alias=AliasChoices("stitch_url", "STITCH_URL"),
    )
    stitch_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("stitch_api_key", "STITCH_API_KEY"),
    )
    stitch_header_name: str = Field(
        default="X-Goog-Api-Key",
        validation_alias=AliasChoices("stitch_header_name", "STITCH_HEADER_NAME"),
    )

    @property
    def ollama_internal_base(self) -> str:
        base = self.ollama_base_url.rstrip("/")
        if not base.endswith("/api"):
            return f"{base}/api"
        return base

    @property
    def ollama_chat_url(self) -> str:
        return f"{self.ollama_internal_base}/chat"

    @property
    def ollama_tags_url(self) -> str:
        return f"{self.ollama_internal_base}/tags"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cors_origin_regex(self) -> str | None:
        """Return a regex for dynamic preview origins.

        The default pattern matches Vercel preview deployments:
        https://nexus-ecosystem-<random>-aryanzeal22105-3117s-projects.vercel.app
        Override via CORS_ORIGIN_REGEX env var if needed.
        """
        return "https://nexus-ecosystem-.*-aryanzeal22105-3117s-projects\\.vercel\\.app"


settings = Settings()
