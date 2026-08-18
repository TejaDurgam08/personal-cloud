from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    folder_id: str | None
    file_size: int
    mime_type: str
    category: str  
    icon: str
    is_favorite: bool
    uploaded_at: datetime
    updated_at: datetime
    last_opened: datetime | None


class FileListOut(BaseModel):
    files: list[FileOut]
    total_files: int


class TrashFileOut(FileOut):
    deleted_at: datetime | None


class TrashListOut(BaseModel):
    files: list[TrashFileOut]
    total_files: int


class StorageUsageOut(BaseModel):
    used_bytes: int
    file_count: int


class FileRenameIn(BaseModel):
    filename: str = Field(min_length=1, max_length=255)


class FileMoveIn(BaseModel):
    folder_id: str | None = None  # null = move to root


class FavoriteIn(BaseModel):
    is_favorite: bool
