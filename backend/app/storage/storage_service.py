"""
StorageService
==============

The ONLY component in the application allowed to touch the filesystem.
API routes and other services must go through this class rather than
calling open()/os.remove()/etc. directly. This keeps file-handling logic
(safety checks, streaming, path construction) in one place, and makes it
possible to later swap the backing store (e.g. for an external USB drive
or, in a future phase, a network location) without touching API code.
"""
import os
import shutil
from collections.abc import AsyncIterator

import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings
from app.utils.filenames import generate_stored_filename, is_within_directory

settings = get_settings()

CHUNK_SIZE = 1024 * 1024  # 1 MB chunks keep memory usage low on the Pi Zero 2 W


class StorageError(Exception):
    """Raised for any storage-layer failure (disk full, path issue, etc.)."""


class StorageService:
    def __init__(self, storage_root: str | None = None):
        self.storage_root = os.path.abspath(storage_root or settings.storage_root)

    # ------------------------------------------------------------------
    # Path helpers
    # ------------------------------------------------------------------
    def _user_dir(self, user_id: str) -> str:
        return os.path.join(self.storage_root, user_id, "uploads")

    def ensure_user_dir(self, user_id: str) -> str:
        path = self._user_dir(user_id)
        os.makedirs(path, exist_ok=True)
        return path

    def resolve_path(self, user_id: str, stored_filename: str) -> str:
        """Build an absolute path for a stored file, guarding against
        path traversal via the stored filename."""
        user_dir = self._user_dir(user_id)
        full_path = os.path.join(user_dir, stored_filename)
        if not is_within_directory(user_dir, full_path):
            raise StorageError("Resolved path escapes the user's storage directory")
        return full_path

    # ------------------------------------------------------------------
    # Write / delete
    # ------------------------------------------------------------------
    async def save_file(self, user_id: str, upload_file: UploadFile, max_bytes: int) -> tuple[str, str, int]:
        """Stream the upload to disk in chunks (never loads the whole file
        into memory). Returns (stored_filename, relative_path, size_bytes).
        Enforces max_bytes and cleans up partial files on failure."""
        self.ensure_user_dir(user_id)
        stored_filename = generate_stored_filename(upload_file.filename or "")
        dest_path = self.resolve_path(user_id, stored_filename)

        size = 0
        try:
            async with aiofiles.open(dest_path, "wb") as out_file:
                while chunk := await upload_file.read(CHUNK_SIZE):
                    size += len(chunk)
                    if size > max_bytes:
                        raise StorageError("File exceeds the maximum allowed upload size")
                    await out_file.write(chunk)
        except Exception:
            # Clean up any partially written file before re-raising.
            if os.path.exists(dest_path):
                os.remove(dest_path)
            raise

        relative_path = os.path.join(user_id, "uploads", stored_filename)
        return stored_filename, relative_path, size

    def copy_file(self, user_id: str, source_stored_filename: str, original_filename: str) -> tuple[str, str, int]:
        """Duplicate a file's bytes on disk under a new random name.
        Returns (stored_filename, relative_path, size_bytes)."""
        source_path = self.resolve_path(user_id, source_stored_filename)
        new_stored_filename = generate_stored_filename(original_filename)
        dest_path = self.resolve_path(user_id, new_stored_filename)

        if not os.path.exists(source_path):
            raise StorageError("Source file no longer exists on disk")

        shutil.copyfile(source_path, dest_path)
        size = os.path.getsize(dest_path)
        relative_path = os.path.join(user_id, "uploads", new_stored_filename)
        return new_stored_filename, relative_path, size

    def delete_file(self, user_id: str, stored_filename: str) -> None:
        path = self.resolve_path(user_id, stored_filename)
        if os.path.exists(path):
            os.remove(path)

    def delete_user_directory(self, user_id: str) -> None:
        """Not exposed via API in phase 1, but useful for account cleanup later."""
        user_root = os.path.join(self.storage_root, user_id)
        if os.path.exists(user_root):
            shutil.rmtree(user_root)

    # ------------------------------------------------------------------
    # Read (streaming download)
    # ------------------------------------------------------------------
    async def stream_file(self, user_id: str, stored_filename: str) -> AsyncIterator[bytes]:
        path = self.resolve_path(user_id, stored_filename)
        async with aiofiles.open(path, "rb") as f:
            while chunk := await f.read(CHUNK_SIZE):
                yield chunk

    async def read_text_preview(self, user_id: str, stored_filename: str, max_bytes: int) -> str:
        """Read up to max_bytes of a file and decode as UTF-8 (best-effort)
        for a syntax-highlighted text preview. Bounded read keeps memory
        usage predictable on the Pi even for large files."""
        path = self.resolve_path(user_id, stored_filename)
        async with aiofiles.open(path, "rb") as f:
            raw = await f.read(max_bytes)
        return raw.decode("utf-8", errors="replace")

    # ------------------------------------------------------------------
    # Usage accounting
    # ------------------------------------------------------------------
    def get_directory_size(self, user_id: str) -> int:
        """Sum of file sizes on disk for a user. Used as a sanity check /
        fallback; the primary source of truth for usage is the database
        (sum of File.file_size), which is far cheaper to query."""
        user_dir = self._user_dir(user_id)
        if not os.path.exists(user_dir):
            return 0
        total = 0
        for entry in os.scandir(user_dir):
            if entry.is_file():
                total += entry.stat().st_size
        return total
