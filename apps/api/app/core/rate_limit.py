"""Rate limiting hooks — wired in Phase 4+ via Redis token bucket."""

from fastapi import Request


async def check_rate_limit(
    request: Request, *, bucket: str, limit: int, window_seconds: int
) -> None:
    """Placeholder for Redis-backed rate limiting (SR-004).

    Call sites are ready; enforcement activates when REDIS_URL rate limiter is enabled.
    """
    _ = (request, bucket, limit, window_seconds)
