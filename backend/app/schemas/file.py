from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    file_size: int
    mime_type: str
    uploaded_at: datetime


class FileListOut(BaseModel):
    files: list[FileOut]
    total_files: int


class StorageUsageOut(BaseModel):
    used_bytes: int
    file_count: int
