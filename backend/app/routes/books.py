# backend/app/routes/books.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import logging

from .. import models, schemas, auth, database
from ..services.storage import AzureBlobStorageService
logging.basicConfig(level=logging.INFO)
router = APIRouter(prefix="/books", tags=["books"])

@router.get("/", response_model=schemas.BlobList)
def list_books(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)): 
    blob_service = AzureBlobStorageService()

    # blob_service.generate_sas_url("test-epub/pg18569-images-3.epub")
    blob_list = []
    logging.info(f"books.py:list_books: blob_service.list_blobs(): {blob_service.list_blobs()}")
    for i, blob_name in enumerate(blob_service.list_blobs()):
        logging.info(f"blob_name: {blob_name}")
        blob_list.append({"id": str(i), "name": blob_name, "url": blob_service.get_sas_url_cached(blob_name)})
        logging.info(f"books.py:list_books: blob_list[{i}]: {blob_list[i]}")

    return schemas.BlobList(blob_list=blob_list)

@router.get("/get_full_blob_url/{blob_name}", response_model=str)
def get_blob_sas(blob_name: str):
    logging.info(f"blob_name: {blob_name}")
    blob_service = AzureBlobStorageService()
    sasUrl = blob_service.get_sas_url_cached(blob_name)
    logging.info(f"books.py:get_blob_sas: sasUrl: {sasUrl}")
    return sasUrl

@router.get("/{book_id}/file")
def get_book_file(book_id: int, 
                  db: Session = Depends(database.get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    return None