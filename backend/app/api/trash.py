from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.file import FileOut, TrashFileOut, TrashListOut
from app.services import file_service

router = APIRouter(prefix="/trash", tags=["trash"])


def _to_trash_out(file) -> TrashFileOut:
    base = file_service.to_file_out(file)
    return TrashFileOut(**base.model_dump(), deleted_at=file.deleted_at)


@router.get("", response_model=TrashListOut)
def list_trash(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = file_service.list_trash(db, current_user.id)
    return TrashListOut(files=[_to_trash_out(f) for f in files], total_files=len(files))


@router.post("/{file_id}/restore", response_model=FileOut)
def restore(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = file_service.restore_file(db, current_user.id, file_id)
    return file_service.to_file_out(record)


@router.delete("/empty", status_code=200)
def empty_trash(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = file_service.empty_trash(db, current_user.id)
    return {"deleted_count": count}


@router.delete("/{file_id}", status_code=204)
def permanently_delete(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_service.permanently_delete_file(db, current_user.id, file_id)
