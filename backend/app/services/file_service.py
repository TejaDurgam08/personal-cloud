
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.file import File
from app.schemas.file import FileOut
from app.services import folder_service
from app.storage.storage_service import StorageError, StorageService
from app.utils.file_types import FileCategory, categorize, icon_for
from app.utils.filenames import sanitize_display_name

settings = get_settings()
storage_service = StorageService()

SORTABLE_FIELDS = {
    "name": File.filename,
    "uploaded_at": File.uploaded_at,
    "updated_at": File.updated_at,
    "size": File.file_size,
    "type": File.mime_type,
}


def to_file_out(file: File) -> FileOut:
    return FileOut(
        id=file.id,
        filename=file.filename,
        folder_id=file.folder_id,
        file_size=file.file_size,
        mime_type=file.mime_type,
        category=categorize(file.filename).value,
        icon=icon_for(file.filename),
        is_favorite=file.is_favorite,
        uploaded_at=file.uploaded_at,
        updated_at=file.updated_at,
        last_opened=file.last_opened,
    )


# ----------------------------------------------------------------------
# Upload
# ----------------------------------------------------------------------
async def upload_file(db: Session, user_id: str, upload_file: UploadFile, folder_id: str | None = None) -> File:
    if not upload_file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    if folder_id is not None:
        folder_service.get_owned_folder(db, user_id, folder_id)  # 404s if not owned

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
        folder_id=folder_id,
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


# ----------------------------------------------------------------------
# Lookup / authorization
# ----------------------------------------------------------------------
def get_owned_file(db: Session, user_id: str, file_id: str, include_deleted: bool = False) -> File:
    file_record = db.get(File, file_id)
    if file_record is None or file_record.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    if file_record.is_deleted and not include_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return file_record


def query_files(
    db: Session,
    user_id: str,
    *,
    folder_id: str | None = "__unset__",  
    search_query: str | None = None,
    extension: str | None = None,
    category: str | None = None,
    sort_by: str = "name",
    order: str = "asc",
    include_deleted: bool = False,
    favorite_only: bool = False,
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[File], int]:
    conditions = [File.user_id == user_id]

    if folder_id != "__unset__":
        conditions.append(File.folder_id == folder_id)

    conditions.append(File.is_deleted == include_deleted)

    if favorite_only:
        conditions.append(File.is_favorite == True)  

    if search_query:
        like_pattern = f"%{search_query.lower()}%"
        conditions.append(func.lower(File.filename).like(like_pattern))

    if extension:
        ext = extension if extension.startswith(".") else f".{extension}"
        conditions.append(func.lower(File.filename).like(f"%{ext.lower()}"))

    stmt = select(File).where(and_(*conditions))
    count_stmt = select(func.count(File.id)).where(and_(*conditions))

    total = db.execute(count_stmt).scalar_one()

    sort_column = SORTABLE_FIELDS.get(sort_by, File.filename)
    sort_column = sort_column.desc() if order == "desc" else sort_column.asc()
    stmt = stmt.order_by(sort_column)

    if limit is not None:
        stmt = stmt.limit(limit).offset(offset)

    results = list(db.execute(stmt).scalars())

    if category:
        try:
            wanted = FileCategory(category)
            results = [f for f in results if categorize(f.filename) == wanted]
        except ValueError:
            pass

    return results, total


# ----------------------------------------------------------------------
# Rename / move / copy / favorite
# ----------------------------------------------------------------------
def rename_file(db: Session, user_id: str, file_id: str, new_name: str) -> File:
    file_record = get_owned_file(db, user_id, file_id)
    file_record.filename = sanitize_display_name(new_name)
    db.commit()
    db.refresh(file_record)
    return file_record


def move_file(db: Session, user_id: str, file_id: str, folder_id: str | None) -> File:
    file_record = get_owned_file(db, user_id, file_id)
    if folder_id is not None:
        folder_service.get_owned_folder(db, user_id, folder_id)  # 404s if not owned
    file_record.folder_id = folder_id
    db.commit()
    db.refresh(file_record)
    return file_record


