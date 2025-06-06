# backend/app/auth_backend.py
from fastapi_users.authentication import CookieTransport, JWTStrategy, AuthenticationBackend
import os

SECRET = os.getenv("SECRET_KEY")
if not SECRET:
    raise RuntimeError("SECRET_KEY environment variable must be set")

cookie_transport = CookieTransport(
    cookie_name="fastapiauth",
    cookie_max_age=3600,
    cookie_path="/",
    cookie_secure=True,
    cookie_httponly=True,
    cookie_samesite="lax"
)

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt_cookie",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy
)
