import os

import pytest

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only-not-production")

@pytest.fixture(autouse=True)
def _jwt_secret() -> None:
    os.environ["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "test-secret-key")
