import os
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Response
from app.core.database import engine, init_db
from app.api import routes
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


app = FastAPI(title="GS Advisor RAG API")
# Get the path of the current file (app/main.py)
current_file = Path(__file__).resolve()

# 1. 'app' folder
# 2. 'gs-advisor-backend' folder
# 3. 'financial-advisor' folder (The Root)
root_dir = current_file.parent.parent.parent

# Now point to the raw folder from the root
raw_path = os.path.join(root_dir, "10K-data", "raw")

print(f"DEBUG: Looking for HTM files at: {raw_path}")

if not os.path.exists(raw_path):
    # We use a print instead of an error so the app still starts 
    # even if you are working on a machine without the data folder
    print(f"CRITICAL WARNING: Static directory not found at {raw_path}")
else:
    app.mount("/static-filings", StaticFiles(directory=raw_path), name="static-filings")
    print("Successfully mounted /static-filings")


class SilenceSECAssetsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Check if the request is for an image inside our static folder
        path = request.url.path
        if path.startswith("/static-filings/") or path == "/favicon.ico":
            # List of extensions that SEC HTMs often try to load
            if any(path.endswith(ext) for ext in [".jpg", ".png", ".gif", ".ico", ".css"]):
                # Check if the file actually exists on disk
                # root_dir and raw_path should be defined as we did previously
                full_path = os.path.join(raw_path, path.replace("/static-filings/", ""))
                
                if not os.path.exists(full_path):
                    # Return a "Silent" 204 No Content instead of a 404 Error
                    return Response(status_code=204)
        
        return await call_next(request)
# Add the middleware to your app
app.add_middleware(SilenceSECAssetsMiddleware)

# Keep your existing mount below this
app.mount("/static-filings", StaticFiles(directory=raw_path), name="static-filings")
# --- Add CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static-filings", StaticFiles(directory=raw_path), name="static-filings")
# Initialize DB on startup
@app.on_event("startup")
def on_startup():
    init_db()
    print("Database tables created successfully!")
# Include the API router with a prefix
app.include_router(routes.router, prefix="/api/v1") # <--- Add this line
@app.get("/")
def health_check():
    return {"status": "ok", "message": "GS Advisor API is running"}