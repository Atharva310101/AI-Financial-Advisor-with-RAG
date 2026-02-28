import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ingestion import ingest_10k_json
from app.services.rag import query_rag, generate_specialized_content
from app.models.domain import Company
from app.schemas.pydantic_models import QueryRequest, QueryResponse, CompanyResponse, GenerationRequest, GenerationResponse
from typing import List
from app.models.domain import AuditLog
from app.schemas.pydantic_models import AuditLogResponse
router = APIRouter()

# --- 1. Utility: List Companies ---
@router.get("/companies", response_model=List[CompanyResponse])
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()

# --- 2. Ingestion: Upload 10-K JSON ---
@router.post("/ingest")
async def ingest_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    file_location = f"data/{file.filename}"
    
    # Save uploaded file to disk
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Trigger the ingestion logic
        ingest_10k_json(file_location, db)
        return {"message": f"Successfully ingested {file.filename}", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. RAG: Chat with Company ---
@router.post("/chat", response_model=QueryResponse)
def chat_with_company(request: QueryRequest, db: Session = Depends(get_db)):
    try:
        result = query_rag(db, request.query, request.company_id)
        return QueryResponse(answer=result["answer"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- 4. Specialized Generation: Summaries, Risks, Emails ---

@router.post("/generate/summary", response_model=GenerationResponse)
def api_generate_summary(request: GenerationRequest, db: Session = Depends(get_db)):
    try:
        result = generate_specialized_content(db, request.company_id, "summary")
        return GenerationResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/risk", response_model=GenerationResponse)
def api_generate_risk(request: GenerationRequest, db: Session = Depends(get_db)):
    try:
        result = generate_specialized_content(db, request.company_id, "risk_note")
        return GenerationResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/email", response_model=GenerationResponse)
def api_generate_email(request: GenerationRequest, db: Session = Depends(get_db)):
    try:
        result = generate_specialized_content(db, request.company_id, "email")
        return GenerationResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# --- 5. Audit & Compliance ---
@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    try:
        # Fetch all logs, newest first
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))