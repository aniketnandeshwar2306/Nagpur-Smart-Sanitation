from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import admin, citizen, worker

app = FastAPI(
    title="Nagpur SmartSanitation API",
    description="Backend service for Nagpur SmartSanitation platform",
    version="1.0.0"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount module routers
app.include_router(admin.router)
app.include_router(citizen.router)
app.include_router(worker.router)

@app.get("/")
def root():
    return {"status": "success", "message": "Nagpur SmartSanitation API is running"}
