# backend/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users import FastAPIUsers
from .. import auth, database, models, schemas
from ..auth_backend import auth_backend
from ..models import User
from ..schemas import UserCreate, UserUpdate, UserRead
from httpx_oauth.clients.google import GoogleOAuth2
import os
router = APIRouter()

# Google OAuth2 client configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


# Instantiate FastAPIUsers
fastapi_users = FastAPIUsers[User, int](
    database.get_user_db, [auth_backend]
)

# Registration route
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"]
)

# ─── 2. Mount the standard auth routes ───
# POST /api/auth/jwt/login  → Sets cookie on success
# POST /api/auth/jwt/logout → Clears cookie
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

# User management routes
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"]
)
# This provides routes to get or update the current user. For example:
# GET /users/me (get current user's info) and PATCH /users/me (update current user), 
# plus admin-only routes to list or manage users if needed.

#  b) Mount the OAuth router. This will create:
#       GET  /api/auth/google        → Redirects to Google's consent page
#       GET  /api/auth/google/callback → Google's callback, finishes login, sets the cookie
#
#     We pass:
#       • google_oauth_client   (the HTTPX-OAuth client)
#       • auth_backend          (our cookie-based JWT backend)
#       • SECRET                (the same JWT secret from auth_backend.py)
#

google_oauth_client = GoogleOAuth2(
  client_id=GOOGLE_CLIENT_ID,
  client_secret=GOOGLE_CLIENT_SECRET,
  scopes=["openid", "email", "profile"],
#   redirect_url="http://localhost:8000/api/auth/google/callback",
)

router.include_router(
    fastapi_users.get_oauth_router(
        oauth_client=google_oauth_client,
        backend=auth_backend,
        # The JWT secret is already defined inside auth_backend.get_jwt_strategy()
        # FastAPI Users' docs expect "SECRET" here; we can retrieve it by calling get_jwt_strategy().secret
        state_secret=auth_backend.get_strategy().secret,
        # If you want to allow existing users to log in via Google if their email matches:
        associate_by_email=True
    ),
    prefix="/auth/google",
    tags=["auth"],
)

@router.post("/register", response_model=schemas.UserRead)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if username already exists
    existing = (
        db.query(models.User).filter(models.User.email == user.email).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already taken")
    # Create new user
    new_user = models.User(
        email=user.email, hashed_password=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user  # Will be filtered by response_model to id & username


@router.post("/login", response_model=schemas.Token)
def login(form: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # (We use UserCreate schema for form input: username & password)
    user = db.query(models.User).filter(models.User.email == form.email).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    # Credentials valid – create JWT token
    access_token = auth.create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/start-demo")
def start_demo_session(response: Response):
    """
    Sets a demo_session cookie to enable demo mode for the user.
    """
    response.set_cookie(
        key="demo_session",
        value="true",
        httponly=True,
        samesite="lax",  # Or "strict" depending on your needs
        secure=True,     # Set to True if served over HTTPS (recommended for production)
        # domain="yourdomain.com", # Optional: specify your domain
        # path="/",                 # Optional: cookie path
        # max_age=3600,             # Optional: cookie expiry in seconds (e.g., 1 hour)
    )
    return {"message": "Demo session started"}