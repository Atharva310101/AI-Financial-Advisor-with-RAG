import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from app.models.domain import Company, Document, Chunk

# Initialize Local Embeddings (CPU-based, no API limits)
# This model produces 384-dimensional vectors
embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Mapping JSON keys to human-readable Section Names
ITEM_MAPPINGS = {
    "item_1": "Business",
    "item_1A": "Risk Factors",
    "item_7": "Management's Discussion and Analysis"
}

def ingest_10k_json(file_path: str, db: Session):
    """
    Parses an SEC 10-K JSON, creates/updates company records, 
    and generates local embeddings for text chunks.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cik = data.get("cik")
    if not cik:
        print(f"Skipping {file_path}: No CIK found.")
        return

    # Resolve company name using the 'company' key from your specific JSON format
    resolved_name = data.get("company") or data.get("name") or "Unknown Company"

    # 1. Create or Get Company
    company = db.query(Company).filter(Company.cik == cik).first()
    
    if not company:
        # Date parsing with safety fallbacks
        try:
            f_date = datetime.strptime(data.get("filing_date", "2023-01-01"), "%Y-%m-%d")
            p_date = datetime.strptime(data.get("period_of_report", "2022-12-31"), "%Y-%m-%d")
        except (ValueError, TypeError):
            f_date = datetime(2023, 1, 1)
            p_date = datetime(2022, 12, 31)

        company = Company(
            cik=cik,
            name=resolved_name,
            filename=data.get("filename"), # Saves the complex .htm name
            filing_date=f_date,
            filing_type=data.get("filing_type", "10-K"),
            period_of_report=p_date
        )
        db.add(company)
        db.commit()
        db.refresh(company)
    elif company.name == "Unknown Company" and resolved_name != "Unknown Company":
        # Repair logic for existing 'Unknown' entries
        company.name = resolved_name
        db.commit()
        db.refresh(company)

    # Configure Text Splitter (~2000 chars is roughly 500 tokens)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000, 
        chunk_overlap=200
    )

    # 2. Process Sections (Items) defined in ITEM_MAPPINGS
    for item_code, item_name in ITEM_MAPPINGS.items():
        raw_text = data.get(item_code)
        
        if raw_text and len(raw_text.strip()) > 0:
            # Create Document entry for the section
            doc = Document(
                company_id=company.id,
                item_code=item_code,
                item_name=item_name,
                raw_text=raw_text
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            # 3. Chunking the section text
            chunks = text_splitter.split_text(raw_text)
            
            # 4. Generate Local Embeddings in batch
            # This happens on your CPU/GPU and avoids Google API Quotas
            embeddings = embeddings_model.embed_documents(chunks)

            # 5. Prepare Chunk objects for Bulk Insertion
            db_chunks = []
            for i, chunk_text in enumerate(chunks):
                db_chunks.append(
                    Chunk(
                        document_id=doc.id,
                        chunk_index=i,
                        chunk_text=chunk_text,
                        embedding=embeddings[i], # List of 384 floats
                        token_count=len(chunk_text) // 4 
                    )
                )
            
            # Efficiently save all chunks for this document at once
            db.bulk_save_objects(db_chunks)
            db.commit()

    print(f"Successfully ingested {company.name} (CIK: {cik})")