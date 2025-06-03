# backend/app/routes/books.py
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas
from ..services.storage import AzureBlobStorageService

logging.basicConfig(level=logging.INFO)
router = APIRouter(prefix="/books", tags=["books"])

blob_service = AzureBlobStorageService()
@router.get("/", response_model=schemas.BookList)
def list_books(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_books = db.query(models.Book).all()
    logging.info(f"books.py:list_books: db_books: {db_books}")
    
    for book in db_books:
        book.cover_blob_url = blob_service.get_sas_url_cached(book.cover_blob_name, container_name="coverimages")
    return schemas.BookList(book_list=db_books)


@router.get("/get_full_blob_url/{blob_name}", response_model=str)
def get_blob_sas(blob_name: str): 
    logging.info(f"blob_name: {blob_name}")
    sasUrl = blob_service.get_sas_url_cached(blob_name, container_name="defaultlibrary")
    logging.info(f"books.py:get_blob_sas: sasUrl: {sasUrl}")
    return sasUrl


@router.get("/{book_id}/file")
def get_book_file(
    book_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    
    return None
