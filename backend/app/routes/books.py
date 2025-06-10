# backend/app/routes/books.py
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .. import auth, database, models, schemas
from ..services.storage import AzureBlobStorageService
from ..users import current_active_user
logging.basicConfig(level=logging.INFO)
router = APIRouter(prefix="/books", tags=["books"])

blob_service = AzureBlobStorageService()

@router.get("/", response_model=schemas.BookList)
async def list_books(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(current_active_user),
):
    stmt = select(models.Book)
    result = await db.execute(stmt)
    db_books = result.scalars().all()
    logging.info(f"books.py:list_books: db_books: {db_books}")
    
    for book in db_books:
        book.cover_blob_url = blob_service.get_sas_url_cached(book.cover_blob_name, container_name="coverimages")
    return schemas.BookList(book_list=db_books)


@router.get("/get_full_blob_url/{blob_name}", response_model=str)
async def get_blob_sas(blob_name: str, current_user: models.User = Depends(current_active_user)): 
    logging.info(f"blob_name: {blob_name}")
    sasUrl = blob_service.get_sas_url_cached(blob_name, container_name="defaultlibrary")
    logging.info(f"books.py:get_blob_sas: sasUrl: {sasUrl}")
    return sasUrl


@router.get("/{book_id}/file")
async def get_book_file(
    book_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(current_active_user),
):
    
    return None
