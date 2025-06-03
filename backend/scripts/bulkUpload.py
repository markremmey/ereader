import io
import logging
import os
import sys
import tempfile
from pathlib import Path
from PIL import Image

from azure.storage.blob import (
    BlobSasPermissions, 
    BlobServiceClient,
    generate_blob_sas
)
from dotenv import load_dotenv, find_dotenv
from ebooklib import epub
import uuid
import argparse
logging.basicConfig(level=logging.INFO)

# Add the project's base directory (e.g., 'backend') to sys.path
script_file_path = os.path.abspath(__file__)
scripts_dir = os.path.dirname(script_file_path)
backend_dir = os.path.dirname(scripts_dir)
sys.path.insert(0, backend_dir)  # Prepend to ensure it's prioritized

load_dotenv(find_dotenv('.env.dev'))
logging.info(f"AZURE_STORAGE_CONNECTION_STRING: {os.getenv('AZURE_STORAGE_CONNECTION_STRING')}")

from app import database, models
from app.services.storage import AzureBlobStorageService

#Instantiate the database
database.instantiate_db()

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
        blob_service = AzureBlobStorageService()
        blob_service.upload_blob(cover_blob_name, data, container_name="coverimages")
    except Exception as e:
        logging.error(f"Error uploading cover image: {e}")


def extract_metadata(file_path: str):
    try:
        book = epub.read_epub(file_path)
        blob_name = file_path.split("/")[-1]
        cover_blob_name = f"{book.get_metadata('DC', 'title')[0][0]}.png"
        metadata = {
            "book_id": uuid.uuid4(),
            "title": book.get_metadata("DC", "title")[0][0],
            "author": book.get_metadata("DC", "creator")[0][0],
            "blob_name": blob_name,
            "cover_blob_name": cover_blob_name,
            "content_type": "application/epub+zip"
        }
        
        item = book.get_items()[0]

        if item.get_type() == 10 or item.get_content().startswith(b"\x89PNG"):
            raw = item.get_content()
            try:
                img = Image.open(io.BytesIO(raw))
                # Re‐save as PNG into a bytes buffer:
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                png_bytes = buf.getvalue()
                upload_cover_image(cover_blob_name, png_bytes)
                logging.info(f"✔️ Converted and uploaded '{cover_blob_name}'")
            except Exception:
                logging.info(f"⚠️ Item is not a valid image (or Pillow couldn't open it)")
                metadata["cover_blob_name"] = "FAILURE_DURING_UPLOAD"
        logging.info(f"Writing to sql for {blob_name}: {metadata}")
        book = write_to_sql(**metadata)

    except Exception as e:
        logging.error(f"Error extracting metadata: {e}")


def directoryUpload(directory: str):
    directory_path = Path(directory)
    if not directory_path.exists():
        print(f"Directory {directory} does not exist")
        return

    for file_path in directory_path.glob("*.epub"):
        blob_name = file_path.name
        
        db_session_for_check = next(database.get_db())
        try:
            existing_book = db_session_for_check.query(models.Book).filter(models.Book.blob_name == blob_name).first()
        finally:
            db_session_for_check.close()

        if existing_book:
            logging.info(f"Book {blob_name} already exists in the database. Skipping.")
            continue

        print(f"Uploading {file_path}...")
        extract_metadata(str(file_path))  # Pass string representation of Path
        # upload_to_blob_storage(file_path) # This function is not defined in the provided code.
                                            # Assuming it's defined elsewhere or should be part of extract_metadata.
                                            # If upload_to_blob_storage is separate and needed, ensure it's correctly called.


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=str, default="localStorage")
    args = parser.parse_args()
    directoryUpload(args.directory)

# Get ebooks from Azure Blob Storage
