## bulkUpload.py
## Upload all ebooks in the localStorage folder to the sqlite database and azure blob storage

import os
import argparse
import sqlite3
from pathlib import Path
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
# from app import models, database
from ebooklib import epub

load_dotenv()

print("Starting bulk upload...")
container_name = os.getenv("AZURE_STORAGE_CONTAINER_NAME")

def extract_metadata(file_path: Path):
    book = epub.read_epub(file_path)
    title= book.get_metadata('DC', 'title')
    print(f"Title: {title}")
    print(f"Author: {book.get_metadata('DC', 'creator')}")
    for i, item in enumerate(book.get_items()):
        print(item)
        if item.get_type() == 10 or i == 0:
            output_path = Path(f"images/{title[0]}_{i}.png")
            with open(output_path, 'wb') as f:
                f.write(item.get_content())
    return title

def upload_to_blob_storage(file_path: Path):
    try:
        print(f"Uploading {file_path} to {container_name}...")
        blob_service = BlobServiceClient.from_connection_string(os.getenv("AZURE_STORAGE_CONNECTION_STRING"))
        container_client = blob_service.get_container_client(container_name)
        blob_client = container_client.get_blob_client(file_path.name)
        
        with open(file_path, 'rb') as data:
            res = blob_client.upload_blob(data)
        print(f"Uploaded {file_path} to {container_name} with result {res}")
    except Exception as e:
        print(f"Error uploading {file_path} to {container_name}: {e}")

def directoryUpload(directory: str):
    directory_path = Path(directory)
    if not directory_path.exists():
        print(f"Directory {directory} does not exist")
        return
        
    for file_path in directory_path.glob("*.epub"):
        print(f"Uploading {file_path}...")
        metadata = extract_metadata(file_path)
        upload_to_blob_storage(file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=str, default="localStorage")
    args = parser.parse_args()
    directoryUpload(args.directory)