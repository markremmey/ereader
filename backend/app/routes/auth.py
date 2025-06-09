# backend/app/routes/auth.py
from fastapi import APIRouter, Depends, Response

from .. import auth, models
from ..users import fastapi_users, auth_backend

router = APIRouter(prefix="/auth", tags=["auth"])

# Include fastapi-users auth routes (login, register, etc.)
router.include_router(
    fastapi_users.get_auth_router(auth_backend), 
    prefix="/jwt", 
    tags=["auth"]
)

router.include_router(
    fastapi_users.get_register_router(models.UserRead, models.UserCreate),
    prefix="/jwt",
    tags=["auth"],
)


@router.get("/me", response_model=models.UserRead)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """
    Get current user information. Works with both JWT and demo session.
    """
    return current_user


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


@router.post("/logout")
def logout(response: Response):
    """
    Clear demo session cookie and log out user.
    """
    response.delete_cookie(
        key="demo_session",
        httponly=True,
        samesite="lax",
        secure=True,
    )
    return {"message": "Logged out successfully"}