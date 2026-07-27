from pydantic import BaseModel

from app.schemas.file import FileOut


class DashboardSummaryOut(BaseModel):
    total_files: int
    total_folders: int
    used_bytes: int
    recent_files: list[FileOut]
    favorite_files: list[FileOut]
