"""SQLAlchemy database engine and session management (Neon Lakebase Postgres ready)."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings


def _normalize_postgres_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


pooled_url = _normalize_postgres_url(settings.DATABASE_URL)
direct_url = _normalize_postgres_url(settings.DATABASE_URL_UNPOOLED or settings.DATABASE_URL)

connect_args = {}
engine_kwargs = {"pool_pre_ping": True}

if pooled_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Neon pooled Postgres best practices: recycle connections before scale-to-zero / PgBouncer idle timeout
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 300

# Application runtime engine (uses Neon pooled -pooler connection string)
engine = create_engine(
    pooled_url,
    connect_args=connect_args,
    **engine_kwargs,
)

# Direct engine for schema migrations / DDL (uses Neon DATABASE_URL_UNPOOLED)
migration_connect_args = {"check_same_thread": False} if direct_url.startswith("sqlite") else {}
migration_engine = create_engine(
    direct_url,
    connect_args=migration_connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency yielding a scoped SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
