from app.schemas.file import FileListOut 


class SearchResultOut(FileListOut):
    query: str
