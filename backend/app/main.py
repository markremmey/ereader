# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from . import models, database
from .routes import auth as auth_routes, books as books_routes, chat as chat_routes

# Initialize database (create tables)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="eReader API", version="0.1.0")

# CORS settings – allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # frontend origin
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
