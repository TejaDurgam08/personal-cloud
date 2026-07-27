import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class File(Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    folder_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("folders.id"), nullable=True, index=True
    )  # NULL = root of "My Drive"

    filename: Mapped[str] = mapped_column(String(255), nullable=False, index=True)  # display name
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)  # random name on disk
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)  # relative path, never absolute

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_opened: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship("User", back_populates="files")  # noqa: F821
    folder: Mapped["Folder | None"] = relationship("Folder", back_populates="files")  # noqa: F821
