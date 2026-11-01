from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# SQLite for local development. We can easily swap to PostgreSQL later.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./transfactor.db")

# check_same_thread is needed for SQLite
engine_kwargs = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
