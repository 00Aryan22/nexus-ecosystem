import secrets
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.core.config import settings


class TokenError(Exception):
    pass


def create_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(*, user_id: str, wallet: str, jti: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "wallet": wallet,
        "jti": jti,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise TokenError("Invalid token") from exc
    if payload.get("type") != "access":
        raise TokenError("Invalid token type")
    return payload


def create_refresh_token(*, user_id: str, wallet: str, jti: str) -> str:
    expire = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)
    payload = {
        "sub": user_id,
        "wallet": wallet,
        "jti": jti,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise TokenError("Invalid token") from exc
    if payload.get("type") != "refresh":
        raise TokenError("Invalid token type")
    return payload


def new_jti() -> str:
    return str(uuid.uuid4())
