# backend/app/services/storage.py
import os
from datetime import datetime, timedelta, timezone
from azure.storage.blob import (
    BlobServiceClient, generate_blob_sas, BlobSasPermissions
)

# Placeholder for Azure storage service (for future use)
class AzureBlobStorageService:
    def __init__(self):
        self.account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.blob_svc = BlobServiceClient.from_connection_string(self.connection_string)
        self.container = os.getenv("AZURE_STORAGE_CONTAINER_NAME")
        self.account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")

    def generate_sas_url(self, blob_name: str, expires_in_hours: int = 1):
        sas = generate_blob_sas(
            account_name=self.account_name,
            container_name=self.container,
            blob_name=blob_name,
            account_key=self.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
        )
        return f"https://{self.account_name}.blob.core.windows.net/{self.container}/{blob_name}?{sas}"
        # return sas
    def list_blobs(self):
        container_client = self.blob_svc.get_container_client(self.container)
        blob_list = container_client.list_blobs()
        return [blob.name for blob in blob_list]

