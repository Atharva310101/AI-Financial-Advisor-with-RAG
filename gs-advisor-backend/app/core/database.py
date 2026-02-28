import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.domain import Base
from dotenv import load_dotenv

load_dotenv()

# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://advisor_admin:securepassword@localhost:5432/advisor_rag_db")

# Create the database engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Ensure the pgvector extension is created before creating tables
    # We use text() here because SQLAlchemy 2.0+ requires it for raw SQL
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    
    # Create all tables defined in domain.py
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()