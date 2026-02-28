import os
import json
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.services.ingestion import ingest_10k_json

# Dynamically find the 10K-data/extracted folder
# Path: financial-advisor/gs-advisor-backend/batch_ingest.py -> parent is backend -> parent is root
root_dir = Path(__file__).resolve().parent.parent
EXTRACTED_DIR = os.path.join(root_dir, "10K-data", "extracted")

def run_batch_ingestion():
    # Trigger table creation (this creates the 'filename' column now)
    print("Initializing database schema...")
    init_db()
    
    if not os.path.exists(EXTRACTED_DIR):
        print(f"Error: Could not find directory at {EXTRACTED_DIR}")
        return

    files = [f for f in os.listdir(EXTRACTED_DIR) if f.endswith('.json')]
    total = len(files)
    
    print(f"Found {total} JSON files. Starting ingestion...")
    
    db = SessionLocal()
    success_count = 0
    
    for i, filename in enumerate(files, 1):
        filepath = os.path.join(EXTRACTED_DIR, filename)
        try:
            # Reusing your updated ingestion logic that saves 'filename'
            ingest_10k_json(filepath, db)
            success_count += 1
            if i % 10 == 0:
                print(f"Progress: {i}/{total} files processed...")
        except Exception as e:
            print(f"  -> ERROR on {filename}: {str(e)}")
            db.rollback()
            
    print(f"\nCOMPLETED. Successfully ingested {success_count} companies.")
    db.close()

if __name__ == "__main__":
    run_batch_ingestion()