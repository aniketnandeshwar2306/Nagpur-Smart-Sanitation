from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
import time

from database import init_db
from routers import admin, citizen, worker
from routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize MongoDB collections and seed baseline operational data."""
    try:
        init_db()
        print("[STARTUP] MongoDB database collections initialized and baseline data seeded.", flush=True)
    except Exception as e:
        print(f"[STARTUP WARNING] MongoDB initialization error: {e}", flush=True)
    yield


app = FastAPI(
    title="Nagpur SmartSanitation API",
    description="Real-Time MongoDB Backend service for Nagpur SmartSanitation platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: Allow all origins (Vercel, Localhost, Preview domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Real-time Request Logging Middleware (Flushes immediately to Render log stream)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    method = request.method
    path = request.url.path
    client_host = request.client.host if request.client else "unknown"

    print(f"[RENDER-LOG] >>> INCOMING: {method} {path} from {client_host}", flush=True)

    try:
        response = await call_next(request)
        process_time_ms = (time.time() - start_time) * 1000
        print(
            f"[RENDER-LOG] <<< COMPLETED: {method} {path} | Status: {response.status_code} | Duration: {process_time_ms:.1f}ms",
            flush=True
        )
        return response
    except Exception as exc:
        process_time_ms = (time.time() - start_time) * 1000
        print(
            f"[RENDER-LOG] !!! FAILED: {method} {path} | Exception: {exc} | Duration: {process_time_ms:.1f}ms",
            flush=True
        )
        raise exc


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
        "endpoints": ["/api/citizen/reports", "/api/worker/tasks", "/api/admin/overview", "/api/auth/login", "/docs"]
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "nagpur-smart-sanitation-backend"}
