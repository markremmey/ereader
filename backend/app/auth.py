# backend/app/auth.py
import uuid
from typing import Optional

from fastapi import Depends, Request
from passlib.context import CryptContext
import logging
from . import models
from .users import current_active_user

logging.basicConfig(level=logging.INFO)

# Password hashing setup
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# # Create two separate dependencies
# async def get_fastapi_user_or_none(request: Request) -> Optional[models.User]:
#     """Try to get FastAPI Users authenticated user, return None if not authenticated"""
#     try:
#         # Try to get the current user via FastAPI Users
#         user = await current_active_user(request)
#         return user
#     except Exception:
#         # Not authenticated via FastAPI Users - that's OK
#         return None


# async def get_current_user(
#     request: Request,
#     fastapi_user: Optional[models.User] = Depends(current_active_user)
# ):
#     """Get current user - demo session takes priority, then FastAPI Users auth"""
    
#     # Check for demo session first
#     if request.cookies.get("demo_session") == "true":
#         demo_user = models.User(
#             id=uuid.uuid4(), 
#             email="demo@example.com", 
#             hashed_password="demo_placeholder",
#             is_active=True,
#             is_superuser=False,
#             is_verified=True
#         )
#         logging.info(f"auth.py:get_current_user: returning demo user: {demo_user.email}")
#         return demo_user
    
#     # Fall back to FastAPI Users authentication
#     if fastapi_user is not None:
#         logging.info(f"auth.py:get_current_user: returning fastapi user: {fastapi_user.email}")
#         return fastapi_user
    
#     # No authentication found
#     logging.info("auth.py:get_current_user: no authentication found")
#     from fastapi import HTTPException
#     raise HTTPException(status_code=401, detail="Not authenticated")