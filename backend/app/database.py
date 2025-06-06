# backend/app/database.py
import logging
import os
import struct
import urllib.parse  # Added for Azure SQL connection string

from azure.identity import DefaultAzureCredential
# Connection string for Azure SQL - get this from environment variables
from dotenv import load_dotenv
# from sqlalchemy.dialects.mssql import SQL_COPT_SS_ACCESS_TOKEN
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi import Depends
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
engine_url = f"mssql+pyodbc:///?odbc_connect={params}"


engine = create_engine(engine_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

credential = DefaultAzureCredential()
TOKEN_URL = "https://database.windows.net/.default"

@event.listens_for(engine, "do_connect")
def provide_token(dialect, conn_rec, cargs, cparams):
    # remove the "Trusted_Connection" parameter that SQLAlchemy adds
    cargs[0] = cargs[0].replace(";Trusted_Connection=Yes", "")

    # create token credential
    raw_token = credential.get_token(TOKEN_URL).token.encode("utf-16-le")
    token_struct = struct.pack(f"<I{len(raw_token)}s", len(raw_token), raw_token)
    SQL_COPT_SS_ACCESS_TOKEN = 1256
    # apply it to keyword arguments
    cparams["attrs_before"] = {SQL_COPT_SS_ACCESS_TOKEN: token_struct}

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def instantiate_db():
    models.Base.metadata.create_all(bind=engine)

def get_user_db(session: Session = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, models.User)