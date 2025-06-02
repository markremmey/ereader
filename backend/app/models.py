# backend/app/models.py
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(128), nullable=False)
    # Potential additional fields: email, created_at, etc.
    # books = relationship("Book", back_populates="owner")


class Book(Base):
    __tablename__ = "books"
    bookId = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(200), nullable=False)
    author = Column(String(200), nullable=False)
    blob_name = Column(String(200), nullable=False)
    cover_blob_name = Column(String(200), nullable=False)
    content_type = Column(String(20), nullable=False)