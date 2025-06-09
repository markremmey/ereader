# backend/app/schemas.py
from pydantic import BaseModel, ConfigDict
from uuid import UUID


# class UserCreate(BaseModel):
#     email: str
#     password: str


# class UserRead(BaseModel):
#     id: UUID
#     email: str

#     model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class BlobObj(BaseModel):
    id: str
    name: str
    url: str

class BlobList(BaseModel):
    blob_list: list[BlobObj]

class BookInfo(BaseModel):
    bookId: UUID
    title: str
    author: str
    blob_name: str
    cover_blob_name: str
    content_type: str
    cover_blob_url: str | None = None

    model_config = ConfigDict(from_attributes=True)

class BookList(BaseModel):
    book_list: list[BookInfo]