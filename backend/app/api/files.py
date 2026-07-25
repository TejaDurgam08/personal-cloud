from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.file import FileListOut, FileOut
from app.services import file_service
from app.storage.storage_service import StorageService

router = APIRouter(prefix="/files", tags=["files"])
storage_service = StorageService()


@router.post("/upload", response_model=FileOut, status_code=201)
async def upload(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await file_service.upload_file(db, current_user.id, file)


@router.get("", response_model=FileListOut)
def list_my_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = file_service.list_files(db, current_user.id)
    return FileListOut(files=files, total_files=len(files))


@router.get("/{file_id}/download")
async def download(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = file_service.get_owned_file(db, current_user.id, file_id)

    return StreamingResponse(
        storage_service.stream_file(current_user.id, file_record.stored_filename),
        media_type=file_record.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{file_record.filename}"'},
    )


@router.delete("/{file_id}", status_code=204)
def delete(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_service.delete_file(db, current_user.id, file_id)
