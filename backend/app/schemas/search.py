from app.schemas.file import FileListOut  # re-exported for convenience


class SearchResultOut(FileListOut):
    query: str
