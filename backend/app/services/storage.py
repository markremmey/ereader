# backend/app/services/storage.py
import json
import logging
import os
from datetime import datetime, timedelta, timezone

import redis
from azure.storage.blob import (
    BlobSasPermissions, 
    BlobServiceClient,
    generate_blob_sas
)

logging.basicConfig(level=logging.INFO)
_redis = redis.Redis.from_url(os.getenv("REDIS_URL"))


# Placeholder for Azure storage service (for future use)
class AzureBlobStorageService:
    def __init__(self):
        self.account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.blob_svc = BlobServiceClient.from_connection_string(self.connection_string)
        self.account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")

    def generate_sas_url(self, blob_name: str, expires_in_hours: int = 1, container_name: str | None = None):
        target_container = container_name if container_name is not None else os.getenv("AZURE_STORAGE_CONTAINER_NAME")
        sas = generate_blob_sas(
            account_name=self.account_name,
            container_name=target_container,
            blob_name=blob_name,
            account_key=self.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
        )
        logging.info(f"storage.py:generate_sas_url: SAS: {sas}")
        full_url = f"https://{self.account_name}.blob.core.windows.net/{target_container}/{blob_name}?{sas}"
        logging.info(f"storage.py:generate_sas_url: Full URL: {full_url}")
        return full_url

    def get_sas_url_cached(self, blob_name: str, container_name: str | None = None) -> str:
        logging.info(f"get_sas_url_cached: {blob_name}")
        key = f"sas_url:{container_name}:{blob_name}"
        cached = _redis.get(key)
        if cached:
            logging.info(
                f"storage.py:get_sas_url_cached: URL Cached: {cached.decode()}"
            )
            return cached.decode()

        sas_url = self.generate_sas_url(blob_name, expires_in_hours=1, container_name=container_name)
        logging.info(f"storage.py:get_sas_url_cached: URL Generated: {sas_url}")

        _redis.set(key, sas_url, ex=3500)
        return sas_url

    def list_blobs(self, container_name: str | None = None):
        container_client = self.blob_svc.get_container_client(container_name if container_name is not None else os.getenv("AZURE_STORAGE_CONTAINER_NAME"))
        blob_list = container_client.list_blobs()
        return [blob.name for blob in blob_list]

    def upload_blob(self, blob_name: str, data: bytes, metadata: dict = None, container_name: str | None = None):
        container_client = self.blob_svc.get_container_client(container_name if container_name is not None else os.getenv("AZURE_STORAGE_CONTAINER_NAME"))
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(data, metadata=metadata if metadata else None)

    def download_blob(self, blob_name: str, container_name: str | None = None):
        container_client = self.blob_svc.get_container_client(container_name if container_name is not None else os.getenv("AZURE_STORAGE_CONTAINER_NAME"))
        blob_client = container_client.get_blob_client(blob_name)
        return blob_client.download_blob().readall()
