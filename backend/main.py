import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from routers import admin, citizen, worker
except ImportError:
    from backend.routers import admin, citizen, worker

app = FastAPI(
    title="Nagpur SmartSanitation API",
    description="Backend service for Nagpur SmartSanitation platform",
    version="1.0.0"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist and mount static files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "audits"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Mount module routers
app.include_router(admin.router)
app.include_router(citizen.router)
app.include_router(worker.router)

@app.get("/")
def root():
    return {"status": "success", "message": "Nagpur SmartSanitation API is running"}
