# backend/app/models.py
from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
import uuid

Base = declarative_base()


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    # email = Column(String, unique=True, nullable=False, index=True)
    # hashed_password = Column(String(128), nullable=False)
    # is_active = Column(Boolean, default=True, nullable=False)
    # is_superuser = Column(Boolean, default=False, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Book(Base):
    __tablename__ = "books"
    bookId = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(200), nullable=False)
    author = Column(String(200), nullable=False)
    blob_name = Column(String(200), nullable=False)
    cover_blob_name = Column(String(200), nullable=False)
    content_type = Column(String(20), nullable=False)