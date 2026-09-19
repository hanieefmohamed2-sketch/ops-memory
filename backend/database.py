import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# Determine database URL & dialect
DB_URL = settings.DATABASE_URL
IS_SQLITE = DB_URL.startswith("sqlite")

try:
    if not IS_SQLITE:
        engine = create_engine(DB_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            # Attempt to create pgvector extension if PostgreSQL
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                print("PostgreSQL connection established with pgvector extension.")
            except Exception as ext_err:
                print(f"Notice: Could not enable vector extension automatically: {ext_err}")
    else:
        engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
except Exception as e:
    print(f"Primary DB connection failed ({e}). Falling back to local SQLite database: sqlite:///./ops_memory.db")
    DB_URL = "sqlite:///./ops_memory.db"
    IS_SQLITE = True
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables in the database."""
    import models  # Ensure models are registered
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
