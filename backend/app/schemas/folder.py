from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.file import FileOut


class FolderCreateIn(BaseModel):
    folder_name: str = Field(min_length=1, max_length=255)
    parent_id: str | None = None  # null = create at root


class FolderUpdateIn(BaseModel):

    folder_name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: str | None = Field(default=None)
    move_to_root: bool = False


class FolderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    folder_name: str
    parent_id: str | None
    created_at: datetime


class BreadcrumbItem(BaseModel):
    id: str | None  # None -> "Home" (root)
    folder_name: str


class FolderContentsOut(BaseModel):
    folder: FolderOut | None  
    breadcrumbs: list[BreadcrumbItem]
    subfolders: list[FolderOut]
    files: list[FileOut]
    total_files: int
