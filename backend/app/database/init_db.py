"""
Creates database tables on startup, and applies small additive schema
migrations for columns introduced in Phase 2. This project doesn't use
Alembic yet (deliberately, to stay simple for phase 1/2) — this function
is a stopgap that only ever ADDS columns, never destructive, so it's
safe to run on every startup.
"""
from sqlalchemy import inspect, text

from app.database.session import Base, engine
# Import models so they are registered on Base.metadata before create_all.
from app.models import user, file, folder  # noqa: F401

# Columns introduced after the initial Phase 1 release of the `files` table.
_NEW_FILE_COLUMNS = {
    "folder_id": "VARCHAR(36)",
    "updated_at": "DATETIME",
    "last_opened": "DATETIME",
    "is_favorite": "BOOLEAN DEFAULT 0 NOT NULL",
    "is_deleted": "BOOLEAN DEFAULT 0 NOT NULL",
    "deleted_at": "DATETIME",
}


def _migrate_files_table() -> None:
    inspector = inspect(engine)
    if "files" not in inspector.get_table_names():
        return  # fresh database — create_all() will create it with the full schema

    existing_columns = {col["name"] for col in inspector.get_columns("files")}
    with engine.begin() as conn:
        for column_name, column_def in _NEW_FILE_COLUMNS.items():
            if column_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE files ADD COLUMN {column_name} {column_def}"))
        # Backfill updated_at for pre-existing rows so sorting by
        # "last modified" behaves sensibly for old data.
        if "updated_at" not in existing_columns:
            conn.execute(text("UPDATE files SET updated_at = uploaded_at WHERE updated_at IS NULL"))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_files_table()
