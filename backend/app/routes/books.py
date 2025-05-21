# backend/app/routes/books.py
import shutil
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse, HTMLResponse
from sqlalchemy.orm import Session
import ebooklib
from ebooklib import epub
import logging
# import bleach

from .. import models, schemas, auth, database
from ..services.storage import storage_service
# If we want to use Redis, import and initialize it (optional):
import os, redis
REDIS_URL = os.getenv("REDIS_URL")
redis_client = redis.from_url(REDIS_URL) if REDIS_URL else None

router = APIRouter(prefix="/books", tags=["books"])

@router.post("/upload", response_model=schemas.BookInfo)
def upload_book(file: UploadFile = File(...), 
                db: Session = Depends(database.get_db),
                current_user: models.User = Depends(auth.get_current_user)):
    # Only allow specific file types (basic check)
    filename = file.filename
    if not (filename.endswith(".epub") or filename.endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Only EPUB or PDF files are allowed")
    # Save file to local storage
    saved_path = storage_service.save_upload(file, current_user.id)
    # Determine content type
    content_type = "epub" if filename.endswith(".epub") else "pdf"
    # Determine title: for epub, extract title metadata if possible; for pdf, use filename
    title = filename
    if content_type == "epub":
        try:
            book = epub.read_epub(saved_path)
            # Try to get title metadata
            metadata = book.get_metadata('DC', 'title')
            if metadata:
                title = metadata[0][0]
        except Exception:
            # If any parsing issue, just use filename
            title = filename
    # Create Book record in DB
    new_book = models.Book(title=title, file_name=saved_path.split("/")[-1], 
                            content_type=content_type, owner_id=current_user.id)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@router.get("/", response_model=list[schemas.BookInfo])
def list_books(db: Session = Depends(database.get_db),
               current_user: models.User = Depends(auth.get_current_user)):
    books = db.query(models.Book).filter(models.Book.owner_id == current_user.id).all()
    return books

@router.get("/{book_id}/file")
def get_book_file(book_id: int, 
                  db: Session = Depends(database.get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    # Retrieve book and verify ownership
    book = db.query(models.Book).filter(models.Book.id == book_id, 
                                        models.Book.owner_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    file_path = os.path.join(os.getcwd(), "uploads", str(current_user.id), book.file_name)
    if book.content_type == "pdf":
        # Return PDF file directly
        return FileResponse(file_path, media_type="application/pdf", filename=book.file_name)
    else:
        # For ePub, we do not return the raw file (we will have a separate endpoint to read content)
        # Alternatively, could stream the file if needed.
        logging.info(f"Returning ePub file: {file_path}")
        return FileResponse(file_path, media_type="application/epub+zip", filename=book.file_name)

@router.get("/{book_id}/chapters")
def list_chapters(book_id: int,
                  db: Session = Depends(database.get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    """Return a list of chapters (by index and maybe title) for the given ePub book."""
    book = db.query(models.Book).filter(models.Book.id == book_id, 
                                        models.Book.owner_id == current_user.id).first()
    if not book or book.content_type != "epub":
        raise HTTPException(status_code=404, detail="Book not found or not an EPUB")
    # Construct cache key for chapter list
    cache_key = f"book:{book_id}:chapters:list"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            # If we cached chapter titles/count before, return that
            return {"chapters": cached.decode().split("||")}  # assume we stored as "title1||title2||..."
    # If not cached, read the ePub to get chapter count or titles
    file_path = os.path.join(os.getcwd(), "uploads", str(current_user.id), book.file_name)
    try:
        epub_book = epub.read_epub(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read EPUB: {e}")
    chapters = []
    for item in epub_book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        # Use item.get_name() or an incremental title
        name = item.get_name() or f"Chapter {len(chapters)+1}"
        chapters.append(name)
    # Cache the chapter list
    if redis_client:
        redis_client.set(cache_key, "||".join(chapters))
    return {"chapters": chapters}

@router.get("/{book_id}/chapters/{index}")
def read_chapter(book_id: int, index: int,
                 db: Session = Depends(database.get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    """Return the HTML content of a specific chapter of an ePub book."""
    book = db.query(models.Book).filter(models.Book.id == book_id, 
                                        models.Book.owner_id == current_user.id).first()
    if not book or book.content_type != "epub":
        raise HTTPException(status_code=404, detail="Book not found or not an EPUB")
    file_path = os.path.join(os.getcwd(), "uploads", str(current_user.id), book.file_name)
    cache_key = f"book:{book_id}:chapter:{index}"
    # Check cache first
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            html = cached.decode()
            return HTMLResponse(content=html)
    # Not cached – open ePub and get specified chapter
    try:
        epub_book = epub.read_epub(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read EPUB: {e}")
    chapters = list(epub_book.get_items_of_type(ebooklib.ITEM_DOCUMENT))
    if index < 0 or index >= len(chapters):
        raise HTTPException(status_code=400, detail="Chapter index out of range")
    chapter_item = chapters[index]
    clean = chapter_item.get_content().decode("utf-8", errors="ignore")
    # clean = bleach.clean(html)
    # Cache the chapter content for future
    if redis_client:
        redis_client.set(cache_key, clean)
    return HTMLResponse(content=clean)
