# backend/app/schemas.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class UserRead(BaseModel):
    id: int
    username: str
    class Config:
        orm_mode = True  # allows reading SQLAlchemy model instances

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class BookInfo(BaseModel):
    id: int
    title: str
    content_type: str
    class Config:
        orm_mode = True