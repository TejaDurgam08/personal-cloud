from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.file import StorageUsageOut
from app.services import file_service

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/usage", response_model=StorageUsageOut)
def usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    used_bytes, file_count = file_service.get_storage_usage(db, current_user.id)
    return StorageUsageOut(used_bytes=used_bytes, file_count=file_count)
