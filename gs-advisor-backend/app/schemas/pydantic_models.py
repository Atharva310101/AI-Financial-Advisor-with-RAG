from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
# --- Chat/RAG Schemas ---
class QueryRequest(BaseModel):
    company_id: int
    query: str

class SourceDocument(BaseModel):
    source: str  # e.g. "Risk Factors"

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]

# --- Company Schemas ---
class CompanyResponse(BaseModel):
    id: int
    name: str
    cik: str
    filename: Optional[str] = None # Allows the HTM filename to pass through
    filing_date: datetime
    filing_type: str # Allows the '10-K' label to show in the sidebar

    class Config:
        from_attributes = True

# --- Generation Schemas (Summary, Risk, Email) ---
class GenerationRequest(BaseModel):
    company_id: int

class GenerationResponse(BaseModel):
    content: str
    sources: List[str]

# --- Audit Log Schema ---
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    company_id: int
    query_text: str
    llm_mode: str
    llm_response: str
    timestamp: datetime

    class Config:
        from_attributes = True