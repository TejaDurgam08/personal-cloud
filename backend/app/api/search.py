from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.search import SearchResultOut
from app.services import file_service

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResultOut)
def search_files(
    q: str = Query("", description="Matched case-insensitively against the filename"),
    extension: str | None = Query(None, description="e.g. .png or png"),
    mime_type: str | None = Query(None, description="Exact mime type match, e.g. image/png"),
    category: str | None = Query(None, description="image|document|video|audio|archive|other"),
    sort: str = Query("name", pattern="^(name|uploaded_at|updated_at|size|type)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files, total = file_service.query_files(
        db,
        current_user.id,
        folder_id="__unset__",  # search across all folders, not just one
        search_query=q or None,
        extension=extension,
        category=category,
        sort_by=sort,
        order=order,
    )

    if mime_type:
        files = [f for f in files if f.mime_type == mime_type]
        total = len(files)

    return SearchResultOut(
        files=[file_service.to_file_out(f) for f in files], total_files=total, query=q
    )
