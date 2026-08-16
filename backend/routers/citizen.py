from fastapi import APIRouter

router = APIRouter(
    prefix="/api/citizen",
    tags=["citizen"]
)

@router.get("/")
def get_citizen_status():
    return {"status": "success", "message": "Citizen module endpoint operational"}
