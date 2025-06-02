import io
import logging
import os
import sys
import tempfile
from pathlib import Path
from azure.storage.blob import (
    BlobSasPermissions, 
    BlobServiceClient,
    generate_blob_sas
)
from dotenv import load_dotenv
from ebooklib import epub
import uuid

logging.basicConfig(level=logging.INFO)

# Add the project's base directory (e.g., 'backend') to sys.path
script_file_path = os.path.abspath(__file__)
# .../backend/app/scripts/ebookExtraction.py
scripts_dir = os.path.dirname(script_file_path)
# .../backend/app/scripts
app_dir = os.path.dirname(scripts_dir)
# .../backend/app
project_root_for_imports = os.path.dirname(app_dir)
# .../backend
sys.path.insert(0, project_root_for_imports)  # Prepend to ensure it's prioritized

from app import database, models
from app.services.storage import AzureBlobStorageService

#Instantiate the database
database.instantiate_db()

load_dotenv(".env.dev")

logging.info(f"AZURE_STORAGE_CONNECTION_STRING: {os.getenv('AZURE_STORAGE_CONNECTION_STRING')}")

blob_svc = BlobServiceClient.from_connection_string(
    os.getenv("AZURE_STORAGE_CONNECTION_STRING")
)


def write_to_sql(
    book_id: int,
    title: str,
    author: str,
    blob_name: str,
    cover_blob_name: str,
    content_type: str,
):
    sessionLocal = next(database.get_db())
    book = models.Book(
        bookId=book_id,
        title=title,
        author=author,
        blob_name=blob_name,
        cover_blob_name=cover_blob_name,
        content_type=content_type,
    )
    sessionLocal.add(book)
    sessionLocal.commit()
    sessionLocal.close()
    logging.info(
        f"Wrote to db: {book_id}, {title}, {author}, {blob_name}, {cover_blob_name}, {content_type}"
    )
    return book


def upload_cover_image(cover_blob_name: str, data: bytes):
    try:
        blob_service = AzureBlobStorageService(container_name="coverimages")
        blob_service.upload_blob(cover_blob_name, data)
    except Exception as e:
        logging.error(f"Error uploading cover image: {e}")


def extract_metadata(blob_name: str):
    try:
        blob_service = AzureBlobStorageService()
        blob_data_bytes = blob_service.download_blob(blob_name)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".epub") as temp_file:
            temp_file.write(blob_data_bytes)
            book = epub.read_epub(temp_file.name)
        
        cover_blob_name = f"{book.get_metadata('DC', 'title')[0][0]}.png"
        metadata = {
            "book_id": uuid.uuid4(),
            "title": book.get_metadata("DC", "title")[0][0],
            "author": book.get_metadata("DC", "creator")[0][0],
            "blob_name": blob_name,
            "cover_blob_name": cover_blob_name,
            "content_type": "application/epub+zip",
        }
        
        for i, item in enumerate(book.get_items()):
            if item.get_type() == 10 and i == 0:
                if item.get_content().startswith(b"\x89PNG"):
                    upload_cover_image(
                        cover_blob_name, item.get_content()
                    )
                else:
                    logging.warning(f"Item {i} is not an image")
        logging.info(f"Writing to sql for {blob_name}: {metadata}")
        book = write_to_sql(**metadata)

    except Exception as e:
        logging.error(f"Error extracting metadata: {e}")


def get_ebooks():
    blob_service = AzureBlobStorageService()
    for blob in blob_service.list_blobs():
        logging.info(f"****blob.name: {blob}")
        extract_metadata(blob)


if __name__ == "__main__":
    get_ebooks()

# Get ebooks from Azure Blob Storage
