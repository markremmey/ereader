# backend/app/auth.py
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import database, models

# OAuth2 scheme setup – the frontend will send the JWT in the "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
# Password hashing setup
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# Secret key and JWT settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    # Encode the JWT with our SECRET_KEY
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Dependency to get current user
async def get_current_user(
    request: Request,
    db: Session = Depends(database.get_db),
):
    # 1. Check for demo_session cookie
    if request.cookies.get("demo_session") == "true":
        # Return a predefined demo user.
        # Using id=0 or a special negative ID for the demo user is a common pattern.
        # Ensure this User object is compatible with what your app expects.
        return models.User(id=0, email="demo@example.com", hashed_password="demo_placeholder")

    # 2. If not a demo session, proceed with token authentication
    token: Optional[str] = None
    try:
        # Manually invoke the scheme with the request to get the token.
        # OAuth2PasswordBearer with auto_error=True will raise HTTPException if token is not found or malformed.
        token = await oauth2_scheme(request) 
    except HTTPException as e:
        # If oauth2_scheme raised an error (e.g., no token), re-raise it.
        # This maintains the original behavior for missing/malformed tokens when not in demo mode.
        raise e

    # If token is None here, it means oauth2_scheme did not raise an error but also didn't return a token.
    # This case should ideally be covered by auto_error=True in OAuth2PasswordBearer, 
    # but as a safeguard, we handle it.
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials (token not found after check)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (invalid token)",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        # This means the user specified in the token doesn't exist in the DB anymore.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User specified in token not found"
        )
    return user
