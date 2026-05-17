"""Simple admin authentication using a single password env var."""
from __future__ import annotations

import hmac
import os
import secrets
from typing import Optional

from fastapi import Header, HTTPException, status

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
ADMIN_TOKEN_SALT = os.environ.get("ADMIN_TOKEN_SALT", "feb-penilaian-dosen")


def _expected_token() -> str:
    return hmac.new(
        ADMIN_TOKEN_SALT.encode(),
        ADMIN_PASSWORD.encode(),
        digestmod="sha256",
    ).hexdigest()


def verify_admin_password(password: str) -> Optional[str]:
    """Return an admin token if password matches, else None."""
    if hmac.compare_digest(password, ADMIN_PASSWORD):
        return _expected_token()
    return None


def require_admin(authorization: Optional[str] = Header(default=None)) -> None:
    """FastAPI dependency: validate Bearer token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()
    expected = _expected_token()
    if not secrets.compare_digest(token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
