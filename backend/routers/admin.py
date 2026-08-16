from fastapi import APIRouter

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

@router.get("/")
def get_admin_status():
    return {"status": "success", "message": "Admin module endpoint operational"}
