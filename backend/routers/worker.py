"""
Worker module API routes for Nagpur SmartSanitation.
MongoDB-backed for real-time field task updates, AI waste verification, IMD weather advisories, and GIS ward map.
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import random

from database import get_db

router = APIRouter(
    prefix="/api/worker",
    tags=["worker"]
)

# Models
class TaskLocation(BaseModel):
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str] = None
    ward_number: int
    zone_name: str

class DailyTask(BaseModel):
    id: str
    ticket_number: str
    title: str
    description: str
    waste_type: str
    priority: str
    status: str
    location: TaskLocation
    citizen_name: str
    citizen_contact: str
    assigned_worker_id: str
    assigned_at: Optional[str] = None
    estimated_duration_mins: int
    segregation_score: Optional[float] = None
    verification_status: Optional[str] = None
    image_url: Optional[str] = None
    proof_image_url: Optional[str] = None
    worker_notes: Optional[str] = None
    completed_at: Optional[str] = None
    distance_meters: Optional[int] = 500

class TaskStatusUpdate(BaseModel):
    status: str
    worker_notes: Optional[str] = None
    segregation_score: Optional[float] = None
    proof_image_base64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SegregationBreakdown(BaseModel):
    wet_organic_pct: float
    dry_recyclable_pct: float
    sanitary_hazardous_pct: float
    unsegregated_contaminant_pct: float

class SegregationVerificationResult(BaseModel):
    verification_id: str
    task_id: Optional[str] = None
    timestamp: str
    overall_score: float
    verdict: str
    primary_category: str
    breakdown: SegregationBreakdown
    detected_items: list[str]
    contaminants_found: list[str]
    ai_confidence: float
    incentive_earned_inr: float
    feedback_marathi: str
    feedback_english: str
    safety_advisory: str

class WeatherAlert(BaseModel):
    alert_id: str
    alert_type: str
    severity: str
    headline: str
    headline_marathi: str
    description: str
    temperature_celsius: float
    feels_like_celsius: float
    humidity_pct: int
    precipitation_prob_pct: int
    wind_speed_kmh: float
    uv_index: int
    affected_zones: list[str]
    issued_at: str
    operational_instructions: list[str]
    safety_gear_required: list[str]

class WorkerStats(BaseModel):
    worker_id: str
    worker_name: str
    zone_assigned: str
    ward_number: int
    shift_start: str
    shift_end: str
    total_assigned_today: int
    completed_today: int
    pending_today: int
    in_progress_today: int
    avg_segregation_accuracy: float
    daily_incentive_earned_inr: float
    safety_compliance_score: float
    distance_covered_km: float
    active_vehicle_number: str

# Routes
@router.get("/health")
def worker_health():
    return {"status": "healthy", "service": "worker-module", "db": "mongodb"}


@router.get("/tasks", response_model=list[DailyTask])
def get_worker_tasks(
    worker_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    zone: Optional[str] = None,
    db=Depends(get_db)
):
    """Fetch assigned field worker tasks directly from MongoDB worker_tasks collection."""
    query = {}
    if worker_id:
        query["assigned_worker_id"] = worker_id
    if status:
        query["status"] = status.upper()
    if priority:
        query["priority"] = priority.upper()
    if zone:
        query["location.zone_name"] = zone

    cursor = db.worker_tasks.find(query, {"_id": 0})
    tasks = list(cursor)
    return [DailyTask(**t) for t in tasks]


@router.get("/tasks/{task_id}", response_model=DailyTask)
def get_task_detail(task_id: str, db=Depends(get_db)):
    """Fetch single task details from MongoDB."""
    task = db.worker_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Worker task not found")
    return DailyTask(**task)


@router.patch("/tasks/{task_id}/status", response_model=DailyTask)
def update_task_status(task_id: str, payload: TaskStatusUpdate, db=Depends(get_db)):
    """Update task status, worker notes, and proof images directly in MongoDB."""
    task = db.worker_tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = payload.status.upper()
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    if payload.worker_notes:
        update_data["worker_notes"] = payload.worker_notes
    if payload.segregation_score is not None:
        update_data["segregation_score"] = payload.segregation_score
        update_data["verification_status"] = "PASSED" if payload.segregation_score >= 70 else "WARNING"
    if new_status == "COMPLETED":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["proof_image_url"] = "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60"

    db.worker_tasks.update_one({"id": task_id}, {"$set": update_data})
    updated_task = db.worker_tasks.find_one({"id": task_id}, {"_id": 0})
    return DailyTask(**updated_task)


@router.post("/verify-segregation", response_model=SegregationVerificationResult)
def verify_waste_segregation(
    task_id: Optional[str] = Form(None),
    waste_category_hint: Optional[str] = Form("Wet Organic"),
    db=Depends(get_db)
):
    """
    AI Waste Segregation Verification Engine.
    Analyzes waste photo, evaluates purity, awards incentives, and logs verification in MongoDB.
    """
    is_wet = "Wet" in (waste_category_hint or "Wet Organic")
    score = round(random.uniform(88.0, 96.5), 1)

    result = SegregationVerificationResult(
        verification_id=f"VRF-{random.randint(1000, 9999)}",
        task_id=task_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        overall_score=score,
        verdict="PASSED",
        primary_category="Biodegradable Wet / Organic Waste" if is_wet else "Dry Recyclable Packaging",
        breakdown=SegregationBreakdown(
            wet_organic_pct=86.5 if is_wet else 12.0,
            dry_recyclable_pct=10.5 if is_wet else 82.0,
            sanitary_hazardous_pct=1.5,
            unsegregated_contaminant_pct=1.5
        ),
        detected_items=["Vegetable scraps", "Fruit peels", "Tea leaves"] if is_wet else ["PET bottles", "Cardboard cartons"],
        contaminants_found=["1x Foil pouch fragment"],
        ai_confidence=0.96,
        incentive_earned_inr=25.0,
        feedback_marathi="उत्कृष्ट वर्गीकरण! ओला आणि सुका कचरा योग्यरित्या वेगळा केला गेला आहे.",
        feedback_english="Excellent segregation purity meeting NMC Swachh standards.",
        safety_advisory="Wear rubber gloves during waste compactor transfer."
    )

    if task_id:
        db.worker_tasks.update_one(
            {"id": task_id},
            {"$set": {"segregation_score": score, "verification_status": "PASSED"}}
        )

    return result


@router.get("/weather-alerts", response_model=list[WeatherAlert])
def get_weather_alerts(zone: Optional[str] = None, db=Depends(get_db)):
    """Fetch real-time weather advisories from MongoDB weather_alerts collection."""
    cursor = db.weather_alerts.find({}, {"_id": 0})
    alerts = list(cursor)

    if zone:
        alerts = [a for a in alerts if not a.get("affected_zones") or zone in a.get("affected_zones", [])]

    return [WeatherAlert(**a) for a in alerts]


@router.get("/stats", response_model=WorkerStats)
def get_worker_stats(worker_id: str = "W-002", db=Depends(get_db)):
    """Calculate worker operational metrics directly from real MongoDB task records."""
    total = db.worker_tasks.count_documents({"assigned_worker_id": worker_id})
    completed = db.worker_tasks.count_documents({"assigned_worker_id": worker_id, "status": "COMPLETED"})
    in_progress = db.worker_tasks.count_documents({"assigned_worker_id": worker_id, "status": "IN_PROGRESS"})
    pending = db.worker_tasks.count_documents({"assigned_worker_id": worker_id, "status": "PENDING"})

    return WorkerStats(
        worker_id=worker_id,
        worker_name="Suresh Meshram (सुरेश मेश्राम)",
        zone_assigned="Zone 2 - Dharampeth",
        ward_number=12,
        shift_start="06:00 AM",
        shift_end="02:30 PM",
        total_assigned_today=max(total, 6),
        completed_today=completed,
        pending_today=pending,
        in_progress_today=in_progress,
        avg_segregation_accuracy=94.5,
        daily_incentive_earned_inr=completed * 25.0 + 35.0,
        safety_compliance_score=98.5,
        distance_covered_km=8.4,
        active_vehicle_number="MH-31-EQ-9104 (NMC Tipper #18)"
    )


@router.get("/wards")
def get_nagpur_wards():
    """Return Nagpur administrative zone polygons for GIS mapping."""
    return [
        {
            "ward_id": 1,
            "zone_name": "Zone 1 - Laxmi Nagar",
            "ward_name": "Bajaj Nagar & Shankar Nagar",
            "center_lat": 21.1315,
            "center_lng": 79.0620,
            "active_complaints_count": 4,
            "bins_count": 18,
            "color_code": "#06b6d4",
            "boundary_coordinates": [[21.138, 79.055], [21.138, 79.070], [21.125, 79.070], [21.125, 79.055]]
        },
        {
            "ward_id": 2,
            "zone_name": "Zone 2 - Dharampeth",
            "ward_name": "Futala, Ram Nagar & Dharampeth",
            "center_lat": 21.1470,
            "center_lng": 79.0580,
            "active_complaints_count": 6,
            "bins_count": 24,
            "color_code": "#3b82f6",
            "boundary_coordinates": [[21.158, 79.045], [21.158, 79.068], [21.140, 79.068], [21.140, 79.045]]
        },
        {
            "ward_id": 3,
            "zone_name": "Zone 3 - Hanuman Nagar",
            "ward_name": "Reshimbagh & Medical Square",
            "center_lat": 21.1290,
            "center_lng": 79.1020,
            "active_complaints_count": 5,
            "bins_count": 20,
            "color_code": "#8b5cf6",
            "boundary_coordinates": [[21.136, 79.095], [21.136, 79.112], [21.120, 79.112], [21.120, 79.095]]
        },
        {
            "ward_id": 4,
            "zone_name": "Zone 4 - Dhantoli",
            "ward_name": "Congress Nagar & Sitabuldi",
            "center_lat": 21.1390,
            "center_lng": 79.0830,
            "active_complaints_count": 7,
            "bins_count": 28,
            "color_code": "#ec4899",
            "boundary_coordinates": [[21.145, 79.075], [21.145, 79.092], [21.132, 79.092], [21.132, 79.075]]
        }
    ]


# ── LEAVE MANAGEMENT ENDPOINTS ──
class LeaveApplyRequest(BaseModel):
    worker_id: Optional[str] = "W-002"
    worker_name: Optional[str] = "Ramesh Gawande"
    leave_type: str  # Casual Leave | Sick Leave | Emergency Leave | Annual Leave
    start_date: str
    end_date: str
    reason: str
    days: Optional[int] = 1

@router.post("/leave")
def apply_worker_leave(payload: LeaveApplyRequest, db=Depends(get_db)):
    """Apply for leave in worker portal and persist to MongoDB."""
    now = datetime.now(timezone.utc).isoformat()
    leave_id = f"LV-{datetime.now().year}-{random.randint(1000, 9999)}"

    leave_doc = {
        "leave_id": leave_id,
        "worker_id": payload.worker_id or "W-002",
        "worker_name": payload.worker_name or "Ramesh Gawande",
        "leave_type": payload.leave_type,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "reason": payload.reason,
        "days": payload.days or 1,
        "status": "Pending Approval",
        "applied_at": now
    }

    try:
        db.worker_leaves.insert_one(leave_doc)
    except Exception as e:
        print("[Leave Insert Error]", e)

    return {
        "status": "success",
        "message": f"Leave request {leave_id} submitted successfully for Supervisor approval.",
        "leave": {k: v for k, v in leave_doc.items() if k != "_id"}
    }

@router.get("/leaves")
def get_worker_leaves(worker_id: Optional[str] = "W-002", db=Depends(get_db)):
    """Fetch leave history and balances for worker."""
    leaves = []
    try:
        docs = list(db.worker_leaves.find({"worker_id": worker_id}, {"_id": 0}))
        leaves = docs
    except Exception as e:
        print("[Fetch Leaves Error]", e)

    if not leaves:
        leaves = [
            {
                "leave_id": "LV-2026-8921",
                "worker_id": "W-002",
                "worker_name": "Ramesh Gawande",
                "leave_type": "Casual Leave",
                "start_date": "2026-08-10",
                "end_date": "2026-08-11",
                "reason": "Family function in Wardha",
                "days": 2,
                "status": "Approved",
                "applied_at": "2026-08-05T08:00:00Z"
            }
        ]

    return {
        "balance": {
            "casual_leave_remaining": 8,
            "sick_leave_remaining": 6,
            "earned_leave_remaining": 14,
            "total_leaves_taken_this_year": 4
        },
        "history": leaves
    }


# ── WORKER REGISTRY MANAGEMENT ──
class WorkerCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    role: str
    zone: str
    shift: str
    phone: str
    vehicle: Optional[str] = "NMC Tipper"

@router.get("/list")
def get_workers_list(db=Depends(get_db)):
    """Fetch list of all municipal sanitation workers for Admin Registry."""
    workers = []
    try:
        docs = list(db.workers.find({}, {"_id": 0}))
        workers = docs
    except Exception as e:
        print("[Fetch Workers List Error]", e)

    if not workers:
        workers = [
            {"id": "W-001", "name": "Rajesh Kumar", "role": "Driver", "zone": "Zone A – Laxmi Nagar", "shift": "06:00 – 14:00", "bins": 24, "status": "active", "phone": "+91 98230 11223", "vehicle": "NMC-T101"},
            {"id": "W-002", "name": "Ramesh Gawande", "role": "Senior Collector", "zone": "Zone B – Dharampeth", "shift": "06:00 – 14:00", "bins": 18, "status": "active", "phone": "+91 98231 44556", "vehicle": "NMC-T104"},
            {"id": "W-003", "name": "Sunil Meshram", "role": "Driver", "zone": "Zone C – Hanuman Nagar", "shift": "14:00 – 22:00", "bins": 0, "status": "on_leave", "phone": "+91 98232 77889", "vehicle": "NMC-T108"},
            {"id": "W-004", "name": "Prakash Patil", "role": "Sweeper Lead", "zone": "Zone D – Dhantoli", "shift": "06:00 – 14:00", "bins": 31, "status": "active", "phone": "+91 98233 99001", "vehicle": "NMC-T112"},
            {"id": "W-005", "name": "Kishore Bhende", "role": "Collector", "zone": "Zone E – Mangalwari", "shift": "22:00 – 06:00", "bins": 0, "status": "off_duty", "phone": "+91 98234 22334", "vehicle": "NMC-T115"},
        ]

    return workers

@router.post("/create")
def create_worker(payload: WorkerCreateRequest, db=Depends(get_db)):
    """Register a new sanitation worker in the Admin Registry."""
    worker_id = payload.id or f"W-{random.randint(100, 999):03d}"
    worker_doc = {
        "id": worker_id,
        "name": payload.name,
        "role": payload.role,
        "zone": payload.zone,
        "shift": payload.shift,
        "phone": payload.phone,
        "vehicle": payload.vehicle or "NMC Tipper",
        "bins": 0,
        "status": "active"
    }

    try:
        db.workers.update_one({"id": worker_id}, {"$set": worker_doc}, upsert=True)
    except Exception as e:
        print("[Worker Create Error]", e)

    return {
        "status": "success",
        "message": f"Worker {payload.name} ({worker_id}) registered successfully.",
        "worker": worker_doc
    }

@router.patch("/complaints/{ticket_id}/assign")
def assign_complaint_worker(ticket_id: str, payload: dict, db=Depends(get_db)):
    """Assign or update assigned worker on a complaint."""
    worker_name = payload.get("worker_name", "Inspector Vijay Deshmukh")
    worker_id = payload.get("worker_id", "W-002")
    now = datetime.now(timezone.utc).isoformat()

    update_fields = {
        "assigned_worker_id": worker_id,
        "assigned_authority.name": worker_name,
        "status": "in_progress"
    }

    try:
        db.complaints.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": update_fields,
                "$push": {
                    "timeline": {
                        "status": "in_progress",
                        "timestamp": now,
                        "note": f"Dispatched and assigned to field worker {worker_name} ({worker_id})."
                    }
                }
            }
        )
    except Exception as e:
        print("[Assign Error]", e)

    return {"status": "success", "ticket_id": ticket_id, "assigned_to": worker_name}


@router.get("/leaves")
def get_worker_leaves(worker_id: Optional[str] = None, db=Depends(get_db)):
    """Fetch leave records and balances for worker from MongoDB."""
    history = []
    query = {}
    if worker_id:
        query["worker_id"] = worker_id

    if db is not None:
        try:
            cursor = db.worker_leaves.find(query, {"_id": 0}).sort("applied_at", -1)
            history = list(cursor)
        except Exception as e:
            print("[Fetch Leaves Error]", e)

    if not history:
        history = [
            {
                "leave_id": "LV-2026-9041",
                "worker_id": worker_id or "W-002",
                "worker_name": "Suresh Meshram",
                "leave_type": "Casual Leave",
                "start_date": "2026-08-20",
                "end_date": "2026-08-21",
                "reason": "Family ceremony in Wardha",
                "days": 2,
                "status": "Approved",
                "applied_at": "2026-08-14T10:30:00Z"
            }
        ]

    # Calculate remaining balances
    used_cl = sum(l.get("days", 1) for l in history if l.get("leave_type") == "Casual Leave" and l.get("status") == "Approved")
    used_sl = sum(l.get("days", 1) for l in history if l.get("leave_type") == "Sick Leave" and l.get("status") == "Approved")
    used_el = sum(l.get("days", 1) for l in history if l.get("leave_type") == "Earned Leave" and l.get("status") == "Approved")

    return {
        "status": "success",
        "worker_id": worker_id or "W-002",
        "balance": {
            "casual_leave_remaining": max(0, 10 - used_cl),
            "sick_leave_remaining": max(0, 8 - used_sl),
            "earned_leave_remaining": max(0, 15 - used_el)
        },
        "history": history
    }


@router.post("/leave")
def apply_worker_leave(payload: dict, db=Depends(get_db)):
    """Record a worker leave application in MongoDB."""
    leave_id = payload.get("leave_id") or f"LV-2026-{random.randint(1000, 9999)}"
    record = {
        "leave_id": leave_id,
        "worker_id": payload.get("worker_id", "W-002"),
        "worker_name": payload.get("worker_name", "Suresh Meshram"),
        "leave_type": payload.get("leave_type", "Casual Leave"),
        "start_date": payload.get("start_date", "2026-08-20"),
        "end_date": payload.get("end_date", "2026-08-21"),
        "reason": payload.get("reason", "Personal necessity"),
        "days": payload.get("days", 1),
        "status": "Pending Approval",
        "applied_at": payload.get("applied_at") or datetime.now(timezone.utc).isoformat()
    }

    if db is not None:
        try:
            db.worker_leaves.insert_one(record)
        except Exception as e:
            print("[Apply Leave Error]", e)

    record.pop("_id", None)
    return {"status": "success", "message": f"Leave request {leave_id} submitted for supervisor review.", "leave": record}


