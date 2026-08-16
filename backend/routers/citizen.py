"""
Citizen module API routes for Nagpur SmartSanitation.
Ownership: Citizen team only. Do NOT modify main.py or schema.py.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date, timedelta
import uuid

router = APIRouter(
    prefix="/api/citizen",
    tags=["citizen"]
)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class WasteReportRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded camera capture")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    waste_type: str = Field(..., pattern="^(wet|dry|hazardous|e-waste|mixed)$")
    description: Optional[str] = Field(None, max_length=500)
    severity: Optional[int] = Field(3, ge=1, le=5)


class AssignedAuthority(BaseModel):
    name: str
    role: str
    phone: str
    email: str
    department: str
    avatar_icon: str
    avatar_url: Optional[str] = None


class TimelineEvent(BaseModel):
    status: str
    timestamp: str
    note: str


class WasteReportResponse(BaseModel):
    ticket_id: str
    status: str
    waste_type: str
    latitude: float
    longitude: float
    description: Optional[str]
    severity: int
    created_at: str
    image_url: Optional[str] = None
    assigned_authority: Optional[AssignedAuthority] = None
    timeline: list[TimelineEvent] = []


class ScheduleDay(BaseModel):
    day: str
    date: str
    waste_type: str
    time_window: str
    truck_id: str
    zone: str
    is_today: bool


class RewardTransaction(BaseModel):
    id: str
    action: str
    points: int
    date: str


class RewardProfile(BaseModel):
    total_points: int
    tier: str
    tier_progress: int
    next_tier: str
    points_to_next_tier: int
    streak_days: int
    history: list[RewardTransaction]
    redeemable: list[dict]


class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    points: int
    tier: str
    is_current_user: bool


class SegregationItem(BaseModel):
    name: str
    icon: str
    tip: str


class SegregationCategory(BaseModel):
    category: str
    color: str
    description: str
    items: list[SegregationItem]


class SegregationGuide(BaseModel):
    categories: list[SegregationCategory]
    quiz: list[dict]
    tips: list[str]


# ---------------------------------------------------------------------------
# In-memory mock store (persists within server session for demo realism)
# ---------------------------------------------------------------------------

MOCK_REPORTS: list[dict] = []

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/")
def get_citizen_status():
    """Health check for the citizen module."""
    return {"status": "success", "message": "Citizen module endpoint operational"}


@router.post("/report", response_model=WasteReportResponse)
def submit_waste_report(payload: WasteReportRequest):
    """
    Submit a waste / garbage report with a camera-captured image
    and GPS coordinates.
    """
    ticket_id = f"NMC-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow().isoformat()

    default_authority = AssignedAuthority(
        name="Inspector Vijay Deshmukh",
        role="Sanitation Inspector — Ward 14",
        phone="+91 98231 44556",
        email="vijay.deshmukh@nmc.gov.in",
        department="NMC Solid Waste Management Dept.",
        avatar_icon="👨‍✈️",
        avatar_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    )

    report = {
        "ticket_id": ticket_id,
        "status": "submitted",
        "waste_type": payload.waste_type,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "description": payload.description or "",
        "severity": payload.severity if payload.severity is not None else 3,
        "created_at": now,
        "image_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60",
        "assigned_authority": default_authority.model_dump(),
        "timeline": [
            TimelineEvent(
                status="submitted",
                timestamp=now,
                note="Ticket registered via Citizen Portal and geotagged.",
            ).model_dump(),
            TimelineEvent(
                status="assigned",
                timestamp=now,
                note="Assigned to Ward 14 Sanitation Inspector Vijay Deshmukh.",
            ).model_dump(),
        ],
    }
    MOCK_REPORTS.append(report)

    return WasteReportResponse(
        ticket_id=ticket_id,
        status="submitted",
        waste_type=payload.waste_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        severity=payload.severity if payload.severity is not None else 3,
        created_at=now,
        image_url=report["image_url"],
        assigned_authority=default_authority,
        timeline=[
            TimelineEvent(
                status="submitted",
                timestamp=now,
                note="Ticket registered via Citizen Portal and geotagged.",
            ),
            TimelineEvent(
                status="assigned",
                timestamp=now,
                note="Assigned to Ward 14 Sanitation Inspector Vijay Deshmukh.",
            ),
        ],
    )


@router.get("/reports", response_model=list[WasteReportResponse])
def get_citizen_reports():
    """Fetch all waste reports submitted by the citizen with assigned authority details."""
    seed_reports = [
        {
            "ticket_id": "NMC-A1B2C3D4",
            "status": "in_progress",
            "waste_type": "wet",
            "latitude": 21.1458,
            "longitude": 79.0882,
            "description": "Overflowing garbage near Sitabuldi metro station entrance.",
            "severity": 4,
            "created_at": "2026-08-14T08:30:00",
            "image_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Inspector Vijay Deshmukh",
                "role": "Sanitation Inspector — Ward 14",
                "phone": "+91 98231 44556",
                "email": "vijay.deshmukh@nmc.gov.in",
                "department": "NMC Solid Waste Management Dept.",
                "avatar_icon": "👨‍✈️",
                "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
            },
            "timeline": [
                {"status": "submitted", "timestamp": "2026-08-14T08:30:00", "note": "Grievance registered with GPS location."},
                {"status": "assigned", "timestamp": "2026-08-14T09:15:00", "note": "Assigned to Inspector Vijay Deshmukh."},
                {"status": "in_progress", "timestamp": "2026-08-14T11:00:00", "note": "Collection vehicle NMC-T101 dispatched to site."},
            ],
        },
        {
            "ticket_id": "NMC-E5F6G7H8",
            "status": "resolved",
            "waste_type": "dry",
            "latitude": 21.1535,
            "longitude": 79.0725,
            "description": "Plastic waste dumped near Ambazari lake promenade.",
            "severity": 3,
            "created_at": "2026-08-12T14:15:00",
            "image_url": "https://images.unsplash.com/photo-1604186838347-9faaf0deed60?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Supervisor Rajesh Shinde",
                "role": "Area Sanitary Supervisor — Ambazari Zone",
                "phone": "+91 94228 11990",
                "email": "rajesh.shinde@nagpur.gov.in",
                "department": "NMC West Zone Sanitation Unit",
                "avatar_icon": "👷‍♂️",
                "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
            },
            "timeline": [
                {"status": "submitted", "timestamp": "2026-08-12T14:15:00", "note": "Grievance registered with photograph."},
                {"status": "assigned", "timestamp": "2026-08-12T15:00:00", "note": "Assigned to Supervisor Rajesh Shinde."},
                {"status": "in_progress", "timestamp": "2026-08-12T16:30:00", "note": "Cleanup crew mobilized."},
                {"status": "resolved", "timestamp": "2026-08-13T10:00:00", "note": "Site cleared and verified by supervisor."},
            ],
        },
        {
            "ticket_id": "NMC-I9J0K1L2",
            "status": "submitted",
            "waste_type": "hazardous",
            "latitude": 21.1391,
            "longitude": 79.1050,
            "description": "Chemical containers discarded in Dharampeth drain.",
            "severity": 5,
            "created_at": "2026-08-15T19:45:00",
            "image_url": "https://images.unsplash.com/photo-1611284446314-60a55ac0d494?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Dr. Sunita Kulkarni",
                "role": "Chief Health Officer — NMC HazMat Unit",
                "phone": "+91 97654 32100",
                "email": "sunita.kulkarni@nmc.gov.in",
                "department": "NMC Public Health & HazMat Division",
                "avatar_icon": "👩‍⚕️",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
            },
            "timeline": [
                {"status": "submitted", "timestamp": "2026-08-15T19:45:00", "note": "High severity hazard report logged."},
            ],
        },
    ]

    all_reports = seed_reports + MOCK_REPORTS
    return [WasteReportResponse(**r) for r in all_reports]


@router.get("/schedule", response_model=list[ScheduleDay])
def get_weekly_schedule():
    """Return the weekly pickup schedule for the citizen's ward."""
    today = date.today()
    weekday = today.weekday()  # 0 = Monday

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    waste_rotation = ["wet", "dry", "wet", "hazardous", "dry", "mixed", "—"]
    time_windows = [
        "06:00 – 08:00", "07:00 – 09:00", "06:00 – 08:00",
        "09:00 – 11:00", "07:00 – 09:00", "06:00 – 10:00", "No pickup"
    ]
    trucks = ["NMC-T101", "NMC-T204", "NMC-T101", "NMC-HZ05", "NMC-T204", "NMC-T307", "—"]
    zones = [
        "Dharampeth Zone", "Laxmi Nagar Zone", "Dharampeth Zone",
        "Hazardous Unit – Hingna", "Laxmi Nagar Zone", "All Zones", "—"
    ]

    schedule = []
    for i, day_name in enumerate(days):
        day_offset = i - weekday
        d = today + timedelta(days=day_offset)

        schedule.append(ScheduleDay(
            day=day_name,
            date=d.isoformat(),
            waste_type=waste_rotation[i],
            time_window=time_windows[i],
            truck_id=trucks[i],
            zone=zones[i],
            is_today=(i == weekday),
        ))

    return schedule


