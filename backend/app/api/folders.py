from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.file import FileListOut
from app.schemas.folder import FolderContentsOut, FolderCreateIn, FolderOut, FolderUpdateIn
from app.services import file_service, folder_service

router = APIRouter(prefix="/folders", tags=["folders"])

ROOT = "root"  # sentinel path segment representing "My Drive" (folder_id = NULL)


@router.post("", response_model=FolderOut, status_code=201)
def create_folder(
    data: FolderCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.create_folder(db, current_user.id, data.folder_name, data.parent_id)


@router.get("/{folder_id}", response_model=FolderContentsOut)
def get_folder_contents(
    folder_id: str,
    sort: str = Query("name", pattern="^(name|uploaded_at|updated_at|size|type)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    filter: str | None = Query(None, description="images|documents|videos|audio|archives|other"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """folder_id == "root" lists the top level of My Drive."""
    folder = None
    target_id: str | None = None
    if folder_id != ROOT:
        folder = folder_service.get_owned_folder(db, current_user.id, folder_id)
        target_id = folder.id

    subfolders = folder_service.list_subfolders(db, current_user.id, target_id)
    files, total = file_service.query_files(
        db, current_user.id, folder_id=target_id, category=filter, sort_by=sort, order=order
    )
    breadcrumbs = folder_service.build_breadcrumbs(db, folder)

    return FolderContentsOut(
        folder=folder,
        breadcrumbs=breadcrumbs,
        subfolders=subfolders,
        files=[file_service.to_file_out(f) for f in files],
        total_files=total,
    )


@router.patch("/{folder_id}", response_model=FolderOut)
def update_folder(
    folder_id: str,
    data: FolderUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return folder_service.update_folder(
        db, current_user.id, folder_id, data.folder_name, data.parent_id, data.move_to_root
    )


@router.delete("/{folder_id}", status_code=204)
def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder_service.delete_folder(db, current_user.id, folder_id)
