from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_allow_query_token
from app.database.session import get_db
from app.models.user import User
from app.services import file_service
from app.storage.storage_service import StorageService
from app.utils.file_types import MAX_TEXT_PREVIEW_BYTES, PreviewKind, preview_kind

router = APIRouter(tags=["preview"])
storage_service = StorageService()


@router.get("/preview/{file_id}")
async def preview_file(
    file_id: str,
    current_user: User = Depends(get_current_user_allow_query_token),
    db: Session = Depends(get_db),
):
    file_record = file_service.get_owned_file(db, current_user.id, file_id)
    kind = preview_kind(file_record.filename)

    if kind == PreviewKind.NONE:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Preview is not available for this file type. Download it instead.",
        )

    file_service.mark_opened(db, current_user.id, file_id)

    if kind == PreviewKind.TEXT:
        text = await storage_service.read_text_preview(
            current_user.id, file_record.stored_filename, MAX_TEXT_PREVIEW_BYTES
        )
        return PlainTextResponse(content=text, media_type="text/plain")

    # image / pdf / audio / video: stream the original bytes inline so the
    # browser can render them natively (<img>, <embed>, <audio>, <video>).
    return StreamingResponse(
        storage_service.stream_file(current_user.id, file_record.stored_filename),
        media_type=file_record.mime_type,
        headers={"Content-Disposition": f'inline; filename="{file_record.filename}"'},
    )