@router.get("/rewards", response_model=RewardProfile)
def get_citizen_rewards():
    """Return the citizen's gamification profile."""
    session_report_points = len(MOCK_REPORTS) * 50

    return RewardProfile(
        total_points=1250 + session_report_points,
        tier="Sapling",
        tier_progress=62,
        next_tier="Tree",
        points_to_next_tier=max(0, 750 - session_report_points),
        streak_days=7,
        history=[
            RewardTransaction(id="txn-001", action="Waste report submitted", points=50, date="2026-08-15"),
            RewardTransaction(id="txn-002", action="7-day streak bonus", points=100, date="2026-08-15"),
            RewardTransaction(id="txn-003", action="Correct segregation verified", points=30, date="2026-08-14"),
            RewardTransaction(id="txn-004", action="Waste report submitted", points=50, date="2026-08-13"),
            RewardTransaction(id="txn-005", action="Community cleanup participation", points=200, date="2026-08-10"),
            RewardTransaction(id="txn-006", action="Referred a neighbor", points=75, date="2026-08-08"),
        ],
        redeemable=[
            {"name": "NMC Water Bill — ₹100 Discount", "cost": 500, "icon": "💧"},
            {"name": "Nagpur Metro Day Pass", "cost": 300, "icon": "🚇"},
            {"name": "Municipal Garden Entry (Family)", "cost": 200, "icon": "🌳"},
            {"name": "Swachh Nagpur T-Shirt", "cost": 150, "icon": "👕"},
        ],
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard():
    """Top citizens by GreenPoints."""
    return [
        LeaderboardEntry(rank=1, name="Priya Deshmukh", points=3420, tier="Forest", is_current_user=False),
        LeaderboardEntry(rank=2, name="Aarav Kulkarni", points=2890, tier="Tree", is_current_user=False),
        LeaderboardEntry(rank=3, name="Sneha Wankhede", points=2150, tier="Tree", is_current_user=False),
        LeaderboardEntry(rank=4, name="You", points=1250, tier="Sapling", is_current_user=True),
        LeaderboardEntry(rank=5, name="Rahul Bhosale", points=980, tier="Seedling", is_current_user=False),
    ]


@router.get("/segregation-guide", response_model=SegregationGuide)
def get_segregation_guide():
    """Return waste segregation educational data for the citizen guide."""
    return SegregationGuide(
        categories=[
            SegregationCategory(
                category="Wet Waste",
                color="#22c55e",
                description="Biodegradable waste that decomposes naturally. Goes into the GREEN bin.",
                items=[
                    SegregationItem(name="Fruit & Veggie Peels", icon="🍌", tip="Compost at home for garden soil"),
                    SegregationItem(name="Leftover Food", icon="🍛", tip="Drain liquids before disposal"),
                    SegregationItem(name="Tea Leaves / Coffee Grounds", icon="☕", tip="Great for composting"),
                    SegregationItem(name="Flowers & Leaves", icon="🌺", tip="Remove plastic wrappers first"),
                    SegregationItem(name="Egg Shells", icon="🥚", tip="Crush for faster decomposition"),
                    SegregationItem(name="Meat & Bones", icon="🍗", tip="Wrap in paper before disposal"),
                ],
            ),
            SegregationCategory(
                category="Dry Waste",
                color="#f59e0b",
                description="Non-biodegradable, recyclable waste. Goes into the BLUE bin.",
                items=[
                    SegregationItem(name="Plastic Bottles", icon="🧴", tip="Rinse and crush before disposal"),
                    SegregationItem(name="Paper & Cardboard", icon="📦", tip="Keep dry for effective recycling"),
                    SegregationItem(name="Glass Bottles", icon="🍶", tip="Wrap in newspaper if broken"),
                    SegregationItem(name="Metal Cans", icon="🥫", tip="Rinse to avoid contamination"),
                    SegregationItem(name="Plastic Bags", icon="🛍️", tip="Collect separately for recycling"),
                    SegregationItem(name="Clothes & Textiles", icon="👔", tip="Donate if still wearable"),
                ],
            ),
        ],
        quiz=[
            {"question": "Banana peel", "answer": "wet", "explanation": "Banana peels are organic and biodegradable."},
            {"question": "Plastic water bottle", "answer": "dry", "explanation": "Plastic is non-biodegradable and recyclable."},
            {"question": "Used tea bag", "answer": "wet", "explanation": "Tea leaves decompose naturally — remove any staple."},
            {"question": "Old newspaper", "answer": "dry", "explanation": "Paper is recyclable dry waste."},
            {"question": "Chicken bones", "answer": "wet", "explanation": "Bones are organic, biodegradable waste."},
            {"question": "Broken glass cup", "answer": "dry", "explanation": "Glass is recyclable — wrap carefully."},
            {"question": "Cooked rice", "answer": "wet", "explanation": "Food waste is always wet waste."},
            {"question": "Aluminium foil", "answer": "dry", "explanation": "Metal foil is recyclable. Clean off food first."},
        ],
        tips=[
            "Nagpur generates ~1,200 tonnes of waste daily. Proper segregation can recycle 60% of it.",
            "Composting wet waste at home reduces landfill burden by up to 40%.",
            "Rinse plastic containers before disposal — contaminated recyclables end up in landfills.",
            "NMC provides free composting bins to households. Visit your ward office to collect one.",
            "E-waste like batteries and electronics should NEVER go into regular bins. Use NMC e-waste drives.",
            "One plastic bag takes 500–1,000 years to decompose. Switch to cloth bags!",
        ],
    )
