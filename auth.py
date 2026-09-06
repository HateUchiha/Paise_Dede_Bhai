import os
import time
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException

from db import get_db, upsert_user

JWT_SECRET = os.environ.get("JWT_SECRET", "zqg365-paisa-dede-bhai-dev-secret")
JWT_ALG = "HS256"
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
AUTH_OPTIONAL = os.environ.get("AUTH_OPTIONAL", "1") == "1"
DEFAULT_USER_ID = "user_zqg365_admin"


def create_access_token(user_id: str, email: str, display_name: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "name": display_name,
        "iat": int(time.time()),
        "exp": int(time.time()) + 60 * 60 * 24 * 14,
        "iss": "paisa-dede-bhai",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def _decode_token(token: str) -> dict:
    errors = []
    for secret in filter(None, [JWT_SECRET, SUPABASE_JWT_SECRET]):
        try:
            return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
        except Exception as exc:
            errors.append(str(exc))
    raise HTTPException(status_code=401, detail="Invalid or expired token")


def _user_from_payload(payload: dict) -> dict:
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
    email = payload.get("email") or payload.get("user_metadata", {}).get("email") or f"{user_id}@users.local"
    display_name = (
        payload.get("name")
        or payload.get("user_metadata", {}).get("full_name")
        or payload.get("email")
        or "ZQG365 User"
    )
    avatar = payload.get("avatar_url") or payload.get("user_metadata", {}).get("avatar_url")
    return upsert_user(user_id, email, display_name, avatar)


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = _decode_token(token)
        return _user_from_payload(payload)

    if AUTH_OPTIONAL:
        conn = get_db()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (DEFAULT_USER_ID,)).fetchone()
        conn.close()
        if row:
            return dict(row)
        return upsert_user(DEFAULT_USER_ID, "admin@zqg365.com", "ZQG365 User", None)

    raise HTTPException(status_code=401, detail="Not authenticated")
