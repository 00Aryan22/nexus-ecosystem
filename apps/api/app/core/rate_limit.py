"""Redis-backed rate limiting for API endpoints."""

import logging

from fastapi import HTTPException, Request, status

from app.core.redis import get_redis

logger = logging.getLogger(__name__)


async def check_rate_limit(
    request: Request, *, bucket: str, limit: int, window_seconds: int
) -> None:
    redis = await get_redis()
    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    key = f"rate_limit:{bucket}:{client_ip}"

    try:
        current = await redis.get(key)
        if current is None:
            # Use set() with ex= instead of deprecated setex()
            await redis.set(key, "1", ex=window_seconds)
            return

        count = int(current)
        if count >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        await redis.set(key, str(count + 1), ex=window_seconds)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Rate limit check failed, allowing request: %s", exc)
