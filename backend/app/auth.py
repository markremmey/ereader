# backend/app/auth.py
import uuid
from typing import Optional

from fastapi import Depends, Request
from passlib.context import CryptContext

from . import models
from .users import current_active_user

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Simplified dependency that handles demo session + fastapi-users
async def get_current_user(
    request: Request,
    fastapi_user: models.User = Depends(current_active_user)
):
    # 1. Check for demo_session cookie first
    if request.cookies.get("demo_session") == "true":
        # Return a demo user
        return models.User(
            id=uuid.uuid4(), 
            email="demo@example.com", 
            hashed_password="demo_placeholder",
            is_active=True,
            is_superuser=False,
            is_verified=True
        )
    
    # 2. Otherwise, use the fastapi-users authenticated user
    # (fastapi-users already handled all JWT validation, database lookup, etc.)
    return fastapi_user