from redis.asyncio import Redis

from app.core.config import settings


class InMemoryRedis:
    """A minimal async Redis-like interface for testing when a real Redis server
    is unavailable.  Supports the subset of commands used by this application."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:  # noqa: A002
        self._store[key] = value
        # TTL is intentionally not enforced in the in-memory fallback.
        return True

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def delete(self, key: str) -> int:
        return int(self._store.pop(key, None) is not None)

    async def ping(self) -> bool:
        return True

    async def aclose(self) -> None:
        return None


_redis: Redis | InMemoryRedis | None = None


async def get_redis() -> Redis | InMemoryRedis:
    global _redis
    if _redis is None:
        try:
            client: Redis = Redis.from_url(settings.redis_url, decode_responses=True)
            # Verify connectivity; fall back to the in-memory mock on failure.
            await client.ping()
            _redis = client
        except Exception:
            _redis = InMemoryRedis()
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        try:
            await _redis.aclose()
        except Exception:
            pass
        _redis = None
