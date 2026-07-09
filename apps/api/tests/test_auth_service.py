from unittest.mock import MagicMock

import pytest

from app.core.redis import InMemoryRedis
from app.services.auth_service import (
    _nonce_redis_key,
    issue_nonce,
    verify_siwe_and_login,
)


@pytest.mark.asyncio
async def test_successful_login_consumes_nonce(
    monkeypatch: pytest.MonkeyPatch,
    db_session,
) -> None:
    """Verify that a successful SIWE login deletes the nonce from Redis."""
    wallet = "0x1234567890123456789012345678901234567890"

    mock_redis = InMemoryRedis()

    async def mock_get_redis() -> InMemoryRedis:
        return mock_redis

    monkeypatch.setattr("app.services.auth_service.get_redis", mock_get_redis)

    # Step 1: issue_nonce creates a nonce and stores it
    nonce, message, expires_at = await issue_nonce(wallet)
    key = _nonce_redis_key(wallet)
    assert await mock_redis.get(key) == nonce

    # Step 2: control SiweMessage so that verify() succeeds
    mock_siwe = MagicMock()
    mock_siwe.nonce = nonce
    monkeypatch.setattr(
        "app.services.auth_service.SiweMessage.from_message",
        MagicMock(return_value=mock_siwe),
    )

    # Step 3: full login flow — nonce consumed
    user, access_token, jti = await verify_siwe_and_login(
        db=db_session,
        wallet=wallet,
        signature="0x" + "ab" * 65,
        message=message,
        ip_address=None,
        user_agent=None,
    )

    assert user is not None
    assert access_token is not None
    assert await mock_redis.get(key) is None, "Nonce was not consumed on success"


@pytest.mark.asyncio
async def test_failed_verify_consumes_nonce(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify that a failed SIWE verify still deletes the nonce from Redis."""
    wallet = "0x1234567890123456789012345678901234567890"

    mock_redis = InMemoryRedis()

    async def mock_get_redis() -> InMemoryRedis:
        return mock_redis

    monkeypatch.setattr("app.services.auth_service.get_redis", mock_get_redis)

    # Step 1: issue_nonce creates a nonce and stores it
    nonce, message, expires_at = await issue_nonce(wallet)
    key = _nonce_redis_key(wallet)
    assert await mock_redis.get(key) == nonce

    # Step 2: control SiweMessage so that verify() throws
    mock_siwe = MagicMock()
    mock_siwe.nonce = nonce
    mock_siwe.verify.side_effect = ValueError("Signature verification failed")

    monkeypatch.setattr(
        "app.services.auth_service.SiweMessage.from_message",
        MagicMock(return_value=mock_siwe),
    )

    # Step 3: login fails — nonce still consumed
    with pytest.raises(ValueError, match="Signature verification failed"):
        await verify_siwe_and_login(
            db=None,
            wallet=wallet,
            signature="0x" + "ab" * 65,
            message=message,
            ip_address=None,
            user_agent=None,
        )

    assert await mock_redis.get(key) is None, "Nonce was not consumed on failure"


@pytest.mark.asyncio
async def test_nonce_reuse_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Verify that a consumed nonce cannot be reused."""
    wallet = "0x1234567890123456789012345678901234567890"

    mock_redis = InMemoryRedis()

    async def mock_get_redis() -> InMemoryRedis:
        return mock_redis

    monkeypatch.setattr("app.services.auth_service.get_redis", mock_get_redis)

    # Step 1: issue_nonce creates a nonce and stores it
    nonce, message, expires_at = await issue_nonce(wallet)
    key = _nonce_redis_key(wallet)
    assert await mock_redis.get(key) == nonce

    # Step 2: control SiweMessage so that verify() fails
    mock_siwe = MagicMock()
    mock_siwe.nonce = nonce
    mock_siwe.verify.side_effect = ValueError("Signature verification failed")

    monkeypatch.setattr(
        "app.services.auth_service.SiweMessage.from_message",
        MagicMock(return_value=mock_siwe),
    )

    # Step 3: first call consumes the nonce (and fails)
    with pytest.raises(ValueError, match="Signature verification failed"):
        await verify_siwe_and_login(
            db=None,
            wallet=wallet,
            signature="0x" + "ab" * 65,
            message=message,
            ip_address=None,
            user_agent=None,
        )

    assert await mock_redis.get(key) is None, "Nonce was not consumed"

    # Step 4: second call with the same parameters — nonce is gone
    with pytest.raises(ValueError, match="Nonce expired or not found"):
        await verify_siwe_and_login(
            db=None,
            wallet=wallet,
            signature="0x" + "ab" * 65,
            message=message,
            ip_address=None,
            user_agent=None,
        )
