import asyncio
import os
from datetime import UTC, datetime, timedelta

from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-pytest-only-not-production')

import app.models  # noqa: F401
from app.core.database import Base, get_engine, get_session_factory
from app.core.security import create_access_token, new_jti
from app.main import app
from app.models.auth import Session, User


async def main() -> None:
    print('starting')
    engine = await get_engine()
    print('engine ready')
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('tables ready')

    factory = await get_session_factory()
    print('factory ready')
    async with factory() as session:
        print('session ready')
        await session.execute(delete(Session))
        await session.execute(delete(User))
        await session.commit()
        user = User(wallet_address='0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role='founder', is_active=True)
        session.add(user)
        await session.flush()
        jti = new_jti()
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        session.add(Session(user_id=user.id, jwt_jti=jti, wallet_address=user.wallet_address, expires_at=expires_at, revoked=False))
        await session.commit()
        token = create_access_token(user_id=str(user.id), wallet=user.wallet_address, jti=jti)
        print('token', token)
        async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test', headers={'Authorization': f'Bearer {token}'}) as client:
            print('client ready')
            resp = await client.post('/api/v1/passports', json={
                'skill_category': 'Engineering',
                'skill_name': 'Solidity',
                'evidence_url': 'https://example.com',
                'evidence_description': 'x',
            })
            print('create status', resp.status_code, resp.text)
            passport_id = resp.json()['data']['id']
            print('passport id', passport_id)
            resp2 = await client.post(f'/api/v1/passports/{passport_id}/mint')
            print('mint status', resp2.status_code, resp2.text)


asyncio.run(main())
