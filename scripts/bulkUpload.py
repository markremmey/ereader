## bulkUpload.py
## Upload all ebooks in the localStorage folder to the sqlite database and azure blob storage

import os
import sqlite3
from azure.storage.blob import BlobServiceClient

print("Starting bulk upload...")

