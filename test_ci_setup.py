#!/usr/bin/env python3
"""
Test script to simulate CI environment and debug potential issues.
Run from root directory: python test_ci_setup.py
"""

import asyncio
import sys
from pathlib import Path

# Add apps/api to path
sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

async def main():
    print("=" * 60)
    print("CI ENVIRONMENT TEST")
    print("=" * 60)
    
    # Test 1: Check Python version
    print("\n1. Python Version:")
    print(f"   {sys.version}")
    print("\n2. SQLAlchemy:")
    try:
        import sqlalchemy
        print(f"   [OK] SQLAlchemy {sqlalchemy.__version__}")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        return False
    
    # Test 3: Check pytest-asyncio
    print("\n3. pytest-asyncio:")
    try:
        import pytest_asyncio
        print(f"   [OK] pytest-asyncio {pytest_asyncio.__version__}")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        return False
    
    # Test 4: Check environment variables
    print("\n4. Environment Variables:")
    import os
    required_vars = ["DATABASE_URL", "JWT_SECRET_KEY"]
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            print(f"   [OK] {var}: {value[:30]}...")
        else:
            print(f"   [WARN] {var}: NOT SET (will use default)")
    
    # Test 5: Check database connection
    print("\n5. Database Connection:")
    try:
        from app.core.database import get_engine
        engine = await get_engine()
        print(f"   [OK] Engine created: {engine}")
        
        # Try a simple query
        from sqlalchemy import text
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            value = result.scalar()
            print(f"   [OK] Query successful: SELECT 1 = {value}")
        
        await engine.dispose()
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        return False
    
    # Test 6: Check models import
    print("\n6. Models Import:")
    try:
        import app.models
        from app.models.auth import User, Session
        print(f"   [OK] Models imported successfully")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        return False
    
    # Test 7: Check fixture creation
    print("\n7. Fixture Setup:")
    try:
        from app.core.database import Base, get_session_factory
        from sqlalchemy import delete
        
        engine = await get_engine()
        async with engine.begin() as conn:
            # Create tables
            await conn.run_sync(Base.metadata.create_all)
            print("   [OK] Tables created")
            
            # Clear tables
            for table in reversed(Base.metadata.sorted_tables):
                stmt = delete(table)
                result = await conn.execute(stmt)
                print(f"   [OK] Cleared {table.name}")
        
        await engine.dispose()
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[FATAL] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
