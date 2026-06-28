from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            _REPO_ROOT / ".env.local",
            _REPO_ROOT / ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NEXUS AI API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:3000"

    siwe_domain: str = "localhost"
    siwe_uri: str = "http://localhost:3000"
    siwe_chain_id: int = 80002
    siwe_nonce_ttl_seconds: int = 300

    cookie_access_name: str = "nexus_access_token"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    emergent_api_key: str = ""
    emergent_endpoint: str = "https://api.emergent.ai/v1/chat/completions"
    gemini_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    llm_max_retries: int = 2
    llm_retry_delay_seconds: float = 0.5

    pinata_jwt: str = Field(default="", validation_alias=AliasChoices("pinata_jwt", "PINATA_JWT"))
    pinata_base_url: str = Field(
        default="https://api.pinata.cloud/pinning/pinJSONToIPFS",
        validation_alias=AliasChoices("pinata_base_url", "PINATA_BASE_URL"),
    )
    passport_contract_address: str = Field(
        default="0x9812A27c5950ECf7c4A4EF3dFdB02CDa6BbeF21A",
        validation_alias=AliasChoices("passport_contract_address", "SKILL_PASSPORT_CONTRACT_ADDRESS"),
    )
    passport_chain_id: int = Field(
        default=80002,
        validation_alias=AliasChoices("passport_chain_id", "NEXT_PUBLIC_CHAIN_ID"),
    )
    polygon_amoy_rpc_url: str = Field(default="", validation_alias=AliasChoices("polygon_amoy_rpc_url", "POLYGON_AMOY_RPC_URL"))
    deployer_private_key: str = Field(default="", validation_alias=AliasChoices("deployer_private_key", "DEPLOYER_PRIVATE_KEY"))
    alchemy_api_key: str = Field(default="", validation_alias=AliasChoices("alchemy_api_key", "ALCHEMY_API_KEY"))
    alchemy_polygon_amoy_rpc_url: str = Field(default="", validation_alias=AliasChoices("alchemy_polygon_amoy_rpc_url", "ALCHEMY_POLYGON_AMOY_RPC_URL"))

    @property
    def ollama_chat_url(self) -> str:
        base = self.ollama_base_url.rstrip("/")
        return f"{base}/api/chat"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
