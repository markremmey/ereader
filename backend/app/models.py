# backend/app/models.py
from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
import uuid
from fastapi_users import schemas
from fastapi_users.db import SQLAlchemyBaseUserTableUUID

Base = declarative_base()


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass

class UserCreate(schemas.BaseUserCreate):
    pass

class UserUpdate(schemas.BaseUserUpdate):
    pass

# Default schema for user model
class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

class Book(Base):
    __tablename__ = "books"
    bookId = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(200), nullable=False)
    author = Column(String(200), nullable=False)
    blob_name = Column(String(200), nullable=False)
    cover_blob_name = Column(String(200), nullable=False)
    content_type = Column(String(20), nullable=False)