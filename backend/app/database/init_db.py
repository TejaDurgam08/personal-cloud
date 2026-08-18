
from sqlalchemy import inspect, text

from app.database.session import Base, engine

from app.models import user, file, folder  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
