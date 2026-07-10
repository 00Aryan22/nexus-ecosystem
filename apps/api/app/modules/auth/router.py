import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_public
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import check_rate_limit
from app.core.security import (
    TokenError,
    create_access_token,
    create_csrf_token,
    create_refresh_token,
    decode_refresh_token,
    new_jti,
)
from app.models.auth import Session, User
from app.schemas.auth import ApiResponse, NonceData, UserPublic, VerifyData, VerifyRequest
from app.services.auth_service import (
    get_active_session,
    issue_nonce,
    revoke_session,
    verify_siwe_and_login,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/nonce", response_model=ApiResponse[NonceData])
async def get_nonce(wallet: str, request: Request, response: Response) -> ApiResponse[NonceData]:
    await check_rate_limit(request, bucket="auth:nonce", limit=20, window_seconds=60)
    if not wallet.startswith("0x") or len(wallet) != 42:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid wallet address",
        )

    forwarded_host = request.headers.get("x-forwarded-host")
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    host = forwarded_host or request.headers.get("host")

    domain = None
    uri = None
    if host:
        domain = host
        proto = "http" if "localhost" in host or "127.0.0.1" in host else forwarded_proto
        uri = f"{proto}://{host}"
        if ":" in domain:
            domain = domain.split(":")[0]

    nonce, message, expires_at = await issue_nonce(wallet, domain=domain, uri=uri)
    csrf_token = create_csrf_token()
    response.set_cookie(
        key=settings.cookie_csrf_name,
        value=csrf_token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.siwe_nonce_ttl_seconds,
        path="/",
    )
    return ApiResponse(
        data=NonceData(nonce=nonce, message=message, expires_at=expires_at),
    )


@router.post("/verify", response_model=ApiResponse[VerifyData])
async def verify_wallet(
    body: VerifyRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[VerifyData]:
    await check_rate_limit(request, bucket="auth:verify", limit=10, window_seconds=60)
    try:
        user, access_token, jti = await verify_siwe_and_login(
            db,
            wallet=body.wallet,
            signature=body.signature,
            message=body.message,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    except ValueError as exc:
        logger.warning("AUTH_VERIFY_VALUE_ERROR: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except Exception as exc:
        logger.error(
            "AUTH_VERIFY_GENERIC_ERROR: type=%s message=%s",
            type(exc).__name__,
            str(exc)[:200],
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature verification failed",
        ) from exc

    if request.headers.get("x-csrf-token") != request.cookies.get(settings.cookie_csrf_name):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")

    refresh_token = create_refresh_token(user_id=str(user.id), wallet=body.wallet, jti=jti)

    response.set_cookie(
        key=settings.cookie_access_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=settings.cookie_refresh_name,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )

    user_public = UserPublic.model_validate(user)
    return ApiResponse(
        data=VerifyData(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_public,
        ),
    )


@router.post("/logout", response_model=ApiResponse[dict])
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[dict]:
    await check_rate_limit(request, bucket="auth:logout", limit=20, window_seconds=60)
    access_token = request.cookies.get(settings.cookie_access_name)
    refresh_token = request.cookies.get(settings.cookie_refresh_name)

    from app.core.security import TokenError, decode_access_token, decode_refresh_token

    if request.headers.get("x-csrf-token") != request.cookies.get(settings.cookie_csrf_name):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")

    if access_token:
        try:
            payload = decode_access_token(access_token)
            jti = payload.get("jti")
            if jti:
                await revoke_session(db, jti)
        except TokenError:
            pass

    if refresh_token:
        try:
            payload = decode_refresh_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                await revoke_session(db, jti)
        except TokenError:
            pass

    response.delete_cookie(
        settings.cookie_access_name,
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    response.delete_cookie(
        settings.cookie_refresh_name,
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return ApiResponse(data={"logged_out": True})


@router.post("/refresh", response_model=ApiResponse[VerifyData])
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[VerifyData]:
    await check_rate_limit(request, bucket="auth:refresh", limit=10, window_seconds=60)
    refresh_token = request.cookies.get(settings.cookie_refresh_name)
    if request.headers.get("x-csrf-token") != request.cookies.get(settings.cookie_csrf_name):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    try:
        payload = decode_refresh_token(refresh_token)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    session = await get_active_session(db, jti)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or revoked",
        )

    session.revoked = True
    new_jti_value = new_jti()
    expires_at = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)
    new_session = Session(
        user_id=session.user_id,
        jwt_jti=new_jti_value,
        wallet_address=session.wallet_address,
        ip_address=session.ip_address,
        user_agent=session.user_agent,
        expires_at=expires_at,
        revoked=False,
    )
    db.add(new_session)
    await db.flush()

    access_token = create_access_token(
        user_id=str(session.user_id),
        wallet=session.wallet_address,
        jti=new_jti_value,
    )
    refresh_token = create_refresh_token(
        user_id=str(session.user_id),
        wallet=session.wallet_address,
        jti=new_jti_value,
    )

    response.set_cookie(
        key=settings.cookie_access_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=settings.cookie_refresh_name,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )

    result = await db.execute(select(User).where(User.id == session.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user_public = UserPublic.model_validate(user)
    return ApiResponse(
        data=VerifyData(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_public,
        ),
    )


@router.get("/me", response_model=ApiResponse[UserPublic])
async def get_me(user: UserPublic = Depends(get_current_user_public)) -> ApiResponse[UserPublic]:
    return ApiResponse(data=user)
