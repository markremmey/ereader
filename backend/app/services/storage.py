# backend/app/services/storage.py
import os, shutil
from fastapi import UploadFile

# Define base uploads directory
BASE_UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")

class LocalStorageService:
    """Handles saving files to local filesystem."""
    def __init__(self, base_dir: str = BASE_UPLOAD_DIR):
        self.base_dir = base_dir

    def save_upload(self, upload_file: UploadFile, user_id: int) -> str:
        # Create user directory if not exists
        user_folder = os.path.join(self.base_dir, str(user_id))
        os.makedirs(user_folder, exist_ok=True)
        file_path = os.path.join(user_folder, upload_file.filename)
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return file_path

# Placeholder for Azure storage service (for future use)
class AzureBlobStorageService:
    def __init__(self, container_name: str):
        # In a real setup, initialize Azure Blob client here using credentials
        self.container = container_name
        # e.g., BlobServiceClient.from_connection_string(...)

    def save_upload(self, upload_file: UploadFile, user_id: int) -> str:
        # This method would upload the file to Azure Blob Storage
        # and return the blob URL or identifier.
        raise NotImplementedError("Azure storage not implemented in starter code")

# Initialize the storage service (choose Local for now, easy to swap later)
storage_service = LocalStorageService()
