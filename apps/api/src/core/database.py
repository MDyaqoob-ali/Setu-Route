from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from src.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True
)

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")
            cursor.execute("PRAGMA mmap_size=268435456")
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.execute("PRAGMA busy_timeout=5000")
        except Exception:
            pass
        finally:
            cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def _migrate_columns_sync(connection):
    from sqlalchemy import text
    try:
        res = connection.execute(text("PRAGMA table_info(incidents)"))
        existing_cols = {row[1] for row in res.fetchall()}
        new_cols = [
            ("source_name", "VARCHAR(100) DEFAULT 'Official PWD'"),
            ("source_url", "VARCHAR(500)"),
            ("source_trust_level", "VARCHAR(50) DEFAULT 'OFFICIAL'"),
            ("source_event_id", "VARCHAR(150)"),
            ("raw_source_reference", "JSON DEFAULT '{}'"),
            ("confidence_score", "FLOAT DEFAULT 0.9"),
            ("affected_road_code", "VARCHAR(50)"),
            ("impact_geometry_type", "VARCHAR(30) DEFAULT 'POINT'"),
            ("impact_geometry_geojson", "JSON"),
            ("expires_at", "DATETIME"),
            ("alternative_available", "BOOLEAN DEFAULT 1"),
            ("is_live_external", "BOOLEAN DEFAULT 0"),
        ]
        for col_name, col_type in new_cols:
            if col_name not in existing_cols:
                try:
                    connection.execute(text(f"ALTER TABLE incidents ADD COLUMN {col_name} {col_type}"))
                except Exception:
                    pass
    except Exception:
        pass

async def init_db():
    import src.models  # noqa: F401 - Register models with metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_columns_sync)


