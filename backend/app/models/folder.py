import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Folder(Base):
    """A purely virtual grouping of files/folders. Folders have no
    corresponding directory on disk — files always live flat inside
    storage/<user_id>/uploads/, and folder_id on File is just metadata.
    This keeps folder create/rename/move O(1) (no disk I/O) and avoids
    filesystem path-length/permission issues on the Pi."""

    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    parent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("folders.id"), nullable=True, index=True
    )
    folder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner: Mapped["User"] = relationship("User", back_populates="folders")  # noqa: F821
    parent: Mapped["Folder | None"] = relationship("Folder", remote_side=[id], back_populates="children")
    children: Mapped[list["Folder"]] = relationship("Folder", back_populates="parent")
    files: Mapped[list["File"]] = relationship("File", back_populates="folder")  # noqa: F821
