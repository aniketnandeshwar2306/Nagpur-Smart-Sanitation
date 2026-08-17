"""
MongoDB database connection and seeding module for Nagpur SmartSanitation.
Connects to local MongoDB instance on mongodb://localhost:27017.
"""

import os
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "nagpur_smart_sanitation")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_hash(password: str) -> str:
    return pwd_context.hash(password)

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
db = client[DB_NAME]

def get_db():
    """FastAPI dependency for accessing MongoDB database instance."""
    return db

def init_db():
    """
    Initialize MongoDB indexes and seed initial baseline database documents
    for users, complaints, smart_bins, worker_tasks, and weather_alerts collections.
    """
    print(f"[MONGODB] Connecting to {MONGO_URL}/{DB_NAME}...")

    # 1. Create Indexes
    db.users.create_index([("phone", ASCENDING)], unique=True, sparse=True)
    db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
    db.complaints.create_index([("ticket_id", ASCENDING)], unique=True)
    db.worker_tasks.create_index([("id", ASCENDING)], unique=True)
    db.smart_bins.create_index([("bin_id", ASCENDING)], unique=True)

    # 2. Seed Demo Accounts if users collection is empty
    if db.users.count_documents({}) == 0:
        demo_users = [
            {
                "id": "CIT-7819",
                "name": "Aniket Nandeshwar",
                "phone": "+91 98231 44556",
                "email": "aniket@example.com",
                "password_hash": get_hash("pass"),
                "role": "citizen",
                "ward": "Ward 14 - Dharampeth",
                "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                "created_at": datetime.now(timezone.utc).isoformat(),
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
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "ADM-001",
                "name": "Dr. Priya Sharma",
                "phone": "+91 98220 10001",
                "email": "priya.sharma@nmc.gov.in",
                "password_hash": get_hash("admin123"),
                "role": "admin",
                "ward": "NMC HQ - Civil Lines",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
        db.users.insert_many(demo_users)
        print("[MONGODB] Seeded initial user accounts (Citizen, Worker, Admin).")

    # 3. Seed Initial Complaints if collection is empty
    if db.complaints.count_documents({}) == 0:
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
                "description": "Overflowing organic food waste outside Sitabuldi market gate.",
                "created_at": datetime.now(timezone.utc).isoformat(),
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
                    {"status": "submitted", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Registered geotagged complaint."},
                    {"status": "in_progress", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Assigned to worker Suresh Meshram."}
                ]
            },
            {
                "ticket_id": "NMC-2026-8802",
                "citizen_id": "CIT-7819",
                "citizen_name": "Seema Joshi",
                "status": "submitted",
                "waste_type": "hazardous",
                "severity": 5,
                "latitude": 21.1535,
                "longitude": 79.0949,
                "description": "Chemical containers dumped near drainage nala behind Cotton Market.",
                "created_at": datetime.now(timezone.utc).isoformat(),
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
                    {"status": "submitted", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "High severity hazard report logged."}
                ]
            },
            {
                "ticket_id": "NMC-2026-8803",
                "citizen_id": "CIT-7819",
                "citizen_name": "Amit Nair",
                "status": "resolved",
                "waste_type": "dry",
                "severity": 2,
                "latitude": 21.1388,
                "longitude": 79.0816,
                "description": "Cardboard and plastic waste blocking footpath on Wardha Road.",
                "created_at": datetime.now(timezone.utc).isoformat(),
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
                    {"status": "submitted", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Grievance registered."},
                    {"status": "resolved", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Site cleared and verified by supervisor."}
                ]
            }
        ]
        db.complaints.insert_many(demo_complaints)
        print("[MONGODB] Seeded initial complaints collection.")

    # 4. Seed Initial Smart Bins if collection is empty
    if db.smart_bins.count_documents({}) == 0:
        demo_bins = [
            {"bin_id": "BIN-NGP-01", "ward_id": 2, "zone_name": "Zone 2 - Dharampeth", "location_name": "Futala Lake Gate 1", "fill_level": 82, "status": "critical", "lat": 21.1539, "lng": 79.0494},
            {"bin_id": "BIN-NGP-02", "ward_id": 4, "zone_name": "Zone 4 - Dhantoli", "location_name": "Sitabuldi Market Gate 2", "fill_level": 95, "status": "critical", "lat": 21.1448, "lng": 79.0837},
            {"bin_id": "BIN-NGP-03", "ward_id": 1, "zone_name": "Zone 1 - Laxmi Nagar", "location_name": "Shankar Nagar Square", "fill_level": 45, "status": "normal", "lat": 21.1315, "lng": 79.0620},
            {"bin_id": "BIN-NGP-04", "ward_id": 3, "zone_name": "Zone 3 - Hanuman Nagar", "location_name": "Medical Square Bus Stop", "fill_level": 60, "status": "normal", "lat": 21.1309, "lng": 79.0988},
            {"bin_id": "BIN-NGP-05", "ward_id": 6, "zone_name": "Zone 6 - Gandhibagh", "location_name": "Itwari Wholesale Mandi", "fill_level": 88, "status": "warning", "lat": 21.1550, "lng": 79.1100},
        ]
        db.smart_bins.insert_many(demo_bins)
        print("[MONGODB] Seeded initial smart bins collection.")

    # 5. Seed Initial Worker Tasks if collection is empty
    if db.worker_tasks.count_documents({}) == 0:
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
            }
        ]
        db.worker_tasks.insert_many(demo_tasks)
        print("[MONGODB] Seeded initial worker tasks collection.")

    # 6. Seed Initial Weather Alerts if collection is empty
    if db.weather_alerts.count_documents({}) == 0:
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
                "issued_at": datetime.now(timezone.utc).isoformat(),
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
        db.weather_alerts.insert_many(demo_alerts)
        print("[MONGODB] Seeded initial weather alerts collection.")

    print("[MONGODB] Initialization complete. All database collections ready!")
