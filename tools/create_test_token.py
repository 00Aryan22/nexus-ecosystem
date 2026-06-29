import asyncio
import os
from datetime import UTC, datetime, timedelta

from app.core.database import get_session_factory
from app.core.security import create_access_token, new_jti
from app.models.auth import Session, User

async def main():
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-py")
    factory = await get_session_factory()
    async with factory() as db:
        wallet = "0xdeadbeef00000000000000000000000000000000"
        # remove existing
        from sqlalchemy import delete as sq_delete

        await db.execute(sq_delete(Session).where(Session.wallet_address == wallet))
        await db.execute(sq_delete(User).where(User.wallet_address == wallet))
        await db.commit()

        user = User(wallet_address=wallet, role="founder", is_active=True)
        db.add(user)
        await db.flush()

        jti = new_jti()
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        session = Session(
            user_id=user.id,
            jwt_jti=jti,
            wallet_address=user.wallet_address,
            expires_at=expires_at,
            revoked=False,
        )
        db.add(session)
        await db.commit()

        token = create_access_token(user_id=str(user.id), wallet=user.wallet_address, jti=jti)
        print(token)

if __name__ == "__main__":
    asyncio.run(main())
