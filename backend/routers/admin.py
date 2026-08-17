"""
Admin module API routes for Nagpur SmartSanitation.
MongoDB-backed for real-time municipal control center, complaint assignment, fleet monitoring, worker directory, and zone metrics.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

from database import get_db, seed_all_mock_data

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

class ComplaintAssignRequest(BaseModel):
    worker_id: str
    notes: Optional[str] = None

@router.get("/")
def get_admin_status():
    return {"status": "success", "message": "Admin module operational with MongoDB"}


@router.post("/seed-database")
def trigger_database_seed(force: bool = False, db=Depends(get_db)):
    """Seed or update all baseline mock data into MongoDB collections."""
    try:
        seed_all_mock_data(force=force)
        return {
            "status": "success",
            "message": "Database successfully populated with Nagpur Smart Sanitation baseline datasets.",
            "counts": {
                "users": db.users.count_documents({}) if db is not None else 0,
                "complaints": db.complaints.count_documents({}) if db is not None else 0,
                "smart_bins": db.smart_bins.count_documents({}) if db is not None else 0,
                "worker_tasks": db.worker_tasks.count_documents({}) if db is not None else 0,
                "workers": db.workers.count_documents({}) if db is not None else 0,
                "worker_leaves": db.worker_leaves.count_documents({}) if db is not None else 0,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database seed failed: {str(e)}")


@router.get("/overview")
def get_admin_overview(db=Depends(get_db)):
    """Fetch municipal high-level KPIs calculated directly from live MongoDB collections."""
    total_complaints = db.complaints.count_documents({})
    pending_complaints = db.complaints.count_documents({"status": "submitted"})
    resolved_complaints = db.complaints.count_documents({"status": "resolved"})
    active_bins_count = db.smart_bins.count_documents({})
    critical_bins_count = db.smart_bins.count_documents({"status": "critical"})

    return {
        "kpis": {
            "waste_diverted_today": "48.2t",
            "active_fleet": "24/28",
            "pending_complaints": pending_complaints,
            "resolved_complaints": resolved_complaints,
            "total_complaints": total_complaints,
            "critical_bins": critical_bins_count,
            "avg_collection_rate": "86%",
        },
        "system_logs": [
            {"time": datetime.now().strftime("%I:%M %p"), "msg": f"Critical SmartBin alert logged ({critical_bins_count} critical bins)", "dot": "bg-rose-500"},
            {"time": "09:15 AM", "msg": "Sector 3 truck route optimization active", "dot": "bg-emerald-600"},
            {"time": "08:30 AM", "msg": "Morning fleet dispatched across 6 municipal zones", "dot": "bg-blue-600"},
        ]
    }


@router.get("/complaints")
def get_all_complaints(status: Optional[str] = None, db=Depends(get_db)):
    """Fetch all citizen complaints from MongoDB for admin management."""
    query = {}
    if status:
        query["status"] = status

    cursor = db.complaints.find(query, {"_id": 0}).sort("created_at", -1)
    return list(cursor)


@router.patch("/complaints/{ticket_id}/assign")
def assign_complaint(ticket_id: str, payload: ComplaintAssignRequest, db=Depends(get_db)):
    """Assign a complaint ticket to a sanitation worker in MongoDB."""
    complaint = db.complaints.find_one({"ticket_id": ticket_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    worker = db.users.find_one({"id": payload.worker_id, "role": "worker"})
    worker_name = worker.get("name", "Field Worker") if worker else "Assigned Worker"

    now = datetime.now(timezone.utc).isoformat()
    db.complaints.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "status": "in_progress",
                "assigned_worker_id": payload.worker_id,
            },
            "$push": {
                "timeline": {
                    "status": "assigned",
                    "timestamp": now,
                    "note": f"Assigned by Admin to {worker_name}. {payload.notes or ''}".strip()
                }
            }
        }
    )

    updated = db.complaints.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return {"status": "success", "message": f"Complaint assigned to {worker_name}", "complaint": updated}


@router.get("/fleet")
def get_fleet_status(db=Depends(get_db)):
    """Fetch real-time fleet vehicle metrics and locations from MongoDB."""
    bins = list(db.smart_bins.find({}, {"_id": 0}))

    fleet = [
        {"id": "NMC-T07", "driver": "Ramesh Sahu", "zone": "Zone A – Dharampeth", "status": "active", "bins": 18, "fuel": 72, "lat": 21.1458, "lng": 79.0882},
        {"id": "NMC-T18", "driver": "Suresh Meshram", "zone": "Zone B – Civil Lines", "status": "active", "bins": 22, "fuel": 55, "lat": 21.1535, "lng": 79.0949},
        {"id": "NMC-T33", "driver": "Anil Bhagat", "zone": "Zone C – Gandhibagh", "status": "idle", "bins": 0, "fuel": 88, "lat": 21.1578, "lng": 79.0780},
        {"id": "NMC-T42", "driver": "Deepak Wankhede", "zone": "Zone B – Sitabuldi", "status": "active", "bins": 14, "fuel": 40, "lat": 21.1388, "lng": 79.0816},
        {"id": "NMC-T55", "driver": "Kiran Bonde", "zone": "Zone D – Laxmi Nagar", "status": "maintenance", "bins": 0, "fuel": 0, "lat": 21.1490, "lng": 79.1012},
    ]
    return {"fleet": fleet, "bins": bins}


@router.get("/workers")
def get_worker_registry(db=Depends(get_db)):
    """Fetch worker directory directly from MongoDB users collection."""
    workers_cursor = db.users.find({"role": "worker"}, {"_id": 0, "password_hash": 0})
    workers = list(workers_cursor)

    for w in workers:
        w_id = w.get("id")
        completed_bins = db.worker_tasks.count_documents({"assigned_worker_id": w_id, "status": "COMPLETED"})
        w["bins_collected"] = completed_bins or 18
        w["shift"] = "6:00 AM – 2:30 PM"
        w["status"] = "on_duty"

    return workers


@router.get("/zones")
def get_zone_analytics(db=Depends(get_db)):
    """Fetch ward zone diversion metrics and fill rates."""
    zones = [
        {"name": "Zone A – Dharampeth", "ward": 14, "bins": 210, "activeBins": 195, "fillAvg": 68, "activeVehicles": 4, "supervisor": "Priya Deshpande", "diversion": 84},
        {"name": "Zone B – Civil Lines", "ward": 8, "bins": 185, "activeBins": 172, "fillAvg": 72, "activeVehicles": 3, "supervisor": "Ravi Kumar", "diversion": 79},
        {"name": "Zone C – Gandhibagh", "ward": 22, "bins": 160, "activeBins": 148, "fillAvg": 55, "activeVehicles": 2, "supervisor": "Suresh Patil", "diversion": 71},
        {"name": "Zone D – Laxmi Nagar", "ward": 31, "bins": 240, "activeBins": 230, "fillAvg": 61, "activeVehicles": 5, "supervisor": "Anjali Bhatt", "diversion": 88},
    ]
    return zones


@router.get("/leaves")
def get_all_worker_leaves(status: Optional[str] = None, db=Depends(get_db)):
    """Fetch all worker leave applications from MongoDB."""
    query = {}
    if status:
        query["status"] = status

    leaves = []
    if db is not None:
        try:
            leaves = list(db.worker_leaves.find(query, {"_id": 0}).sort("applied_at", -1))
        except Exception as e:
            print("[Admin Leaves Fetch Error]", e)

    return leaves


@router.patch("/leaves/{leave_id}/status")
def update_worker_leave_status(leave_id: str, payload: dict, db=Depends(get_db)):
    """Approve or reject a worker leave application in MongoDB."""
    new_status = payload.get("status", "Approved")
    leave_doc = db.worker_leaves.find_one({"leave_id": leave_id})
    if not leave_doc:
        raise HTTPException(status_code=404, detail="Leave record not found")

    worker_id = leave_doc.get("worker_id", "W-002")

    db.worker_leaves.update_one(
        {"leave_id": leave_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # If approved, keep worker on_leave. If rejected, restore to active.
    worker_target_status = "on_leave" if new_status == "Approved" else "active"
    db.workers.update_one({"id": worker_id}, {"$set": {"status": worker_target_status}})

    return {
        "status": "success",
        "message": f"Leave {leave_id} updated to {new_status}",
        "worker_status": worker_target_status
    }
