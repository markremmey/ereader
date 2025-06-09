# backend/app/main.py
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from . import auth, database, models
from .routes import auth as auth_routes
from .routes import books as books_routes
from .routes import chat as chat_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database (create tables)
    await database.instantiate_db()
    yield
    # Cleanup code could go here if needed

app = FastAPI(title="eReader API", version="0.1.0", lifespan=lifespan)

# CORS settings – allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://lyceum-app.com",
        "https://www.lyceum-app.com",
    ],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory as static (optional, used if we serve files directly)
uploads_dir = os.path.join(os.getcwd(), "uploads")
if not os.path.isdir(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include API routers (all under /api for clarity)
app.include_router(auth_routes.router, prefix="/api")
app.include_router(books_routes.router, prefix="/api")
app.include_router(chat_routes.router, prefix="/api")

if os.getenv("DEV_MODE"):
    def override_get_current_user():
        """
            Return a "fake" user for development.
            You can either construct a User in memory, or
            fetch/create one from your database here.
        """
        import uuid
        return models.User(id=uuid.uuid4(), email="dev@example.com")

    app.dependency_overrides[auth.get_current_user] = override_get_current_user
