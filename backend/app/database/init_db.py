"""Creates database tables on startup. Simple approach suitable for phase 1;
a migration tool (e.g. Alembic) can be introduced in a later phase."""
from app.database.session import Base, engine
# Import models so they are registered on Base.metadata before create_all.
from app.models import user, file  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
