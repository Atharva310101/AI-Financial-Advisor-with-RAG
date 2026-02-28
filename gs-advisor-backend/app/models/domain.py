from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, ARRAY
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="advisor") # advisor, admin
    password_hash = Column(String)

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    cik = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    filename = Column(String, nullable=True)
    filing_date = Column(DateTime)
    filing_type = Column(String) # e.g., "10-K"
    period_of_report = Column(DateTime)
    
    documents = relationship("Document", back_populates="company", cascade="all, delete")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    item_code = Column(String) # e.g., "item_1A"
    item_name = Column(String) # e.g., "Risk Factors"
    raw_text = Column(Text)
    
    company = relationship("Company", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete")

class Chunk(Base):
    __tablename__ = "chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_index = Column(Integer)
    chunk_text = Column(Text)
    
    # Change this line from Vector(3072) to Vector(384)
    embedding = Column(Vector(384)) 
    
    token_count = Column(Integer)
    document = relationship("Document", back_populates="chunks")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    query_text = Column(Text)
    retrieved_chunk_ids = Column(ARRAY(Integer))
    llm_mode = Column(String) # chat, summary, risk_note, email
    llm_response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)