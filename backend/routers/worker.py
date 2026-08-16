from fastapi import APIRouter

router = APIRouter(
    prefix="/api/worker",
    tags=["worker"]
)

@router.get("/")
def get_worker_status():
    return {"status": "success", "message": "Worker module endpoint operational"}
