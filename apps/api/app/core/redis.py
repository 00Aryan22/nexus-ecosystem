from redis.asyncio import Redis

from app.core.config import settings


class InMemoryRedis:
    """A minimal async Redis‑like interface for testing when a real Redis server is unavailable."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def set(self, key: str, value: str, ex: int | None = None) -> bool:
        self._store[key] = value
        return True

    async def setex(self, key: str, ttl: int, value: str) -> bool:
        # ttl is ignored in the in‑memory fallback
        self._store[key] = value
        return True

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def delete(self, key: str) -> int:
        return int(self._store.pop(key, None) is not None)

    async def aclose(self) -> None:
        # No resources to close for the in‑memory version
        return None


_redis: Redis | InMemoryRedis | None = None


async def get_redis() -> Redis | InMemoryRedis:
    global _redis
    if _redis is None:
        try:
            _redis = Redis.from_url(settings.redis_url, decode_responses=True)
            # Verify connection; if it fails we fall back to the mock.
            await _redis.ping()
        except Exception:
            # Connection failed – use the in‑memory fallback.
            _redis = InMemoryRedis()
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        # In‑memory fallback does not need explicit closing.
        try:
            await _redis.aclose()
        except Exception:
            pass
        _redis = None
