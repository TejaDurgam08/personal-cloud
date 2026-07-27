"""
Central place mapping a file's mime type / extension to:
  - a coarse category used for filtering (images, documents, videos, ...)
  - whether it can be inline-previewed, and how
  - a display icon key for the frontend

Keeping this as pure lookups (no I/O) means it's cheap to call on every
row of a file listing, which matters on the Pi.
"""
import os
from enum import StrEnum


class FileCategory(StrEnum):
    IMAGE = "image"
    DOCUMENT = "document"
    VIDEO = "video"
    AUDIO = "audio"
    ARCHIVE = "archive"
    OTHER = "other"


class PreviewKind(StrEnum):
    IMAGE = "image"
    PDF = "pdf"
    TEXT = "text"
    AUDIO = "audio"
    VIDEO = "video"
    NONE = "none"


_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"}
_DOCUMENT_EXT = {".pdf", ".doc", ".docx", ".txt", ".md", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".odt"}
_VIDEO_EXT = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
_AUDIO_EXT = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
_ARCHIVE_EXT = {".zip", ".tar", ".gz", ".rar", ".7z", ".bz2"}

# Text/code files with syntax-highlighted preview support.
_PREVIEWABLE_TEXT_EXT = {".txt", ".json", ".md", ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".yml", ".yaml"}
_PREVIEWABLE_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
_PREVIEWABLE_AUDIO_EXT = {".mp3", ".wav", ".ogg"}
_PREVIEWABLE_VIDEO_EXT = {".mp4", ".webm"}

# Icon keys the frontend maps to a Material icon component.
_ICON_BY_CATEGORY = {
    FileCategory.IMAGE: "image",
    FileCategory.DOCUMENT: "description",
    FileCategory.VIDEO: "movie",
    FileCategory.AUDIO: "audiotrack",
    FileCategory.ARCHIVE: "archive",
    FileCategory.OTHER: "insert_drive_file",
}


def get_extension(filename: str) -> str:
    return os.path.splitext(filename or "")[1].lower()


def categorize(filename: str) -> FileCategory:
    ext = get_extension(filename)
    if ext in _IMAGE_EXT:
        return FileCategory.IMAGE
    if ext in _DOCUMENT_EXT:
        return FileCategory.DOCUMENT
    if ext in _VIDEO_EXT:
        return FileCategory.VIDEO
    if ext in _AUDIO_EXT:
        return FileCategory.AUDIO
    if ext in _ARCHIVE_EXT:
        return FileCategory.ARCHIVE
    return FileCategory.OTHER


def icon_for(filename: str) -> str:
    return _ICON_BY_CATEGORY[categorize(filename)]


def preview_kind(filename: str) -> PreviewKind:
    ext = get_extension(filename)
    if ext in _PREVIEWABLE_IMAGE_EXT:
        return PreviewKind.IMAGE
    if ext == ".pdf":
        return PreviewKind.PDF
    if ext in _PREVIEWABLE_TEXT_EXT:
        return PreviewKind.TEXT
    if ext in _PREVIEWABLE_AUDIO_EXT:
        return PreviewKind.AUDIO
    if ext in _PREVIEWABLE_VIDEO_EXT:
        return PreviewKind.VIDEO
    return PreviewKind.NONE


# Max bytes read into memory for a text preview — keeps memory bounded on
# the Pi even if someone renames a huge file to file.txt.
MAX_TEXT_PREVIEW_BYTES = 512 * 1024
