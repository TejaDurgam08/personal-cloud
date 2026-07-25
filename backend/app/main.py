"""
Personal Cloud – FastAPI application entrypoint.

Route composition only. Business logic lives in app/services/*,
filesystem access lives in app/storage/storage_service.py.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, files, storage
from app.core.config import get_settings
from app.database.init_db import init_db

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(files.router)
app.include_router(storage.router)
