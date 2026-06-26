from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_public
from app.core.config import settings
from app.core.database import get_db
from app.schemas.auth import ApiResponse, NonceData, UserPublic, VerifyData, VerifyRequest
from app.services.auth_service import issue_nonce, revoke_session, verify_siwe_and_login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/nonce", response_model=ApiResponse[NonceData])
async def get_nonce(wallet: str) -> ApiResponse[NonceData]:
    if not wallet.startswith("0x") or len(wallet) != 42:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid wallet address",
        )
    nonce, message, expires_at = await issue_nonce(wallet)
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
    try:
        user, access_token, _jti = await verify_siwe_and_login(
            db,
            wallet=body.wallet,
            signature=body.signature,
            message=body.message,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature verification failed",
        ) from exc

    response.set_cookie(
        key=settings.cookie_access_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )

    user_public = UserPublic.model_validate(user)
    return ApiResponse(
        data=VerifyData(access_token=access_token, user=user_public),
    )


@router.post("/logout", response_model=ApiResponse[dict])
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[dict]:
    token = request.cookies.get(settings.cookie_access_name)
    if token:
        from app.core.security import TokenError, decode_access_token

        try:
            payload = decode_access_token(token)
            jti = payload.get("jti")
            if jti:
                await revoke_session(db, jti)
        except TokenError:
            pass

    response.delete_cookie(settings.cookie_access_name, path="/")
    return ApiResponse(data={"logged_out": True})


@router.get("/me", response_model=ApiResponse[UserPublic])
async def get_me(user: UserPublic = Depends(get_current_user_public)) -> ApiResponse[UserPublic]:
    return ApiResponse(data=user)
