"""
MongoDB database connection and seeding module for Nagpur SmartSanitation.
Connects to local MongoDB or MongoDB Atlas via MONGODB_URI.
Seeds all baseline mock collections and keeps them up-to-date with new user actions.
"""

import os
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type("about", (), {"__version__": getattr(bcrypt, "__version__", "4.0.1")})()

from passlib.context import CryptContext
from dotenv import load_dotenv

_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_backend_dir, ".env"))
load_dotenv(os.path.join(_backend_dir, "..", ".env"))
load_dotenv()

MONGO_URL = os.getenv("MONGODB_URI") or os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "nagpur_smart_sanitation")

import hashlib

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    pwd_context = None

def get_hash(password: str) -> str:
    if pwd_context:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    salt = "nss_nagpur_salt_2026"
    return "pbkdf2$" + hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000, connectTimeoutMS=10000)
    db = client[DB_NAME]
except Exception as e:
    print(f"[MONGODB CONNECTION WARNING] Could not initialize client: {e}")
    client = None
    db = None

def get_db():
    """FastAPI dependency for accessing MongoDB database instance."""
    return db

def seed_all_mock_data(force: bool = False):
    """
    Populate or update MongoDB with rich baseline municipal mock datasets across all collections:
    - users (citizens, workers, admins)
    - complaints (geotagged reports across Nagpur wards)
    - smart_bins (IoT ultrasonic fill level telemetry)
    - worker_tasks (field sanitation tasks with GPS routes)
    - workers (admin worker registry)
    - worker_leaves (leave history & balance)
    - weather_alerts (IMD Nagpur weather & heatwave SOPs)
    """
    if db is None:
        print("[MONGODB] Skipping seed: database connection unavailable.")
        return

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Create Indexes
    try:
        db.users.create_index([("phone", ASCENDING)], unique=True, sparse=True)
        db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        db.complaints.create_index([("ticket_id", ASCENDING)], unique=True)
        db.worker_tasks.create_index([("id", ASCENDING)], unique=True)
        db.smart_bins.create_index([("bin_id", ASCENDING)], unique=True)
        db.workers.create_index([("id", ASCENDING)], unique=True)
    except Exception as e:
        print("[MONGODB INDEX INFO]", e)

    # 2. Seed / Upsert Users
    demo_users = [
        {
            "id": "CIT-7819",
            "name": "Aniket Nandeshwar",
            "phone": "+91 98231 44556",
            "email": "aniket@example.com",
            "password_hash": get_hash("pass"),
            "role": "citizen",
            "ward": "Ward 14 - Dharampeth",
            "reward_points": 1450,
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            "created_at": now_iso,
        },
        {
            "id": "CIT-8021",
            "name": "Priya Deshmukh",
            "phone": "+91 98232 55667",
            "email": "priya.deshmukh@example.com",
            "password_hash": get_hash("pass"),
            "role": "citizen",
            "ward": "Ward 1 - Laxmi Nagar",
            "reward_points": 3420,
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "created_at": now_iso,
        },
        {
            "id": "W-002",
            "name": "Suresh Meshram",
            "phone": "+91 98230 02222",
            "email": "suresh.meshram@nmc.gov.in",
            "password_hash": get_hash("pass"),
            "role": "worker",
            "ward": "Ward 12 - Dharampeth",
            "vehicle_number": "NMC-T18",
            "zone_assigned": "Zone B - Civil Lines & Sitabuldi",
            "avatar_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
            "created_at": now_iso,
        },
        {
            "id": "ADM-001",
            "name": "Dr. Priya Sharma",
            "phone": "+91 98220 10001",
            "email": "priya.sharma@nmc.gov.in",
            "password_hash": get_hash("admin123"),
            "role": "admin",
            "ward": "NMC HQ - Civil Lines",
            "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            "created_at": now_iso,
        },
    ]

    for u in demo_users:
        if force or db.users.count_documents({"id": u["id"]}) == 0:
            db.users.update_one({"id": u["id"]}, {"$set": u}, upsert=True)

    # 3. Seed / Upsert Baseline Complaints
    demo_complaints = [
        {
            "ticket_id": "NMC-2026-8801",
            "citizen_id": "CIT-7819",
            "citizen_name": "Aniket Nandeshwar",
            "status": "in_progress",
            "waste_type": "wet",
            "severity": 4,
            "latitude": 21.1458,
            "longitude": 79.0882,
            "description": "Overflowing organic food waste outside Sitabuldi market gate, attracting stray cattle.",
            "created_at": now_iso,
            "image_url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Inspector Vijay Deshmukh",
                "role": "Sanitation Inspector - Ward 14",
                "phone": "+91 98231 44556",
                "email": "vijay.deshmukh@nmc.gov.in",
                "department": "NMC Solid Waste Management Dept.",
                "avatar_icon": "👨‍✈️",
                "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80"
            },
            "timeline": [
                {"status": "submitted", "timestamp": now_iso, "note": "Registered geotagged complaint via Citizen Portal."},
                {"status": "in_progress", "timestamp": now_iso, "note": "Dispatched to worker Suresh Meshram (NMC-T18)."}
            ]
        },
        {
            "ticket_id": "NMC-2026-8802",
            "citizen_id": "CIT-7819",
            "citizen_name": "Aniket Nandeshwar",
            "status": "submitted",
            "waste_type": "hazardous",
            "severity": 5,
            "latitude": 21.1535,
            "longitude": 79.0949,
            "description": "Chemical drums dumped near drainage nala behind Cotton Market.",
            "created_at": now_iso,
            "image_url": "https://images.unsplash.com/photo-1611284446314-60a55ac0d494?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Dr. Sunita Kulkarni",
                "role": "Chief Health Officer - NMC HazMat Unit",
                "phone": "+91 97654 32100",
                "email": "sunita.kulkarni@nmc.gov.in",
                "department": "NMC Public Health Division",
                "avatar_icon": "👩‍⚕️"
            },
            "timeline": [
                {"status": "submitted", "timestamp": now_iso, "note": "High severity hazard report logged."}
            ]
        },
        {
            "ticket_id": "NMC-2026-8803",
            "citizen_id": "CIT-7819",
            "citizen_name": "Aniket Nandeshwar",
            "status": "resolved",
            "waste_type": "dry",
            "severity": 2,
            "latitude": 21.1388,
            "longitude": 79.0816,
            "description": "Cardboard and plastic packaging waste blocking footpath on Wardha Road.",
            "created_at": now_iso,
            "image_url": "https://images.unsplash.com/photo-1604186838347-9faaf0deed60?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Supervisor Rajesh Shinde",
                "role": "Area Sanitary Supervisor - Ambazari Zone",
                "phone": "+91 94228 11990",
                "email": "rajesh.shinde@nagpur.gov.in",
                "department": "NMC West Zone Sanitation Unit",
                "avatar_icon": "👷‍♂️"
            },
            "timeline": [
                {"status": "submitted", "timestamp": now_iso, "note": "Grievance registered."},
                {"status": "resolved", "timestamp": now_iso, "note": "Site cleared, plastic baled, and verified by supervisor."}
            ]
        },
        {
            "ticket_id": "NMC-2026-8804",
            "citizen_id": "CIT-8021",
            "citizen_name": "Priya Deshmukh",
            "status": "in_progress",
            "waste_type": "e-waste",
            "severity": 3,
            "latitude": 21.1490,
            "longitude": 79.1012,
            "description": "Old cathode ray monitors and discarded electronics near Ambedkar Square.",
            "created_at": now_iso,
            "image_url": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "E-Waste Special Task Cell",
                "role": "NMC E-Waste Coordinator",
                "phone": "+91 98123 45678",
                "email": "ewaste@nmc.gov.in",
                "department": "NMC Hazardous Waste Div.",
                "avatar_icon": "🔌"
            },
            "timeline": [
                {"status": "submitted", "timestamp": now_iso, "note": "E-waste disposal drive scheduled."}
            ]
        },
        {
            "ticket_id": "NMC-2026-8805",
            "citizen_id": "CIT-8021",
            "citizen_name": "Priya Deshmukh",
            "status": "resolved",
            "waste_type": "wet",
            "severity": 2,
            "latitude": 21.1420,
            "longitude": 79.0960,
            "description": "Vegetable market organic peelings cleared from Gokulpeth road.",
            "created_at": now_iso,
            "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
            "assigned_authority": {
                "name": "Inspector Vijay Deshmukh",
                "role": "Sanitation Inspector",
                "phone": "+91 98231 44556",
                "email": "vijay.deshmukh@nmc.gov.in",
                "department": "NMC SWM",
                "avatar_icon": "👨‍✈️"
            },
            "timeline": [
                {"status": "resolved", "timestamp": now_iso, "note": "Collected and diverted to Bhandewadi Composting Plant."}
            ]
        }
    ]

    for c in demo_complaints:
        if force or db.complaints.count_documents({"ticket_id": c["ticket_id"]}) == 0:
            db.complaints.update_one({"ticket_id": c["ticket_id"]}, {"$set": c}, upsert=True)

    # 4. Seed / Upsert Smart Bins
    demo_bins = [
        {"bin_id": "BIN-NGP-01", "ward_id": 2, "zone_name": "Zone 2 - Dharampeth", "location_name": "Futala Lake Gate 1", "fill_level": 82, "status": "critical", "lat": 21.1539, "lng": 79.0494, "battery": 94},
        {"bin_id": "BIN-NGP-02", "ward_id": 4, "zone_name": "Zone 4 - Dhantoli", "location_name": "Sitabuldi Market Gate 2", "fill_level": 95, "status": "critical", "lat": 21.1448, "lng": 79.0837, "battery": 88},
        {"bin_id": "BIN-NGP-03", "ward_id": 1, "zone_name": "Zone 1 - Laxmi Nagar", "location_name": "Shankar Nagar Square", "fill_level": 45, "status": "normal", "lat": 21.1315, "lng": 79.0620, "battery": 97},
        {"bin_id": "BIN-NGP-04", "ward_id": 3, "zone_name": "Zone 3 - Hanuman Nagar", "location_name": "Medical Square Bus Stop", "fill_level": 60, "status": "normal", "lat": 21.1309, "lng": 79.0988, "battery": 78},
        {"bin_id": "BIN-NGP-05", "ward_id": 6, "zone_name": "Zone 6 - Gandhibagh", "location_name": "Itwari Wholesale Mandi", "fill_level": 88, "status": "warning", "lat": 21.1550, "lng": 79.1100, "battery": 91},
        {"bin_id": "BIN-NGP-06", "ward_id": 2, "zone_name": "Zone 2 - Dharampeth", "location_name": "Ambazari Garden Gate", "fill_level": 35, "status": "normal", "lat": 21.1290, "lng": 79.0480, "battery": 95},
        {"bin_id": "BIN-NGP-07", "ward_id": 10, "zone_name": "Zone 10 - Mangalwari", "location_name": "Sadar Residency Road", "fill_level": 74, "status": "warning", "lat": 21.1620, "lng": 79.0810, "battery": 83},
    ]

    for b in demo_bins:
        if force or db.smart_bins.count_documents({"bin_id": b["bin_id"]}) == 0:
            db.smart_bins.update_one({"bin_id": b["bin_id"]}, {"$set": b}, upsert=True)

    # 5. Seed / Upsert Worker Tasks
    demo_tasks = [
        {
            "id": "TSK-NGP-101",
            "ticket_number": "NMC-2026-8801",
            "title": "Commercial Dry Waste Overspill at Sitabuldi Market",
            "description": "Excess cardboard packaging and plastic wrap blocking lane behind Main Footwear Market.",
            "waste_type": "Dry Recyclable",
            "priority": "CRITICAL",
            "status": "PENDING",
            "location": {
                "latitude": 21.1448,
                "longitude": 79.0837,
                "address": "Shop 42, Sitabuldi Main Market Gate 2, Nagpur",
                "landmark": "Opposite Variety Square Metro Station",
                "ward_number": 4,
                "zone_name": "Zone 4 - Dhantoli"
            },
            "citizen_name": "Anand Kulkarni",
            "citizen_contact": "+91 98230 11422",
            "assigned_worker_id": "W-002",
            "estimated_duration_mins": 35,
            "distance_meters": 650
        },
        {
            "id": "TSK-NGP-102",
            "ticket_number": "NMC-2026-8802",
            "title": "Food Kiosk Organic Waste Collection at Futala Promenade",
            "description": "Daily organic wet waste (coconut shells, snack leftovers) from food stalls ready for pickup.",
            "waste_type": "Wet Organic",
            "priority": "HIGH",
            "status": "IN_PROGRESS",
            "location": {
                "latitude": 21.1539,
                "longitude": 79.0494,
                "address": "Futala Lake Promenade East Bank",
                "landmark": "Near Futala Musical Fountain Gate 1",
                "ward_number": 2,
                "zone_name": "Zone 2 - Dharampeth"
            },
            "citizen_name": "Suresh Bhole",
            "citizen_contact": "+91 94221 44550",
            "assigned_worker_id": "W-002",
            "estimated_duration_mins": 25,
            "distance_meters": 1200
        },
        {
            "id": "TSK-NGP-103",
            "ticket_number": "NMC-2026-8803",
            "title": "Wardha Road Footpath Packaging Clearance",
            "description": "Heavy paper boxes and shipping materials piled on pedestrian footpath.",
            "waste_type": "Dry Recyclable",
            "priority": "MEDIUM",
            "status": "COMPLETED",
            "location": {
                "latitude": 21.1388,
                "longitude": 79.0816,
                "address": "Wardha Road, Near Sai Mandir",
                "landmark": "Opposite Metro Pillar 48",
                "ward_number": 1,
                "zone_name": "Zone 1 - Laxmi Nagar"
            },
            "citizen_name": "Amit Nair",
            "citizen_contact": "+91 98223 99011",
            "assigned_worker_id": "W-002",
            "estimated_duration_mins": 20,
            "distance_meters": 800
        }
    ]

    for t in demo_tasks:
        if force or db.worker_tasks.count_documents({"id": t["id"]}) == 0:
            db.worker_tasks.update_one({"id": t["id"]}, {"$set": t}, upsert=True)

    # 6. Seed / Upsert Workers Registry
    demo_registry = [
        {"id": "W-001", "name": "Rajesh Kumar", "role": "Driver", "zone": "Zone A – Laxmi Nagar", "shift": "06:00 – 14:00", "bins": 24, "status": "active", "phone": "+91 98230 11223", "vehicle": "NMC-T101"},
        {"id": "W-002", "name": "Suresh Meshram", "role": "Senior Collector", "zone": "Zone B – Dharampeth", "shift": "06:00 – 14:00", "bins": 18, "status": "active", "phone": "+91 98231 44556", "vehicle": "NMC-T18"},
        {"id": "W-003", "name": "Sunil Meshram", "role": "Driver", "zone": "Zone C – Hanuman Nagar", "shift": "14:00 – 22:00", "bins": 0, "status": "on_leave", "phone": "+91 98232 77889", "vehicle": "NMC-T108"},
        {"id": "W-004", "name": "Prakash Patil", "role": "Sweeper Lead", "zone": "Zone D – Dhantoli", "shift": "06:00 – 14:00", "bins": 31, "status": "active", "phone": "+91 98233 99001", "vehicle": "NMC-T112"},
        {"id": "W-005", "name": "Kishore Bhende", "role": "Collector", "zone": "Zone E – Mangalwari", "shift": "22:00 – 06:00", "bins": 0, "status": "off_duty", "phone": "+91 98234 22334", "vehicle": "NMC-T115"},
    ]

    for reg in demo_registry:
        if force or db.workers.count_documents({"id": reg["id"]}) == 0:
            db.workers.update_one({"id": reg["id"]}, {"$set": reg}, upsert=True)

    # 7. Seed / Upsert Worker Leaves
    demo_leaves = [
        {
            "leave_id": "LV-2026-9041",
            "worker_id": "W-002",
            "worker_name": "Suresh Meshram",
            "leave_type": "Casual Leave",
            "start_date": "2026-08-20",
            "end_date": "2026-08-21",
            "reason": "Family ceremony in Wardha",
            "days": 2,
            "status": "Approved",
            "applied_at": "2026-08-14T10:30:00Z"
        },
        {
            "leave_id": "LV-2026-9042",
            "worker_id": "W-002",
            "worker_name": "Suresh Meshram",
            "leave_type": "Sick Leave",
            "start_date": "2026-08-05",
            "end_date": "2026-08-05",
            "reason": "Seasonal fever checkup at GMCH Nagpur",
            "days": 1,
            "status": "Approved",
            "applied_at": "2026-08-04T08:00:00Z"
        }
    ]

    for l in demo_leaves:
        if force or db.worker_leaves.count_documents({"leave_id": l["leave_id"]}) == 0:
            db.worker_leaves.update_one({"leave_id": l["leave_id"]}, {"$set": l}, upsert=True)

    # 8. Seed / Upsert Weather Alerts
    demo_alerts = [
        {
            "alert_id": "NMC-WX-2026-081",
            "alert_type": "HEATWAVE",
            "severity": "HIGH",
            "headline": "Nagpur Orange Heatwave Advisory: Peak Temp 43.8°C",
            "headline_marathi": "नागपूर उष्णतेची लाट इशारा: तापमान ४३.८° से. पर्यंत पोहोचले",
            "description": "IMD Nagpur has issued an Orange Alert. Severe solar radiation expected between 12:00 PM and 03:30 PM across all municipal zones.",
            "temperature_celsius": 43.8,
            "feels_like_celsius": 46.5,
            "humidity_pct": 28,
            "precipitation_prob_pct": 5,
            "wind_speed_kmh": 14.2,
            "uv_index": 11,
            "affected_zones": [
                "Zone 2 - Dharampeth",
                "Zone 4 - Dhantoli",
                "Zone 6 - Gandhibagh",
                "Zone 1 - Laxmi Nagar",
                "Zone 3 - Hanuman Nagar"
            ],
            "issued_at": now_iso,
            "operational_instructions": [
                "Mandatory 15-minute shaded hydration rest every 90 minutes of active route collection.",
                "Suspend heavy manual lifting in open sun between 01:00 PM and 03:00 PM.",
                "Keep covered tarpaulins over open waste tippers.",
                "Carry ORS electrolytic water packets provided at NMC Ward Offices."
            ],
            "safety_gear_required": [
                "Wide-brim UV safety hat",
                "Cooling wet neck scarf",
                "UV protection goggles",
                "2-Litre insulated water flask"
            ]
        }
    ]

    for a in demo_alerts:
        if force or db.weather_alerts.count_documents({"alert_id": a["alert_id"]}) == 0:
            db.weather_alerts.update_one({"alert_id": a["alert_id"]}, {"$set": a}, upsert=True)

    print("[MONGODB] All mock baseline collections verified and seeded in database.")

def init_db():
    """Called on server lifespan startup."""
    print(f"[MONGODB] Initializing connection to {MONGO_URL}/{DB_NAME}...")
    seed_all_mock_data(force=False)
