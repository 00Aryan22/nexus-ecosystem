import logging
import secrets
from datetime import UTC, datetime, timedelta

from eth_utils import to_checksum_address
from siwe import SiweMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis import get_redis
from app.core.security import create_access_token, new_jti
from app.models.auth import Session, User, Wallet

logger = logging.getLogger(__name__)


def _normalize_address(address: str) -> str:
    return address.lower()


def _checksum_address(address: str) -> str:
    return to_checksum_address(address)


def _nonce_redis_key(wallet: str) -> str:
    return f"siwe:nonce:{_normalize_address(wallet)}"


async def issue_nonce(
    wallet: str,
    domain: str | None = None,
    uri: str | None = None,
) -> tuple[str, str, datetime]:
    wallet = _normalize_address(wallet)
    checksum_wallet = _checksum_address(wallet)
    logger.debug(
        "[AuthService] issue_nonce start",
        {"wallet": wallet, "checksum_wallet": checksum_wallet},
    )
    nonce = secrets.token_hex(16)
    expires_at = datetime.now(UTC) + timedelta(seconds=settings.siwe_nonce_ttl_seconds)
    issued_at = datetime.now(UTC).replace(microsecond=0).isoformat()

    # In production, prefer the explicitly configured SIWE_DOMAIN/SIWE_URI
    # over the request-derived host header (which is the backend's host, not
    # the frontend's).  In development ("localhost") the request host is fine.
    if settings.siwe_domain != "localhost":
        siwe_domain = settings.siwe_domain
        siwe_uri = settings.siwe_uri
    else:
        siwe_domain = domain or settings.siwe_domain
        siwe_uri = uri or settings.siwe_uri

    siwe = SiweMessage(
        domain=siwe_domain,
        address=checksum_wallet,
        uri=siwe_uri,
        version="1",
        chain_id=settings.siwe_chain_id,
        nonce=nonce,
        statement="Sign in to NEXUS AI with your wallet.",
        issued_at=issued_at,
    )
    message = siwe.prepare_message()

    redis = await get_redis()
    await redis.set(_nonce_redis_key(wallet), nonce, ex=settings.siwe_nonce_ttl_seconds)
    logger.debug("[AuthService] issue_nonce complete", {"wallet": wallet, "nonce": nonce})
    return nonce, message, expires_at


async def verify_siwe_and_login(
    db: AsyncSession,
    *,
    wallet: str,
    signature: str,
    message: str,
    ip_address: str | None,
    user_agent: str | None,
) -> tuple[User, str, str]:
    wallet = _normalize_address(wallet)
    logger.debug(
        "[AuthService] verify_siwe_and_login start",
        {
            "wallet": wallet,
            "signature": signature[:8],
            "ip_address": ip_address,
            "user_agent": user_agent,
        },
    )

    redis = await get_redis()
    stored_nonce = await redis.get(_nonce_redis_key(wallet))
    if not stored_nonce:
        logger.warning("[AuthService] verify failed: nonce missing", {"wallet": wallet})
        raise ValueError("Nonce expired or not found")

    siwe = SiweMessage.from_message(message)
    if siwe.nonce != stored_nonce:
        logger.warning(
            "[AuthService] verify failed: nonce mismatch",
            {
                "wallet": wallet,
                "stored_nonce": stored_nonce,
                "message_nonce": siwe.nonce,
            },
        )
        raise ValueError("Invalid nonce")

    await redis.delete(_nonce_redis_key(wallet))

    # When SIWE_DOMAIN is not explicitly configured, accept the domain
    # from the SIWE message itself (which was derived from the request host).
    # This supports any hosting platform — Render, Vercel, Railway, etc.
    # The domain check is only enforced when SIWE_DOMAIN is explicitly set.
    expected_domain = settings.siwe_domain
    if expected_domain == "localhost":
        expected_domain = siwe.domain

    siwe.verify(signature, domain=expected_domain)

    result = await db.execute(select(User).where(User.wallet_address == wallet))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(wallet_address=wallet, role="founder")
        db.add(user)
        await db.flush()

        wallet_row = Wallet(
            user_id=user.id,
            address=wallet,
            chain_id=settings.siwe_chain_id,
            nonce=stored_nonce,
            nonce_expires_at=datetime.now(UTC),
            is_primary=True,
        )
        db.add(wallet_row)
    else:
        result = await db.execute(select(Wallet).where(Wallet.address == wallet))
        wallet_row = result.scalar_one_or_none()
        if wallet_row is None:
            wallet_row = Wallet(
                user_id=user.id,
                address=wallet,
                chain_id=settings.siwe_chain_id,
                nonce=stored_nonce,
                nonce_expires_at=datetime.now(UTC),
                is_primary=False,
            )
            db.add(wallet_row)

    jti = new_jti()
    expires_at = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)
    session = Session(
        user_id=user.id,
        jwt_jti=jti,
        wallet_address=wallet,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at,
        revoked=False,
    )
    db.add(session)
    await db.flush()

    access_token = create_access_token(user_id=str(user.id), wallet=wallet, jti=jti)
    return user, access_token, jti


async def revoke_session(db: AsyncSession, jti: str) -> None:
    result = await db.execute(select(Session).where(Session.jwt_jti == jti))
    session = result.scalar_one_or_none()
    if session:
        session.revoked = True


async def get_active_session(db: AsyncSession, jti: str) -> Session | None:
    result = await db.execute(
        select(Session).where(
            Session.jwt_jti == jti,
            Session.revoked.is_(False),
            Session.expires_at > datetime.now(UTC),
        )
    )
    return result.scalar_one_or_none()
