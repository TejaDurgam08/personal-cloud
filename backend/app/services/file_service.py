"""Business logic for file upload/list/download/delete. Delegates all
filesystem access to StorageService; never touches disk directly."""
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.file import File
from app.storage.storage_service import StorageError, StorageService
from app.utils.filenames import sanitize_display_name

settings = get_settings()
storage_service = StorageService()


async def upload_file(db: Session, user_id: str, upload_file: UploadFile) -> File:
    if not upload_file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    display_name = sanitize_display_name(upload_file.filename)

    try:
        stored_filename, relative_path, size = await storage_service.save_file(
            user_id=user_id,
            upload_file=upload_file,
            max_bytes=settings.max_upload_size_bytes,
        )
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc

    file_record = File(
        user_id=user_id,
        filename=display_name,
        stored_filename=stored_filename,
        file_size=size,
        mime_type=upload_file.content_type or "application/octet-stream",
        storage_path=relative_path,
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    return file_record


def list_files(db: Session, user_id: str) -> list[File]:
    return list(
        db.execute(
            select(File).where(File.user_id == user_id).order_by(File.uploaded_at.desc())
        ).scalars()
    )


def get_owned_file(db: Session, user_id: str, file_id: str) -> File:
    """Fetch a file record, enforcing that it belongs to the requesting user.
    Used by both download and delete so authorization can never be skipped."""
    file_record = db.get(File, file_id)
    if file_record is None or file_record.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return file_record


def delete_file(db: Session, user_id: str, file_id: str) -> None:
    file_record = get_owned_file(db, user_id, file_id)
    storage_service.delete_file(user_id, file_record.stored_filename)
    db.delete(file_record)
    db.commit()


def get_storage_usage(db: Session, user_id: str) -> tuple[int, int]:
    """Returns (used_bytes, file_count) computed from the database, which
    is far cheaper on a Pi Zero than walking the filesystem on every call."""
    result = db.execute(
        select(func.coalesce(func.sum(File.file_size), 0), func.count(File.id)).where(
            File.user_id == user_id
        )
    ).one()
    used_bytes, file_count = result
    return int(used_bytes), int(file_count)
