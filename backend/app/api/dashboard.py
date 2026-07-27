from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryOut
from app.services import file_service, folder_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    used_bytes, _ = file_service.get_storage_usage(db, current_user.id)
    total_files = file_service.count_active_files(db, current_user.id)
    total_folders = folder_service.count_user_folders(db, current_user.id)
    recent = file_service.recent_files(db, current_user.id, limit=8)
    favorites = file_service.favorite_files(db, current_user.id, limit=8)

    return DashboardSummaryOut(
        total_files=total_files,
        total_folders=total_folders,
        used_bytes=used_bytes,
        recent_files=[file_service.to_file_out(f) for f in recent],
        favorite_files=[file_service.to_file_out(f) for f in favorites],
    )
