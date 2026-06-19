from pathlib import Path

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

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
