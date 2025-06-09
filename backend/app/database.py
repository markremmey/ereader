# backend/app/database.py
import logging
import os
import struct
import urllib.parse  # Added for Azure SQL connection string

from azure.identity import DefaultAzureCredential
# Connection string for Azure SQL - get this from environment variables
from dotenv import load_dotenv
# from sqlalchemy.dialects.mssql import SQL_COPT_SS_ACCESS_TOKEN
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi_users.db import SQLAlchemyUserDatabase
from . import models

logging.basicConfig(level=logging.INFO)
logging.info("Loading environment variables")


if os.getenv("AZURE_SQL_CONNECTION_STRING") is None:
    logging.info("Loading environment variables from .env file")
    logging.info(f"Current working directory: {os.getcwd()}")
    load_dotenv("../../.env.dev")

AZURE_SQL_CONNECTION_STRING = os.getenv("AZURE_SQL_CONNECTION_STRING")
logging.info(f"AZURE_SQL_CONNECTION_STRING: {AZURE_SQL_CONNECTION_STRING}")

if not AZURE_SQL_CONNECTION_STRING:
    raise RuntimeError(
        "AZURE_SQL_CONNECTION_STRING environment variable must be set. "
        "Example: 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:yourserver.database.windows.net,1433;"
        "Database=yourdb;Uid=youruser;Pwd=yourpassword;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30'"
    )
# driver_name = '{ODBC Driver 18 for SQL Server}'
# server_name = 'sql-fg-database-s4ujd'
# database_name = 'sqldb-fg-database-s4ujd'

# connection_string = 'Driver={};Server=tcp:{}.database.windows.net,1433;Database={};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30'.format(driver_name, server_name, database_name)
# URL-encode the ODBC connection string
params = urllib.parse.quote_plus(AZURE_SQL_CONNECTION_STRING)
engine_url = f"mssql+aioodbc:///?odbc_connect={params}"

# Create async engine
engine = create_async_engine(engine_url)
AsyncSessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession,
    autoflush=False, 
    autocommit=False
)

credential = DefaultAzureCredential()
TOKEN_URL = "https://database.windows.net/.default"

@event.listens_for(engine.sync_engine, "do_connect")
def provide_token(dialect, conn_rec, cargs, cparams):
    # remove the "Trusted_Connection" parameter that SQLAlchemy adds
    if cargs and len(cargs) > 0:
        cargs[0] = cargs[0].replace(";Trusted_Connection=Yes", "")

    # create token credential
    raw_token = credential.get_token(TOKEN_URL).token.encode("utf-16-le")
    token_struct = struct.pack(f"<I{len(raw_token)}s", len(raw_token), raw_token)
    SQL_COPT_SS_ACCESS_TOKEN = 1256
    # apply it to keyword arguments
    cparams["attrs_before"] = {SQL_COPT_SS_ACCESS_TOKEN: token_struct}

async def get_user_db():
    async with AsyncSessionLocal() as session:
        yield SQLAlchemyUserDatabase(session, models.User)

# Async dependency to get DB session
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def instantiate_db():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)