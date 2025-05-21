# backend/app/routes/books.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import logging

from .. import models, schemas, auth, database
from ..services.storage import AzureBlobStorageService

router = APIRouter(prefix="/books", tags=["books"])

@router.get("/", response_model=schemas.BlobList)
def list_books(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    blob_service = AzureBlobStorageService()

    # blob_service.generate_sas_url("test-epub/pg18569-images-3.epub")
    blob_list = []
    
    for i, item in enumerate(blob_service.list_blobs()):
        logging.info(f"item: {item}")
        blob_list.append({"id": str(i), "name": item, "url": blob_service.generate_sas_url(item)})

    logging.info(f"blob_list: {blob_list}")
    return schemas.BlobList(blob_list=blob_list)

def get_blob_sas(book_id: int):
    blob_service = AzureBlobStorageService()
    return blob_service.generate_sas_url(blob_service.list_blobs()[book_id])

@router.get("/{book_id}/file")
def get_book_file(book_id: int, 
                  db: Session = Depends(database.get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    return None