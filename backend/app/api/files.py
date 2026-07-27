from fastapi import APIRouter, Depends, Query, UploadFile, File as FastAPIFile, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.file import FavoriteIn, FileListOut, FileMoveIn, FileOut, FileRenameIn
from app.services import file_service
from app.storage.storage_service import StorageService

router = APIRouter(prefix="/files", tags=["files"])
storage_service = StorageService()


@router.post("/upload", response_model=FileOut, status_code=201)
async def upload(
    file: UploadFile = FastAPIFile(...),
    folder_id: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = await file_service.upload_file(db, current_user.id, file, folder_id=folder_id)
    return file_service.to_file_out(record)


@router.get("", response_model=FileListOut)
def list_my_files(
    folder_id: str | None = Query(default=None, description="Omit or null for root of My Drive"),
    sort: str = Query("name", pattern="^(name|uploaded_at|updated_at|size|type)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    filter: str | None = Query(None, description="image|document|video|audio|archive|other"),
    favorite: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files, total = file_service.query_files(
        db,
        current_user.id,
        folder_id=folder_id,
        category=filter,
        sort_by=sort,
        order=order,
        favorite_only=favorite,
    )
    return FileListOut(files=[file_service.to_file_out(f) for f in files], total_files=total)


@router.get("/recent", response_model=FileListOut)
def get_recent_files(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = file_service.recent_files(db, current_user.id, limit=limit)
    return FileListOut(files=[file_service.to_file_out(f) for f in files], total_files=len(files))


@router.get("/{file_id}/download")
async def download(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = file_service.get_owned_file(db, current_user.id, file_id)
    file_service.mark_opened(db, current_user.id, file_id)

    return StreamingResponse(
        storage_service.stream_file(current_user.id, file_record.stored_filename),
        media_type=file_record.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file_record.filename}"'},
    )


@router.patch("/{file_id}/rename", response_model=FileOut)
def rename(
    file_id: str,
    data: FileRenameIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = file_service.rename_file(db, current_user.id, file_id, data.filename)
    return file_service.to_file_out(record)


@router.patch("/{file_id}/move", response_model=FileOut)
def move(
    file_id: str,
    data: FileMoveIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = file_service.move_file(db, current_user.id, file_id, data.folder_id)
    return file_service.to_file_out(record)


@router.post("/{file_id}/copy", response_model=FileOut, status_code=201)
async def copy(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = await file_service.copy_file(db, current_user.id, file_id)
    return file_service.to_file_out(record)


@router.patch("/{file_id}/favorite", response_model=FileOut)
def favorite(
    file_id: str,
    data: FavoriteIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = file_service.set_favorite(db, current_user.id, file_id, data.is_favorite)
    return file_service.to_file_out(record)


@router.delete("/{file_id}", status_code=204)
def delete(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete: moves the file to Trash. It stays on disk (and still
    counts toward storage usage) until permanently deleted from Trash."""
    file_service.soft_delete_file(db, current_user.id, file_id)
