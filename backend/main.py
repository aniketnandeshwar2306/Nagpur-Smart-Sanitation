from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db
from routers import admin, citizen, worker
from routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize MongoDB collections and seed baseline operational data."""
    try:
        init_db()
        print("[STARTUP] MongoDB database collections initialized and baseline data seeded.")
    except Exception as e:
        print(f"[STARTUP WARNING] MongoDB initialization error: {e}")
    yield


app = FastAPI(
    title="Nagpur SmartSanitation API",
    description="Real-Time MongoDB Backend service for Nagpur SmartSanitation platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount module routers
app.include_router(auth_router)
app.include_router(admin.router)
app.include_router(citizen.router)
app.include_router(worker.router)

# Serve uploaded files
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Nagpur SmartSanitation API powered by MongoDB is running",
    }
