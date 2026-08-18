"""Filename safety helpers: avoid path traversal and filesystem-unsafe names."""
import os
import re
import uuid

_SAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]")


def sanitize_display_name(filename: str) -> str:
    """Strip any directory components and dangerous characters from a
    user-supplied filename, keeping it readable for display purposes only."""
    name = os.path.basename(filename or "file")
    name = _SAFE_CHARS.sub("_", name)
    name = name.strip("._") or "file"
    return name[:255]


def generate_stored_filename(original_filename: str) -> str:
    """Generate a random, collision-free filename for storage on disk."""
    _, ext = os.path.splitext(original_filename or "")
    ext = _SAFE_CHARS.sub("", ext)[:10]  # safe extension only
    return f"{uuid.uuid4().hex}{ext.lower()}"


def is_within_directory(base_dir: str, target_path: str) -> bool:
    """confirm target_path resolves to inside base_dir."""
    base_dir = os.path.realpath(base_dir)
    target_path = os.path.realpath(target_path)
    return os.path.commonpath([base_dir]) == os.path.commonpath([base_dir, target_path])