async def copy_file(db: Session, user_id: str, file_id: str) -> File:
    source = get_owned_file(db, user_id, file_id)

    try:
        stored_filename, relative_path, size = storage_service.copy_file(
            user_id, source.stored_filename, source.filename
        )
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    copy_name = _next_copy_name(db, user_id, source.folder_id, source.filename)

    new_file = File(
        user_id=user_id,
        folder_id=source.folder_id,
        filename=copy_name,
        stored_filename=stored_filename,
        file_size=size,
        mime_type=source.mime_type,
        storage_path=relative_path,
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return new_file


def _next_copy_name(db: Session, user_id: str, folder_id: str | None, original_name: str) -> str:
    import os

    stem, ext = os.path.splitext(original_name)
    candidate = f"{stem} (copy){ext}"
    n = 2
    while db.execute(
        select(File.id).where(
            File.user_id == user_id, File.folder_id == folder_id, File.filename == candidate, File.is_deleted == False  # noqa: E712
        )
    ).first():
        candidate = f"{stem} (copy) ({n}){ext}"
        n += 1
    return candidate


def set_favorite(db: Session, user_id: str, file_id: str, is_favorite: bool) -> File:
    file_record = get_owned_file(db, user_id, file_id)
    file_record.is_favorite = is_favorite
    db.commit()
    db.refresh(file_record)
    return file_record


def mark_opened(db: Session, user_id: str, file_id: str) -> None:
    file_record = get_owned_file(db, user_id, file_id)
    file_record.last_opened = datetime.now(timezone.utc)
    db.commit()


def recent_files(db: Session, user_id: str, limit: int = 10) -> list[File]:
    stmt = (
        select(File)
        .where(File.user_id == user_id, File.is_deleted == False)  # noqa: E712
        .order_by(func.coalesce(File.last_opened, File.uploaded_at).desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())


def favorite_files(db: Session, user_id: str, limit: int = 20) -> list[File]:
    stmt = (
        select(File)
        .where(File.user_id == user_id, File.is_deleted == False, File.is_favorite == True)  # noqa: E712
        .order_by(File.updated_at.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())


# ----------------------------------------------------------------------
# Trash
# ----------------------------------------------------------------------
def soft_delete_file(db: Session, user_id: str, file_id: str) -> None:
    file_record = get_owned_file(db, user_id, file_id)
    file_record.is_deleted = True
    file_record.deleted_at = datetime.now(timezone.utc)
    db.commit()


def list_trash(db: Session, user_id: str) -> list[File]:
    stmt = (
        select(File)
        .where(File.user_id == user_id, File.is_deleted == True)  # noqa: E712
        .order_by(File.deleted_at.desc())
    )
    return list(db.execute(stmt).scalars())


def restore_file(db: Session, user_id: str, file_id: str) -> File:
    file_record = get_owned_file(db, user_id, file_id, include_deleted=True)
    if not file_record.is_deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is not in trash")


    if file_record.folder_id is not None:
        from app.models.folder import Folder
        if db.get(Folder, file_record.folder_id) is None:
            file_record.folder_id = None

    file_record.is_deleted = False
    file_record.deleted_at = None
    db.commit()
    db.refresh(file_record)
    return file_record


def permanently_delete_file(db: Session, user_id: str, file_id: str) -> None:
    file_record = get_owned_file(db, user_id, file_id, include_deleted=True)
    storage_service.delete_file(user_id, file_record.stored_filename)
    db.delete(file_record)
    db.commit()


def empty_trash(db: Session, user_id: str) -> int:
    trashed = list_trash(db, user_id)
    for file_record in trashed:
        storage_service.delete_file(user_id, file_record.stored_filename)
        db.delete(file_record)
    db.commit()
    return len(trashed)


# ----------------------------------------------------------------------
# Usage accounting 
# ----------------------------------------------------------------------
def get_storage_usage(db: Session, user_id: str) -> tuple[int, int]:
    result = db.execute(
        select(func.coalesce(func.sum(File.file_size), 0), func.count(File.id)).where(
            File.user_id == user_id
        )
    ).one()
    used_bytes, file_count = result
    return int(used_bytes), int(file_count)


def count_active_files(db: Session, user_id: str) -> int:
    return db.execute(
        select(func.count(File.id)).where(File.user_id == user_id, File.is_deleted == False)  # noqa: E712
    ).scalar_one()
