import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Use SQLite for local dev if no DATABASE_URL is set or PostgreSQL not available
_db_url = os.getenv("DATABASE_URL", "")

if not _db_url or _db_url.startswith("sqlite"):
    # Fallback to SQLite — no installation needed
    _sqlite_path = os.path.join(os.path.dirname(__file__), '..', 'ravan_ai.db')
    DATABASE_URL = f"sqlite:///{_sqlite_path}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    DATABASE_URL = _db_url
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
