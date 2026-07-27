"""Business logic for virtual folders. Folders are metadata-only (no
filesystem directories are created) — see models/folder.py for why."""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder


def _get_owned_folder_or_none(db: Session, user_id: str, folder_id: str | None) -> Folder | None:
    if folder_id is None:
        return None
    folder = db.get(Folder, folder_id)
    if folder is None or folder.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    return folder


def get_owned_folder(db: Session, user_id: str, folder_id: str) -> Folder:
    folder = db.get(Folder, folder_id)
    if folder is None or folder.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    return folder


def _assert_no_name_collision(db: Session, user_id: str, parent_id: str | None, name: str, exclude_id: str | None = None):
    stmt = select(Folder).where(
        Folder.user_id == user_id,
        Folder.parent_id == parent_id,
        Folder.folder_name == name,
    )
    if exclude_id:
        stmt = stmt.where(Folder.id != exclude_id)
    if db.execute(stmt).scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A folder with that name already exists here",
        )


def create_folder(db: Session, user_id: str, folder_name: str, parent_id: str | None) -> Folder:
    parent = _get_owned_folder_or_none(db, user_id, parent_id)
    _assert_no_name_collision(db, user_id, parent.id if parent else None, folder_name)

    folder = Folder(user_id=user_id, folder_name=folder_name, parent_id=parent.id if parent else None)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def _is_descendant(db: Session, folder_id: str, potential_ancestor_id: str) -> bool:
    """True if potential_ancestor_id is folder_id itself or a descendant
    of it — used to block moving a folder into its own subtree."""
    current = db.get(Folder, folder_id)
    while current is not None:
        if current.id == potential_ancestor_id:
            return True
        current = db.get(Folder, current.parent_id) if current.parent_id else None
    return False


def update_folder(
    db: Session,
    user_id: str,
    folder_id: str,
    folder_name: str | None,
    parent_id: str | None,
    move_to_root: bool,
) -> Folder:
    folder = get_owned_folder(db, user_id, folder_id)

    new_parent_id = folder.parent_id
    if move_to_root:
        new_parent_id = None
    elif parent_id is not None:
        if parent_id == folder.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A folder cannot be moved into itself")
        if _is_descendant(db, parent_id, folder.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot move a folder into one of its own subfolders",
            )
        new_parent = _get_owned_folder_or_none(db, user_id, parent_id)
        new_parent_id = new_parent.id if new_parent else None

    new_name = folder_name if folder_name is not None else folder.folder_name

    if new_name != folder.folder_name or new_parent_id != folder.parent_id:
        _assert_no_name_collision(db, user_id, new_parent_id, new_name, exclude_id=folder.id)

    folder.folder_name = new_name
    folder.parent_id = new_parent_id
    db.commit()
    db.refresh(folder)
    return folder


def delete_folder(db: Session, user_id: str, folder_id: str) -> None:
    folder = get_owned_folder(db, user_id, folder_id)

    has_subfolders = db.execute(
        select(Folder.id).where(Folder.parent_id == folder.id)
    ).first() is not None
    has_files = db.execute(
        select(File.id).where(File.folder_id == folder.id, File.is_deleted == False)  # noqa: E712
    ).first() is not None

    if has_subfolders or has_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only empty folders can be deleted. Move or delete its contents first.",
        )

    db.delete(folder)
    db.commit()


def build_breadcrumbs(db: Session, folder: Folder | None) -> list[dict]:
    """Returns [{"id": None, "folder_name": "Home"}, ..., current folder],
    walking from the folder up to the root."""
    chain: list[Folder] = []
    current = folder
    while current is not None:
        chain.append(current)
        current = db.get(Folder, current.parent_id) if current.parent_id else None

    chain.reverse()
    breadcrumbs = [{"id": None, "folder_name": "Home"}]
    breadcrumbs.extend({"id": f.id, "folder_name": f.folder_name} for f in chain)
    return breadcrumbs


def list_subfolders(db: Session, user_id: str, parent_id: str | None) -> list[Folder]:
    return list(
        db.execute(
            select(Folder)
            .where(Folder.user_id == user_id, Folder.parent_id == parent_id)
            .order_by(Folder.folder_name.asc())
        ).scalars()
    )


def count_user_folders(db: Session, user_id: str) -> int:
    return len(list(db.execute(select(Folder.id).where(Folder.user_id == user_id)).scalars()))
