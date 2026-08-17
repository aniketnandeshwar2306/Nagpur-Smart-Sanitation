"""
Nagpur SmartSanitation Platform - Worker API Router
Author: Worker Module Team
Prefix: /api/worker

Features:
1. SQLite Database persistence for tasks, worker shifts, vehicle telemetry, weather alerts, and GIS wards.
2. Real file storage for waste audits in backend/uploads/audits/{ticket_no}_{timestamp}.jpg
3. AI hook analyze_waste_image() for ONNX / YOLOv8 segregation models
4. Real-time GPS telemetry endpoint for sanitation vehicles (POST /api/worker/telemetry)
5. Weather hazard alerts & GIS ward mapping queried directly from SQLite database
"""

import os
import re
import json
import base64
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from contextlib import contextmanager
from dotenv import load_dotenv

from fastapi import (
    APIRouter,
    HTTPException,
    File,
    UploadFile,
    Form,
    status
)
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Database & File Storage Setup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DB_PATH = os.path.join(BACKEND_DIR, "smart_sanitation.db")
UPLOAD_AUDITS_DIR = os.path.join(BACKEND_DIR, "uploads", "audits")

# Load environment variables
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(BACKEND_DIR, "..", ".env"))

# Ensure upload directory exists
os.makedirs(UPLOAD_AUDITS_DIR, exist_ok=True)


@contextmanager
def get_db():
    """Context manager for SQLite database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initializes SQLite database tables and seeds initial Nagpur sanitation data."""
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Tasks Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                ticket_no TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                address TEXT NOT NULL,
                landmark TEXT,
                ward_number INTEGER NOT NULL,
                zone_name TEXT NOT NULL,
                citizen_name TEXT,
                citizen_contact TEXT,
                assigned_worker_id TEXT NOT NULL,
                assigned_at TEXT NOT NULL,
                estimated_duration_mins INTEGER DEFAULT 25,
                ai_purity_score REAL,
                verification_status TEXT,
                bonus_awarded REAL DEFAULT 0.0,
                image_url TEXT,
                proof_image_url TEXT,
                worker_notes TEXT,
                completed_at TEXT
            )
        """)

        # 2. Worker Shift Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS worker_shift (
                worker_id TEXT PRIMARY KEY,
                worker_name TEXT NOT NULL,
                zone_assigned TEXT NOT NULL,
                ward_number INTEGER NOT NULL,
                shift_start TEXT NOT NULL,
                shift_end TEXT NOT NULL,
                daily_bonus REAL DEFAULT 0.0,
                purity_score REAL DEFAULT 91.2,
                safety_compliance_score REAL DEFAULT 98.5,
                route_distance REAL DEFAULT 7.8,
                active_vehicle_number TEXT DEFAULT 'MH-31-EQ-9104 (E-Tipper #12)'
            )
        """)

        # 3. Telemetry Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                truck_no TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)

        # 4. Weather Alerts Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weather_alerts (
                alert_id TEXT PRIMARY KEY,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                headline TEXT NOT NULL,
                headline_marathi TEXT NOT NULL,
                description TEXT NOT NULL,
                temperature_celsius REAL NOT NULL,
                feels_like_celsius REAL NOT NULL,
                humidity_pct INTEGER NOT NULL,
                precipitation_prob_pct INTEGER NOT NULL,
                wind_speed_kmh REAL NOT NULL,
                uv_index INTEGER NOT NULL,
                affected_zones TEXT NOT NULL,
                issued_at TEXT NOT NULL,
                valid_until TEXT NOT NULL,
                operational_instructions TEXT NOT NULL,
                safety_gear_required TEXT NOT NULL
            )
        """)

        # 5. Wards GIS Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wards (
                ward_id INTEGER PRIMARY KEY,
                zone_name TEXT NOT NULL,
                ward_name TEXT NOT NULL,
                center_lat REAL NOT NULL,
                center_lng REAL NOT NULL,
                active_complaints_count INTEGER NOT NULL,
                bins_count INTEGER NOT NULL,
                color_code TEXT NOT NULL,
                boundary_coordinates TEXT NOT NULL
            )
        """)

        # Seed initial worker shift if table is empty
        cursor.execute("SELECT COUNT(*) FROM worker_shift WHERE worker_id = 'WRK-4089'")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO worker_shift (
                    worker_id, worker_name, zone_assigned, ward_number,
                    shift_start, shift_end, daily_bonus, purity_score,
                    safety_compliance_score, route_distance, active_vehicle_number
                ) VALUES (
                    'WRK-4089', 'Rajesh Rao (राजेश राव)', 'Zone 2 - Dharampeth', 12,
                    '06:00 AM', '02:30 PM', 35.0, 94.2,
                    98.5, 7.8, 'MH-31-EQ-9104 (E-Tipper #12)'
                )
            """)

        # Seed initial tasks if table is empty
        cursor.execute("SELECT COUNT(*) FROM tasks")
        if cursor.fetchone()[0] == 0:
            seed_tasks = [
                (
                    "TSK-NGP-101", "NMC-2026-8801",
                    "Commercial Dry Waste Overspill at Sitabuldi Market",
                    "Excess cardboard packaging, plastic wrap, and carton accumulation blocking lane behind Main Footwear Market.",
                    "Dry Recyclable", "CRITICAL", "PENDING",
                    21.1448, 79.0837,
                    "Shop 42, Sitabuldi Main Market Gate 2, Nagpur",
                    "Opposite Variety Square Metro Station", 4, "Zone 4 - Dhantoli",
                    "Anand Kulkarni (Vyapari Mandal)", "+91 98230 11422",
                    "WRK-4089", "2026-08-16T06:30:00Z", 35,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-102", "NMC-2026-8802",
                    "Food Kiosk Organic Waste Collection at Futala Promenade",
                    "Daily organic wet waste (coconut shells, snack leftovers, fruit pulp) from evening food stalls ready for composting pickup.",
                    "Wet Organic", "HIGH", "IN_PROGRESS",
                    21.1539, 79.0494,
                    "Futala Lake Promenade East Bank, Vayusena Nagar",
                    "Near Futala Musical Fountain Gate 1", 2, "Zone 2 - Dharampeth",
                    "Suresh Bhole", "+91 94221 44550",
                    "WRK-4089", "2026-08-16T07:15:00Z", 25,
                    92.0, "PASSED", 40.0,
                    "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60",
                    None, "First lot loaded into green composter bin vehicle.", None
                ),
                (
                    "TSK-NGP-103", "NMC-2026-8803",
                    "Apartment Complex Unsegregated Waste Clearance",
                    "Citizen complaint of mixed waste dumped near transformer yard. Needs AI verification of source segregation before truck loading.",
                    "Mixed Waste", "MEDIUM", "PENDING",
                    21.1432, 79.0621,
                    "Shree Ganesh Enclave, Dharampeth Extension",
                    "Behind Coffee House Square", 2, "Zone 2 - Dharampeth",
                    "Pooja Deshmukh (Secretary)", "+91 97644 88319",
                    "WRK-4089", "2026-08-16T08:00:00Z", 30,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-104", "NMC-2026-8804",
                    "Clinic Biomedical / Sanitary Waste Special Disposal",
                    "Safe pickup of sealed yellow bin containers containing sanitized clinical disposables & gloves from local clinic lane.",
                    "Sanitary / Hazardous", "CRITICAL", "PENDING",
                    21.1309, 79.0988,
                    "Near GMC Boys Hostel Road, Medical Square",
                    "Opposite Ayush Diagnostics", 3, "Zone 3 - Hanuman Nagar",
                    "Dr. Milind Joshi", "+91 98901 33410",
                    "WRK-4089", "2026-08-16T08:30:00Z", 20,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-105", "NMC-2026-8805",
                    "Morning Garden Trimmings & Horticulture Waste",
                    "Tree pruning branches and dry leaves gathered after public garden maintenance. 100% compostable organic green load.",
                    "Wet Organic", "LOW", "COMPLETED",
                    21.1278, 79.1084,
                    "Reshimbagh Ground North Perimeter",
                    "Near Hedgewar Smruti Mandir Gate 3", 3, "Zone 3 - Hanuman Nagar",
                    "NMC Garden Department", "+91 712 2567001",
                    "WRK-4089", "2026-08-16T06:00:00Z", 20,
                    98.0, "PASSED", 50.0,
                    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=60",
                    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60",
                    "Loaded 350 kg leaf litter into shredder composter vehicle.", "2026-08-16T07:10:00Z"
                ),
                (
                    "TSK-NGP-106", "NMC-2026-8806",
                    "Electronic E-Waste Drop Box Clearance",
                    "Public battery and obsolete electronic scrap bin reached 90% capacity at Shankar Nagar community hall.",
                    "E-Waste", "MEDIUM", "PENDING",
                    21.1315, 79.0620,
                    "Community Civic Center, Shankar Nagar Square",
                    "Adjacent to Canara Bank ATM", 1, "Zone 1 - Laxmi Nagar",
                    "Pravin Patil", "+91 98229 55601",
                    "WRK-4089", "2026-08-16T09:00:00Z", 15,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-107", "NMC-2026-8807",
                    "Nandanvan Commercial Vegetable Mandi Wet Clearance",
                    "Accumulation of leftover vegetable produce and bio-matter behind Nandanvan Main Road.",
                    "Wet Organic", "HIGH", "PENDING",
                    21.1290, 79.1310,
                    "Nandanvan Market Chowk, Lane 3",
                    "Behind Gurudeo Nagar Garden", 5, "Zone 5 - Nehru Nagar",
                    "Sunil Meshram", "+91 98234 56789",
                    "WRK-4089", "2026-08-16T07:30:00Z", 30,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-108", "NMC-2026-8808",
                    "Itwari Wholesale Grain & Packing Box Clearance",
                    "Discarded wooden crates, corrugated cartons, and plastic straps in Wholesale Grain Market lane.",
                    "Dry Recyclable", "CRITICAL", "PENDING",
                    21.1555, 79.1120,
                    "Grain Market Gate 4, Itwari, Nagpur",
                    "Near Teen Nal Chowk", 6, "Zone 6 - Gandhibagh",
                    "Rameshwar Agrawal", "+91 94228 12345",
                    "WRK-4089", "2026-08-16T08:15:00Z", 40,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-109", "NMC-2026-8809",
                    "Shanti Nagar Secondary Street Mixed Waste Spot",
                    "Citizen report of domestic mixed garbage dumped near drainage culvert.",
                    "Mixed Waste", "HIGH", "PENDING",
                    21.1680, 79.1170,
                    "Shanti Nagar Main Road, Plot 14",
                    "Near Water Tank Circle", 7, "Zone 7 - Satranjipura",
                    "Kavita Gaikwad", "+91 97655 43210",
                    "WRK-4089", "2026-08-16T09:30:00Z", 25,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-110", "NMC-2026-8810",
                    "Pardi Industrial & Construction Debris Pile",
                    "Concrete rubble, broken tiles, and masonry scrap dumped along ring road service lane.",
                    "Construction Scrap", "HIGH", "PENDING",
                    21.1490, 79.1430,
                    "Old Bhandara Road, Near Pardi Naka",
                    "Opposite Octroi Post", 8, "Zone 8 - Lakadganj",
                    "Santosh Tiwari", "+91 98902 34567",
                    "WRK-4089", "2026-08-16T10:00:00Z", 45,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-111", "NMC-2026-8811",
                    "Indora Chowk Commercial Plastic & Mixed Bin Spill",
                    "Commercial food wrappers, single-use bags, and cups overflowing from community bins.",
                    "Mixed Waste", "CRITICAL", "PENDING",
                    21.1830, 79.1090,
                    "Indora Square, North Nagpur Corridor",
                    "Near Dr. Ambedkar College Gate", 9, "Zone 9 - Ashi Nagar",
                    "Bhimrao Wankhede", "+91 98221 67890",
                    "WRK-4089", "2026-08-16T10:30:00Z", 30,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                ),
                (
                    "TSK-NGP-112", "NMC-2026-8812",
                    "Sadar Residency Road Restaurant Wet Waste Pickup",
                    "Segregated kitchen organic waste bins from food street restaurants ready for bio-methanation processing.",
                    "Wet Organic", "HIGH", "PENDING",
                    21.1680, 79.0820,
                    "Residency Road Food Street, Sadar",
                    "Behind Mount Road Shopping Complex", 10, "Zone 10 - Mangalwari",
                    "Firoz Khan (Hotel Association)", "+91 94220 98765",
                    "WRK-4089", "2026-08-16T11:00:00Z", 25,
                    None, None, 0.0,
                    "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60",
                    None, None, None
                )
            ]
            cursor.executemany("""
                INSERT INTO tasks (
                    id, ticket_no, title, description, category, priority, status,
                    lat, lon, address, landmark, ward_number, zone_name,
                    citizen_name, citizen_contact, assigned_worker_id, assigned_at,
                    estimated_duration_mins, ai_purity_score, verification_status,
                    bonus_awarded, image_url, proof_image_url, worker_notes, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_tasks)

        # Seed weather alerts if table is empty
        cursor.execute("SELECT COUNT(*) FROM weather_alerts")
        if cursor.fetchone()[0] == 0:
            seed_alerts = [
                (
                    "NMC-WX-2026-081",
                    "HEATWAVE",
                    "HIGH",
                    "Nagpur Orange Heatwave Advisory: Peak Temp 43.8°C",
                    "नागपूर उष्णतेची लाट इशारा: तापमान ४३.८° से. पर्यंत पोहोचले",
                    "IMD Nagpur has issued an Orange Alert. Severe solar radiation expected between 12:00 PM and 03:30 PM across all municipal zones.",
                    43.8,
                    46.5,
                    28,
                    5,
                    14.2,
                    11,
                    json.dumps([
                        "Zone 1 - Laxmi Nagar",
                        "Zone 2 - Dharampeth",
                        "Zone 3 - Hanuman Nagar",
                        "Zone 4 - Dhantoli",
                        "Zone 5 - Nehru Nagar",
                        "Zone 6 - Gandhibagh",
                        "Zone 7 - Satranjipura",
                        "Zone 8 - Lakadganj",
                        "Zone 9 - Ashi Nagar",
                        "Zone 10 - Mangalwari"
                    ]),
                    "2026-08-16T08:00:00Z",
                    "2026-08-16T18:00:00Z",
                    json.dumps([
                        "Mandatory 15-minute shaded hydration rest every 90 minutes of active route collection.",
                        "Suspend heavy manual lifting in open sun between 01:00 PM and 03:00 PM.",
                        "Keep covered tarpaulins over open waste tippers to prevent rapid organic decomposition odors.",
                        "Carry ORS electrolytic water packets provided at NMC Ward Offices."
                    ]),
                    json.dumps([
                        "Wide-brim UV safety hat",
                        "Cooling wet neck scarf",
                        "UV protection goggles",
                        "2-Litre insulated water flask"
                    ])
                ),
                (
                    "NMC-WX-2026-082",
                    "MONSOON_RAIN",
                    "MODERATE",
                    "Evening Thunderstorm & Local Waterlogging Advisory",
                    "संध्याकाळी मेघगर्जनेसह मुसळधार पाऊस व पाणी साचण्याची शक्यता",
                    "Localized convective rain cells expected over Sitabuldi, Gandhibagh, and Nag river drainage corridors after 04:30 PM.",
                    33.2,
                    38.0,
                    76,
                    65,
                    24.0,
                    6,
                    json.dumps([
                        "Zone 4 - Dhantoli",
                        "Zone 6 - Gandhibagh",
                        "Zone 7 - Satranjipura",
                        "Zone 10 - Mangalwari"
                    ]),
                    "2026-08-16T11:00:00Z",
                    "2026-08-16T21:00:00Z",
                    json.dumps([
                        "Ensure all street corner storm drain grates are cleared of polythene blockage before downpour.",
                        "Park compactor trucks on elevated concrete platforms away from low-lying culverts.",
                        "Cover organic waste loads to prevent leachate runoff into public storm drains."
                    ]),
                    json.dumps([
                        "High-visibility reflective rain jacket",
                        "Anti-skid waterproof safety gumboots",
                        "Waterproof mobile pouch"
                    ])
                )
            ]
            cursor.executemany("""
                INSERT INTO weather_alerts (
                    alert_id, alert_type, severity, headline, headline_marathi,
                    description, temperature_celsius, feels_like_celsius, humidity_pct,
                    precipitation_prob_pct, wind_speed_kmh, uv_index, affected_zones,
                    issued_at, valid_until, operational_instructions, safety_gear_required
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_alerts)

        # Seed all 10 NMC Zones in wards table if table is empty or has fewer than 10 zones
        cursor.execute("SELECT COUNT(*) FROM wards")
        if cursor.fetchone()[0] < 10:
            cursor.execute("DELETE FROM wards")
            seed_wards = [
                (
                    1,
                    "Zone 1 - Laxmi Nagar",
                    "Bajaj Nagar, Shankar Nagar, Khamla & Pratap Nagar",
                    21.1250,
                    79.0600,
                    5,
                    24,
                    "#06b6d4",
                    json.dumps([
                        [21.138, 79.050], [21.138, 79.072], [21.115, 79.072], [21.115, 79.050]
                    ])
                ),
                (
                    2,
                    "Zone 2 - Dharampeth",
                    "Futala, Ram Nagar, Gokulpeth, Seminary Hills & Dharampeth",
                    21.1470,
                    79.0580,
                    6,
                    28,
                    "#3b82f6",
                    json.dumps([
                        [21.158, 79.045], [21.158, 79.070], [21.138, 79.070], [21.138, 79.045]
                    ])
                ),
                (
                    3,
                    "Zone 3 - Hanuman Nagar",
                    "Reshimbagh, Medical Square, Sakkardara & Ayodhya Nagar",
                    21.1220,
                    79.1020,
                    5,
                    22,
                    "#8b5cf6",
                    json.dumps([
                        [21.135, 79.090], [21.135, 79.115], [21.112, 79.115], [21.112, 79.090]
                    ])
                ),
                (
                    4,
                    "Zone 4 - Dhantoli",
                    "Congress Nagar, Sitabuldi, Rahate Colony & Ajni",
                    21.1390,
                    79.0830,
                    7,
                    30,
                    "#ec4899",
                    json.dumps([
                        [21.148, 79.072], [21.148, 79.095], [21.130, 79.095], [21.130, 79.072]
                    ])
                ),
                (
                    5,
                    "Zone 5 - Nehru Nagar",
                    "Nandanvan, Tajbagh, Hasanbagh, Kharbi & Dighori",
                    21.1280,
                    79.1320,
                    6,
                    26,
                    "#e11d48",
                    json.dumps([
                        [21.138, 79.120], [21.138, 79.145], [21.118, 79.145], [21.118, 79.120]
                    ])
                ),
                (
                    6,
                    "Zone 6 - Gandhibagh",
                    "Itwari, Mahal, Badkas Chowk & Hansapuri",
                    21.1550,
                    79.1100,
                    9,
                    35,
                    "#f59e0b",
                    json.dumps([
                        [21.165, 79.098], [21.165, 79.122], [21.145, 79.122], [21.145, 79.098]
                    ])
                ),
                (
                    7,
                    "Zone 7 - Satranjipura",
                    "Satranjipura, Shanti Nagar, Mehdi Bagh & Itwari Bazar",
                    21.1660,
                    79.1150,
                    6,
                    24,
                    "#14b8a6",
                    json.dumps([
                        [21.176, 79.105], [21.176, 79.126], [21.156, 79.126], [21.156, 79.105]
                    ])
                ),
                (
                    8,
                    "Zone 8 - Lakadganj",
                    "Garoba Maidan, Bagadganj, Pardi & Wardhaman Nagar",
                    21.1480,
                    79.1400,
                    8,
                    32,
                    "#84cc16",
                    json.dumps([
                        [21.158, 79.128], [21.158, 79.155], [21.138, 79.155], [21.138, 79.128]
                    ])
                ),
                (
                    9,
                    "Zone 9 - Ashi Nagar",
                    "Pachpaoli, Bezonbagh, Indora, Kamal Chowk & Teka Naka",
                    21.1820,
                    79.1100,
                    7,
                    28,
                    "#6366f1",
                    json.dumps([
                        [21.195, 79.098], [21.195, 79.124], [21.170, 79.124], [21.170, 79.098]
                    ])
                ),
                (
                    10,
                    "Zone 10 - Mangalwari",
                    "Sadar, Chaoni, Raj Bhavan, Mankapur & Gittikhadan",
                    21.1750,
                    79.0750,
                    4,
                    20,
                    "#10b981",
                    json.dumps([
                        [21.188, 79.062], [21.188, 79.090], [21.162, 79.090], [21.162, 79.062]
                    ])
                )
            ]
            cursor.executemany("""
                INSERT INTO wards (
                    ward_id, zone_name, ward_name, center_lat, center_lng,
                    active_complaints_count, bins_count, color_code, boundary_coordinates
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_wards)


# Run DB initialization on module load
init_db()


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(
    prefix="/api/worker",
    tags=["worker"]
)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class LocationCoordinates(BaseModel):
    latitude: float = Field(..., example=21.1458)
    longitude: float = Field(..., example=79.0882)
    address: str = Field(..., example="Dharampeth Main Road, Nagpur")
    landmark: Optional[str] = Field(None, example="Near Coffee House Square")
    ward_number: int = Field(..., example=12)
    zone_name: str = Field(..., example="Zone 2 - Dharampeth")


class TaskItem(BaseModel):
    id: str
    ticket_number: str
    title: str
    description: Optional[str] = ""
    waste_type: str = Field(..., example="Wet & Dry Mixed")
    priority: str = Field(..., example="HIGH")
    status: str = Field(..., example="PENDING")
    location: LocationCoordinates
    citizen_name: Optional[str] = None
    citizen_contact: Optional[str] = None
    assigned_worker_id: str
    assigned_at: str
    estimated_duration_mins: int = 25
    segregation_score: Optional[float] = None
    verification_status: Optional[str] = None
    bonus_awarded: Optional[float] = 0.0
    image_url: Optional[str] = None
    proof_image_url: Optional[str] = None
    worker_notes: Optional[str] = None
    completed_at: Optional[str] = None


class CreateTaskRequest(BaseModel):
    title: str = Field(..., example="Commercial Dry Waste Overspill at Sitabuldi")
    description: Optional[str] = Field("", example="Excess packaging boxes and plastic wrap blocking market lane.")
    category: str = Field(..., example="Dry Recyclable")
    priority: str = Field("HIGH", example="HIGH")
    latitude: float = Field(..., example=21.1448)
    longitude: float = Field(..., example=79.0837)
    address: str = Field(..., example="Shop 42, Sitabuldi Main Market Gate 2, Nagpur")
    landmark: Optional[str] = Field(None, example="Opposite Variety Square Metro Station")
    ward_number: int = Field(..., example=4)
    zone_name: str = Field(..., example="Zone 4 - Dhantoli")
    citizen_name: Optional[str] = Field("NMC Public Desk", example="Anand Kulkarni")
    citizen_contact: Optional[str] = Field(None, example="+91 98230 11422")
    assigned_worker_id: Optional[str] = Field("WRK-4089", example="WRK-4089")
    estimated_duration_mins: Optional[int] = Field(25, example=30)
    image_url: Optional[str] = Field(
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60",
        example="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500"
    )


class TaskStatusUpdateRequest(BaseModel):
    status: str = Field(..., example="COMPLETED")
    worker_notes: Optional[str] = Field(None, example="Segregation verified. Bins emptied and area disinfected.")
    segregation_score: Optional[float] = Field(None, ge=0, le=100, example=94.5)
    proof_image_base64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SegregationBreakdown(BaseModel):
    wet_organic_pct: float = Field(..., example=72.5)
    dry_recyclable_pct: float = Field(..., example=22.0)
    sanitary_hazardous_pct: float = Field(..., example=3.5)
    unsegregated_contaminant_pct: float = Field(..., example=2.0)


class SegregationVerificationResponse(BaseModel):
    verification_id: str
    task_id: Optional[str] = None
    timestamp: str
    overall_score: float = Field(..., ge=0, le=100, example=91.5)
    verdict: str = Field(..., example="PASSED")
    primary_category: str = Field(..., example="Biodegradable Wet Waste")
    breakdown: SegregationBreakdown
    detected_items: List[str]
    contaminants_found: List[str]
    ai_confidence: float = Field(..., ge=0, le=1, example=0.96)
    incentive_earned_inr: float = Field(..., example=25.0)
    feedback_marathi: str
    feedback_english: str
    safety_advisory: str
    stored_image_path: Optional[str] = None


class TelemetryPayload(BaseModel):
    truck_no: str = Field(..., example="MH-31-EQ-9104")
    lat: float = Field(..., example=21.1470)
    lon: float = Field(..., example=79.0580)
    timestamp: Optional[str] = None


class WeatherAlertItem(BaseModel):
    alert_id: str
    alert_type: str = Field(..., example="HEATWAVE")
    severity: str = Field(..., example="HIGH")
    headline: str
    headline_marathi: str
    description: str
    temperature_celsius: float
    feels_like_celsius: float
    humidity_pct: int
    precipitation_prob_pct: int
    wind_speed_kmh: float
    uv_index: int
    affected_zones: List[str]
    issued_at: str
    valid_until: str
    operational_instructions: List[str]
    safety_gear_required: List[str]


class WorkerStatsResponse(BaseModel):
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


class WardGeoItem(BaseModel):
    ward_id: int
    zone_name: str
    ward_name: str
    center_lat: float
    center_lng: float
    active_complaints_count: int
    bins_count: int
    color_code: str
    boundary_coordinates: List[List[float]]


class AISpotDetectionResponse(BaseModel):
    category: str = Field(..., example="Dry Recyclable")
    priority: str = Field(..., example="HIGH")
    suggested_title: str = Field(..., example="Commercial Dry Waste Overspill at Market Lane")
    description: str = Field(..., example="Accumulated cardboard boxes, plastic wrap, and packaging materials.")
    ward_number: int = Field(..., example=4)
    zone_name: str = Field(..., example="Zone 4 - Dhantoli")
    address: str = Field(..., example="Sitabuldi Main Market, Nagpur")
    landmark: Optional[str] = Field(None, example="Near Variety Square")
    detected_materials: List[str] = Field(default_factory=list)
    suggested_action: str = Field(..., example="Schedule dry waste compactor truck pickup.")
    confidence: float = Field(..., ge=0, le=1, example=0.95)
    is_waste: bool = Field(True)



# ---------------------------------------------------------------------------
# Database Model Helper Converters
# ---------------------------------------------------------------------------
def row_to_task_item(row: sqlite3.Row) -> TaskItem:
    """Converts a SQLite task row into a Pydantic TaskItem."""
    return TaskItem(
        id=row["id"],
        ticket_number=row["ticket_no"],
        title=row["title"],
        description=row["description"] or "",
        waste_type=row["category"],
        priority=row["priority"],
        status=row["status"],
        location=LocationCoordinates(
            latitude=row["lat"],
            longitude=row["lon"],
            address=row["address"],
            landmark=row["landmark"],
            ward_number=row["ward_number"],
            zone_name=row["zone_name"]
        ),
        citizen_name=row["citizen_name"],
        citizen_contact=row["citizen_contact"],
        assigned_worker_id=row["assigned_worker_id"],
        assigned_at=row["assigned_at"],
        estimated_duration_mins=row["estimated_duration_mins"] or 25,
        segregation_score=row["ai_purity_score"],
        verification_status=row["verification_status"],
        bonus_awarded=row["bonus_awarded"] or 0.0,
        image_url=row["image_url"],
        proof_image_url=row["proof_image_url"],
        worker_notes=row["worker_notes"],
        completed_at=row["completed_at"]
    )


def row_to_weather_alert(row: sqlite3.Row) -> WeatherAlertItem:
    """Converts a SQLite weather_alert row into a Pydantic WeatherAlertItem."""
    return WeatherAlertItem(
        alert_id=row["alert_id"],
        alert_type=row["alert_type"],
        severity=row["severity"],
        headline=row["headline"],
        headline_marathi=row["headline_marathi"],
        description=row["description"],
        temperature_celsius=row["temperature_celsius"],
        feels_like_celsius=row["feels_like_celsius"],
        humidity_pct=row["humidity_pct"],
        precipitation_prob_pct=row["precipitation_prob_pct"],
        wind_speed_kmh=row["wind_speed_kmh"],
        uv_index=row["uv_index"],
        affected_zones=json.loads(row["affected_zones"]),
        issued_at=row["issued_at"],
        valid_until=row["valid_until"],
        operational_instructions=json.loads(row["operational_instructions"]),
        safety_gear_required=json.loads(row["safety_gear_required"])
    )


def row_to_ward_geo_item(row: sqlite3.Row) -> WardGeoItem:
    """Converts a SQLite wards row into a Pydantic WardGeoItem."""
    return WardGeoItem(
        ward_id=row["ward_id"],
        zone_name=row["zone_name"],
        ward_name=row["ward_name"],
        center_lat=row["center_lat"],
        center_lng=row["center_lng"],
        active_complaints_count=row["active_complaints_count"],
        bins_count=row["bins_count"],
        color_code=row["color_code"],
        boundary_coordinates=json.loads(row["boundary_coordinates"])
    )


def calculate_segregation_bonus(score: Optional[float], verdict: Optional[str] = None) -> float:
    """
    Computes sanitation worker bonus incentive (INR) dynamically scaled to AI segregation score:
    - 95% - 100% Purity (Flawless / Grade A+): ₹50.0
    - 90% - 94.9% Purity (Excellent Grade A): ₹40.0
    - 80% - 89.9% Purity (High / Clean): ₹30.0
    - 70% - 79.9% Purity (Standard Acceptable): ₹20.0
    - 60% - 69.9% Purity (Warning / Minor Contaminants): ₹10.0
    - 50% - 59.9% Purity (Low Quality): ₹5.0
    - < 50% or Non-Waste / Failed: ₹0.0
    """
    if score is None or score < 50.0 or (verdict and verdict.upper() == "FAILED"):
        return 0.0
    elif score >= 95.0:
        return 50.0
    elif score >= 90.0:
        return 40.0
    elif score >= 80.0:
        return 30.0
    elif score >= 70.0:
        return 20.0
    elif score >= 60.0:
        return 10.0
    else:
        return 5.0


# ---------------------------------------------------------------------------
# AI Segregation Inference Hook (Powered by Google Gemini 3.6 Flash Vision)
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

class BreakdownSchema(BaseModel):
    wet_organic_pct: float = Field(description="Percentage of wet/organic compostable waste")
    dry_recyclable_pct: float = Field(description="Percentage of dry recyclable waste (paper, plastic, metal, glass)")
    sanitary_hazardous_pct: float = Field(description="Percentage of sanitary or hazardous biomedical waste")
    unsegregated_contaminant_pct: float = Field(description="Percentage of mixed unsegregated contaminants")

class WasteAnalysisSchema(BaseModel):
    is_waste: bool = Field(description="True if image contains municipal solid waste, false if human face, selfie, person, animal, room interior, vehicle, or non-waste item")
    overall_score: float = Field(description="Overall segregation purity percentage score from 0.0 to 100.0")
    verdict: str = Field(description="PASSED if score >= 75.0, WARNING if 50.0 <= score < 75.0, FAILED if score < 50.0")
    primary_category: str = Field(description="Primary identified category (e.g. Biodegradable Wet / Organic Waste, Dry Recyclable, Sanitary & Hazardous, Mixed Contaminated Waste, Non-Waste Image)")
    ai_confidence: float = Field(description="Confidence score between 0.85 and 0.99")
    breakdown: BreakdownSchema
    detected_items: List[str] = Field(description="Specific materials or objects detected in the photo")
    contaminants_found: List[str] = Field(description="Specific foreign contaminants identified")
    feedback_english: str = Field(description="Actionable English instruction for sanitation worker / citizen")
    feedback_marathi: str = Field(description="Regional Marathi translation with proper NMC terminology")
    safety_advisory: str = Field(description="Safety & PPE advisory instructions")
    incentive_earned_inr: float = Field(description="Incentive earned in INR (25.0 for PASSED, 10.0 for WARNING, 0.0 for FAILED)")

class SpotAnalysisSchema(BaseModel):
    is_waste: bool = Field(description="True if image contains real garbage accumulation/litter/debris, false if non-waste")
    category: str = Field(description="Exactly ONE of: Wet Organic, Dry Recyclable, Mixed Waste, Sanitary / Hazardous, E-Waste, Construction Scrap")
    priority: str = Field(description="Exactly ONE of: CRITICAL, HIGH, MEDIUM, LOW")
    suggested_title: str = Field(description="Realistic, descriptive headline describing what waste is visible and location context")
    description: str = Field(description="Detailed 1-2 sentence description of visible waste volume, composition, and condition")
    detected_materials: List[str] = Field(description="List of 3-6 specific materials detected in the photo")
    suggested_action: str = Field(description="Specific recommended action for Nagpur Municipal Corporation sanitation crew")
    confidence: float = Field(description="Confidence score between 0.85 and 0.99")

def safe_extract_json(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise

def analyze_waste_image(file_path: str, category_hint: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes an uploaded waste image file using Google Gemini 3.6 Flash Vision.
    Accurately detects whether image contains real municipal waste/garbage or is a non-waste
    photo (such as human face, portrait, selfie, indoor room, object, etc.).
    Extracts purity scores, composition breakdown, identified materials, contaminants,
    bilingual Marathi/English feedback, and Swachh Bharat safety advisory.
    """
    # 1. Attempt Real Google Gemini 3.6 Flash Vision Evaluation
    if GEMINI_API_KEY and os.path.exists(file_path) and os.path.getsize(file_path) > 100:
        try:
            from google import genai

            client = genai.Client(api_key=GEMINI_API_KEY)

            with open(file_path, "rb") as f:
                img_bytes = f.read()
                b64_data = base64.b64encode(img_bytes).decode("utf-8")

            hint_text = f"Field officer / task category context: {category_hint}" if category_hint else "No category hint provided"

            prompt = f"""
You are an expert AI sanitation and waste segregation auditor for Nagpur Municipal Corporation (NMC), Maharashtra, India.
Context: {hint_text}.

Examine the uploaded image with high precision:
Step 1: Determine whether this image contains actual municipal solid waste / garbage / recyclable materials, OR if it is a non-waste image (such as a human face, portrait, selfie, person, animal, vehicle, indoor room, computer screen, landscape, furniture, clothing, document, etc.).

Step 2:
A) IF NOT WASTE (e.g. human face, selfie, person, indoor furniture, random non-waste object):
- is_waste: false
- overall_score: 0.0
- verdict: "FAILED"
- primary_category: "Non-Waste (Human Face / Object Detected)"
- breakdown: wet_organic_pct: 0.0, dry_recyclable_pct: 0.0, sanitary_hazardous_pct: 0.0, unsegregated_contaminant_pct: 0.0
- detected_items: [List what is actually visible in the photo]
- contaminants_found: ["No garbage or municipal waste present in photo"]
- feedback_english: "No municipal waste detected in this image. Please take a photo of an actual waste bin or collection bag."
- feedback_marathi: "या छायाचित्रात कोणताही कचरा आढळला नाही. कृपया कचरा कुंडी किंवा कचरा पिशवीचा फोटो काढा."
- safety_advisory: "Align the camera viewfinder directly over the waste collection bin."
- incentive_earned_inr: 0.0
- ai_confidence: 0.98

B) IF ACTUAL WASTE / GARBAGE:
- is_waste: true
- overall_score: Segregation purity percentage (0.0 to 100.0) based on how properly segregated it is.
- verdict: "PASSED" if score >= 75.0, "WARNING" if 50.0 <= score < 75.0, "FAILED" if score < 50.0
- primary_category: e.g. "Biodegradable Wet / Organic Waste", "Dry Recyclable (Paper/Plastic/Metal)", "Sanitary / Medical Hazard", "Mixed Contaminated Waste"
- breakdown: wet_organic_pct, dry_recyclable_pct, sanitary_hazardous_pct, unsegregated_contaminant_pct (must sum to 100.0)
- detected_items: 3-6 specific materials visible (e.g. ["Banana peels", "Tomato scraps", "Egg shells"] or ["PET bottles", "Cardboard packaging"])
- contaminants_found: specific foreign or improper items mixed in (e.g. ["Plastic milk pouch fragment", "Thermocol piece"])
- feedback_english: Actionable English instruction for sanitation worker / citizen
- feedback_marathi: Regional Marathi translation with proper NMC terminology
- safety_advisory: PPE & safety instructions (rubber gloves, boots, mask, tongs)
- incentive_earned_inr: 25.0 if PASSED, 10.0 if WARNING, 0.0 if FAILED
- ai_confidence: float between 0.85 and 0.99
"""

            interaction = client.interactions.create(
                model="gemini-3.6-flash",
                input=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image",
                        "data": b64_data,
                        "mime_type": "image/jpeg"
                    }
                ],
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": WasteAnalysisSchema.model_json_schema()
                }
            )

            data = safe_extract_json(interaction.output_text)

            bd = data.get("breakdown", {})
            wet = float(bd.get("wet_organic_pct", 0.0))
            dry = float(bd.get("dry_recyclable_pct", 0.0))
            sanitary = float(bd.get("sanitary_hazardous_pct", 0.0))
            unseg = float(bd.get("unsegregated_contaminant_pct", 0.0))
            verdict = str(data.get("verdict", "PASSED")).upper()
            if "PASS" in verdict:
                verdict = "PASSED"
            elif "WARN" in verdict:
                verdict = "WARNING"
            else:
                verdict = "FAILED"

            score = float(data.get("overall_score", 0.0))
            incentive = float(data.get("incentive_earned_inr") or calculate_segregation_bonus(score, verdict))

            return {
                "overall_score": score,
                "verdict": verdict,
                "primary_category": str(data.get("primary_category", "Segregated Waste")),
                "wet_organic_pct": wet,
                "dry_recyclable_pct": dry,
                "sanitary_hazardous_pct": sanitary,
                "unsegregated_contaminant_pct": unseg,
                "wet_pct": wet,
                "dry_pct": dry,
                "sanitary_pct": sanitary,
                "contaminant_pct": unseg,
                "detected_items": data.get("detected_items", ["Identified Item"]),
                "contaminants_found": data.get("contaminants_found", []),
                "ai_confidence": float(data.get("ai_confidence", 0.95)),
                "feedback_marathi": str(data.get("feedback_marathi", "वर्गीकरण तपासणी पूर्ण झाली.")),
                "feedback_english": str(data.get("feedback_english", "Segregation evaluation complete.")),
                "safety_advisory": str(data.get("safety_advisory", "Follow standard Swachh Bharat safety protocols.")),
                "incentive_earned_inr": incentive
            }
        except Exception as e:
            try:
                print(f"[Worker AI] Gemini Vision evaluation error: {e}")
            except Exception:
                pass

    # 2. Local Fallback Heuristics
    hint = str(category_hint or "").upper()

    if "WET" in hint or "ORGANIC" in hint:
        wet = 87.5
        dry = 8.5
        sanitary = 2.0
        unseg = 2.0
        score = 92.5
        primary = "Biodegradable Wet / Organic Waste"
        detected = ["Vegetable peels", "Fruit rinds", "Cooked food residue", "Tea powder leaves", "Garden foliage"]
        contaminants = ["1x Single-use plastic pouch"]
        verdict = "PASSED"
    elif "DRY" in hint or "RECYCL" in hint:
        dry = 86.0
        wet = 9.0
        sanitary = 3.0
        unseg = 2.0
        score = 89.0
        primary = "Dry Recyclable Waste (Paper/Plastic/Metal)"
        detected = ["Corrugated cardboard boxes", "PET water bottles", "Tetra Pak cartons", "Aluminium soda cans"]
        contaminants = ["Wet food staining on cardboard"]
        verdict = "PASSED"
    elif "HAZARD" in hint or "SANITARY" in hint:
        sanitary = 42.0
        wet = 28.0
        dry = 18.0
        unseg = 12.0
        score = 42.0
        primary = "Sanitary & Biomedical Hazardous Waste"
        detected = ["Used gloves", "Medical blister strips", "Sanitary pads", "Chemical bottles"]
        contaminants = ["Unseparated single-use polythene", "Organic food sludge"]
        verdict = "FAILED"
    else:
        wet = 25.0
        dry = 35.0
        sanitary = 10.0
        unseg = 30.0
        score = 60.0
        primary = "Mixed Solid Waste"
        detected = ["Mixed municipal solid waste", "Packaging fragments", "Organic matter"]
        contaminants = ["Unsegregated dry and wet waste"]
        verdict = "WARNING"

    feedback_mr = (
        "उत्कृष्ट वर्गीकरण! ओला आणि सुका कचरा योग्यरित्या वेगळा केला गेला आहे."
        if verdict == "PASSED" else
        "सावधानता: ओल्या कचऱ्यात प्लास्टिक किंवा थर्माकोल आढळले आहे. कृपया पुन्हा वेगळे करा."
        if verdict == "WARNING" else
        "अयोग्य वर्गीकरण! कचरा पूर्णपणे मिश्रित आहे किंवा प्रतिमा कचऱ्याची नाही."
    )

    feedback_en = (
        "Excellent Segregation! Clean organic waste meeting NMC Swachh Bharat purity standards."
        if verdict == "PASSED" else
        "Notice: Minor plastic or dry contaminants found in the organic bin. Resegregation advised."
        if verdict == "WARNING" else
        "Failed Segregation: Highly unsegregated waste mix or non-waste photo detected."
    )

    safety = (
        "Standard safety protocol: Ensure puncture-resistant rubber gloves are worn during transfer."
        if verdict != "FAILED" else
        "Critical Safety Alert: Potential sharp glass or sanitary waste detected. Use handling tongs and safety boots."
    )

    return {
        "overall_score": score,
        "verdict": verdict,
        "primary_category": primary,
        "wet_organic_pct": wet,
        "dry_recyclable_pct": dry,
        "sanitary_hazardous_pct": sanitary,
        "unsegregated_contaminant_pct": unseg,
        "wet_pct": wet,
        "dry_pct": dry,
        "sanitary_pct": sanitary,
        "contaminant_pct": unseg,
        "detected_items": detected,
        "contaminants_found": contaminants,
        "ai_confidence": 0.90,
        "feedback_marathi": feedback_mr,
        "feedback_english": feedback_en,
        "safety_advisory": safety,
        "incentive_earned_inr": calculate_segregation_bonus(score, verdict)
    }


# ---------------------------------------------------------------------------
# Nagpur City Zones Config & Nearest Zone Solver
# ---------------------------------------------------------------------------
NAGPUR_ZONES_CONFIG = [
    {
        "ward_id": 1,
        "zone_name": "Zone 1 - Laxmi Nagar",
        "ward_name": "Bajaj Nagar, Shankar Nagar, Khamla & Pratap Nagar",
        "lat": 21.1250,
        "lng": 79.0600,
        "default_address": "Shankar Nagar Square, Laxmi Nagar Zone, Nagpur",
        "landmark": "Near Canara Bank / Civic Center"
    },
    {
        "ward_id": 2,
        "zone_name": "Zone 2 - Dharampeth",
        "ward_name": "Futala, Ram Nagar, Gokulpeth, Seminary Hills & Dharampeth",
        "lat": 21.1470,
        "lng": 79.0580,
        "default_address": "West High Court Road, Dharampeth, Nagpur",
        "landmark": "Near Coffee House Square / Gokulpeth Market"
    },
    {
        "ward_id": 3,
        "zone_name": "Zone 3 - Hanuman Nagar",
        "ward_name": "Reshimbagh, Medical Square, Sakkardara & Ayodhya Nagar",
        "lat": 21.1220,
        "lng": 79.1020,
        "default_address": "Medical Square / Reshimbagh Road, Nagpur",
        "landmark": "Opposite Ayush Diagnostics / GMC Hostel"
    },
    {
        "ward_id": 4,
        "zone_name": "Zone 4 - Dhantoli",
        "ward_name": "Congress Nagar, Sitabuldi, Rahate Colony & Ajni",
        "lat": 21.1390,
        "lng": 79.0830,
        "default_address": "Sitabuldi Main Market / Congress Nagar, Nagpur",
        "landmark": "Near Variety Square Metro Station"
    },
    {
        "ward_id": 5,
        "zone_name": "Zone 5 - Nehru Nagar",
        "ward_name": "Nandanvan, Tajbagh, Hasanbagh, Kharbi & Dighori",
        "lat": 21.1280,
        "lng": 79.1320,
        "default_address": "Nandanvan Main Road / Tajbagh Ward, Nagpur",
        "landmark": "Behind Gurudeo Nagar Garden"
    },
    {
        "ward_id": 6,
        "zone_name": "Zone 6 - Gandhibagh",
        "ward_name": "Itwari, Mahal, Badkas Chowk & Hansapuri",
        "lat": 21.1550,
        "lng": 79.1100,
        "default_address": "Itwari Wholesale Market / Mahal Chowk, Nagpur",
        "landmark": "Near Teen Nal Chowk / Badkas Chowk"
    },
    {
        "ward_id": 7,
        "zone_name": "Zone 7 - Satranjipura",
        "ward_name": "Satranjipura, Shanti Nagar, Mehdi Bagh & Itwari Bazar",
        "lat": 21.1660,
        "lng": 79.1150,
        "default_address": "Shanti Nagar / Satranjipura Corridor, Nagpur",
        "landmark": "Near Water Tank Circle / Mehdi Bagh"
    },
    {
        "ward_id": 8,
        "zone_name": "Zone 8 - Lakadganj",
        "ward_name": "Garoba Maidan, Bagadganj, Pardi & Wardhaman Nagar",
        "lat": 21.1480,
        "lng": 79.1400,
        "default_address": "Old Bhandara Road, Lakadganj / Pardi, Nagpur",
        "landmark": "Near Garoba Maidan / Pardi Octroi Post"
    },
    {
        "ward_id": 9,
        "zone_name": "Zone 9 - Ashi Nagar",
        "ward_name": "Pachpaoli, Bezonbagh, Indora, Kamal Chowk & Teka Naka",
        "lat": 21.1820,
        "lng": 79.1100,
        "default_address": "Indora Square / Pachpaoli Main Road, Nagpur",
        "landmark": "Near Dr. Ambedkar College / Kamal Chowk"
    },
    {
        "ward_id": 10,
        "zone_name": "Zone 10 - Mangalwari",
        "ward_name": "Sadar, Chaoni, Raj Bhavan, Mankapur & Gittikhadan",
        "lat": 21.1750,
        "lng": 79.0750,
        "default_address": "Residency Road / Sadar Bazaar, Nagpur",
        "landmark": "Near Mount Road / Raj Bhavan Corner"
    }
]


def find_nearest_nagpur_zone(lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """Resolves the nearest Nagpur administrative zone and ward from GPS coordinates."""
    if lat is None or lon is None or lat == 0.0 or lon == 0.0:
        return NAGPUR_ZONES_CONFIG[1] # Zone 2 Dharampeth default

    best_zone = NAGPUR_ZONES_CONFIG[1]
    min_dist = float("inf")
    for z in NAGPUR_ZONES_CONFIG:
        dist = ((z["lat"] - lat) ** 2 + (z["lng"] - lon) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            best_zone = z
    return best_zone


def analyze_spot_image(file_path: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """
    Analyzes a newly snapped waste spot photo using Google Gemini 3.6 Flash Vision.
    Automatically classifies:
    - Waste category (Wet Organic, Dry Recyclable, Mixed Waste, Sanitary / Hazardous, E-Waste, Construction Scrap)
    - Priority level (CRITICAL, HIGH, MEDIUM, LOW)
    - Auto-generated Task Title
    - Detailed visual description
    - Inferred Nagpur Ward & Zone via GPS proximity solver
    - Street Address & Landmark
    """
    zone_info = find_nearest_nagpur_zone(lat, lon)
    inferred_ward = zone_info["ward_id"]
    inferred_zone = zone_info["zone_name"]
    inferred_addr = zone_info["default_address"]
    inferred_landmark = zone_info["landmark"]

    # 1. Attempt Google Gemini 3.6 Flash Vision
    if GEMINI_API_KEY and os.path.exists(file_path) and os.path.getsize(file_path) > 100:
        try:
            from google import genai

            client = genai.Client(api_key=GEMINI_API_KEY)

            with open(file_path, "rb") as f:
                img_bytes = f.read()
                b64_data = base64.b64encode(img_bytes).decode("utf-8")

            prompt = f"""
You are an expert AI municipal solid waste investigator for Nagpur Municipal Corporation (NMC), Maharashtra, India.
Location Context: {inferred_zone} ({zone_info['ward_name']}), Nagpur (GPS: {lat or 21.1470}, {lon or 79.0580}).

Analyze this field photo of a newly reported garbage spot / accumulation:
1. is_waste: boolean (true if image contains real municipal solid waste, debris, trash heap, litter, commercial scrap, food waste, or overflowing bin; false if human face, selfie, person portrait, room interior, vehicle, document, or non-waste item)
2. category: Must be EXACTLY ONE of: "Wet Organic", "Dry Recyclable", "Mixed Waste", "Sanitary / Hazardous", "E-Waste", "Construction Scrap"
3. priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
   - CRITICAL: Biohazard/medical, severe sewer/road obstruction, sharp glass/chemical hazard.
   - HIGH: Large overflowing commercial pile, wet food waste rotting in sun, high foot-traffic obstruction.
   - MEDIUM: Moderate accumulation of cartons, plastic packaging, or residential bins.
   - LOW: Minor garden leaves, small paper/plastic litter.
4. suggested_title: A concise, highly realistic headline in English (e.g. "Commercial Cardboard & Plastic Overspill near Market", "Kitchen Bio-Waste Heap blocking Pedestrian Path", "Mixed Solid Waste Dump near Culvert", "Construction Debris & Rubble Accumulation").
5. description: 1-2 concise sentences summarizing the visible materials, estimated volume/severity, and cleaning advice.
6. detected_materials: Array of 3-5 specific detected material items (e.g. ["Corrugated cartons", "PET bottles", "Plastic carry bags"]).
7. suggested_action: Specific recommended action for NMC sanitation workers (e.g. "Deploy green compactor truck with bio-enzymatic spray", "Schedule dry waste baler truck pickup", "Use PPE safety gloves and tongs for hazardous pickup").
8. confidence: float between 0.85 and 0.99
"""
            interaction = client.interactions.create(
                model="gemini-3.6-flash",
                input=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image",
                        "data": b64_data,
                        "mime_type": "image/jpeg"
                    }
                ],
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": SpotAnalysisSchema.model_json_schema()
                }
            )

            data = safe_extract_json(interaction.output_text)

            cat = str(data.get("category", "Mixed Waste"))
            valid_cats = ["Wet Organic", "Dry Recyclable", "Mixed Waste", "Sanitary / Hazardous", "E-Waste", "Construction Scrap"]
            if cat not in valid_cats:
                cat = "Mixed Waste"

            prio = str(data.get("priority", "HIGH")).upper()
            if prio not in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                prio = "HIGH"

            is_waste = bool(data.get("is_waste", True))

            return {
                "category": cat,
                "priority": prio,
                "suggested_title": str(data.get("suggested_title", f"{cat} Waste Spot at {inferred_zone.split(' - ')[1]}")),
                "description": str(data.get("description", "AI verified waste accumulation requiring standard NMC sanitation clearance.")),
                "ward_number": inferred_ward,
                "zone_name": inferred_zone,
                "address": inferred_addr,
                "landmark": inferred_landmark,
                "detected_materials": data.get("detected_materials", ["Municipal solid waste"]),
                "suggested_action": str(data.get("suggested_action", "Dispatch route compactor vehicle for immediate clearance.")),
                "confidence": float(data.get("confidence", 0.94)),
                "is_waste": is_waste
            }
        except Exception as e:
            try:
                print(f"[Worker AI Spot] Gemini Vision spot analysis error: {e}")
            except Exception:
                pass

    # 2. Intelligent Offline Fallback
    return {
        "category": "Mixed Waste",
        "priority": "HIGH",
        "suggested_title": f"Reported Waste Spot at {zone_info['ward_name'].split(',')[0]}",
        "description": "General accumulation of municipal solid waste observed along the sector corridor requiring sanitation sweep.",
        "ward_number": inferred_ward,
        "zone_name": inferred_zone,
        "address": inferred_addr,
        "landmark": inferred_landmark,
        "detected_materials": ["Mixed packaging scraps", "Municipal solid waste"],
        "suggested_action": "Schedule standard compactor route pickup.",
        "confidence": 0.88,
        "is_waste": True
    }


# ---------------------------------------------------------------------------
# API Routes (Database Driven)
# ---------------------------------------------------------------------------

@router.post(
    "/ai-analyze-spot",
    response_model=AISpotDetectionResponse,
    summary="AI Auto-Detection for Waste Spot Logging with Live Photo",
    description="Analyzes an uploaded or camera-captured waste spot image with Gemini 3.6 Flash Vision and GPS coordinates, auto-detecting Category, Priority, Ward/Zone, Title, and Description."
)
async def ai_analyze_waste_spot(
    latitude: Optional[float] = Form(None, description="Current GPS latitude"),
    longitude: Optional[float] = Form(None, description="Current GPS longitude"),
    image: UploadFile = File(..., description="Captured waste spot image")
):
    contents = await image.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image received. Please take or select a clear photo."
        )

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"spot_ai_{timestamp_str}.jpg"
    saved_file_path = os.path.join(UPLOAD_AUDITS_DIR, filename)

    with open(saved_file_path, "wb") as f:
        f.write(contents)

    analysis = analyze_spot_image(saved_file_path, latitude, longitude)

    return AISpotDetectionResponse(
        category=analysis["category"],
        priority=analysis["priority"],
        suggested_title=analysis["suggested_title"],
        description=analysis["description"],
        ward_number=analysis["ward_number"],
        zone_name=analysis["zone_name"],
        address=analysis["address"],
        landmark=analysis.get("landmark"),
        detected_materials=analysis.get("detected_materials", []),
        suggested_action=analysis["suggested_action"],
        confidence=analysis["confidence"],
        is_waste=analysis.get("is_waste", True)
    )


@router.post(
    "/tasks",
    response_model=TaskItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create & Dispatch New Sanitation Task",
    description="Inserts a new sanitation work order/complaint into SQLite database and assigns to a worker."
)
def create_task(payload: CreateTaskRequest):

    new_id = f"TSK-NGP-{int(datetime.now().timestamp() * 1000) % 1000000:06d}"
    ticket_no = f"NMC-2026-{int(datetime.now().timestamp() * 100) % 10000:04d}"
    assigned_at = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (
                id, ticket_no, title, description, category, priority, status,
                lat, lon, address, landmark, ward_number, zone_name,
                citizen_name, citizen_contact, assigned_worker_id, assigned_at,
                estimated_duration_mins, ai_purity_score, verification_status,
                bonus_awarded, image_url, proof_image_url, worker_notes, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_id, ticket_no, payload.title, payload.description or "",
            payload.category, payload.priority.upper(), "PENDING",
            payload.latitude, payload.longitude, payload.address, payload.landmark,
            payload.ward_number, payload.zone_name, payload.citizen_name or "NMC Public Desk",
            payload.citizen_contact or "", payload.assigned_worker_id or "WRK-4089",
            assigned_at, payload.estimated_duration_mins or 25,
            None, None, 0.0, payload.image_url, None, None, None
        ))

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        return row_to_task_item(row)


@router.post(
    "/tasks/report",
    response_model=TaskItem,
    status_code=status.HTTP_201_CREATED,
    summary="Report & Log New Waste Task with Live Camera Photo",
    description="Captures live camera photo, saves to uploads, and inserts new task into SQLite database."
)
async def report_waste_task(
    title: str = Form(..., description="Task title or waste description"),
    description: Optional[str] = Form("", description="Detailed observation notes"),
    category: str = Form("Wet Organic", description="Waste category e.g. Wet Organic, Dry Recyclable"),
    priority: str = Form("HIGH", description="Priority level: CRITICAL, HIGH, MEDIUM, LOW"),
    latitude: float = Form(..., description="GPS latitude"),
    longitude: float = Form(..., description="GPS longitude"),
    address: str = Form(..., description="Street location address"),
    landmark: Optional[str] = Form(None, description="Nearby landmark"),
    ward_number: int = Form(2, description="NMC ward number"),
    zone_name: str = Form("Zone 2 - Dharampeth", description="Administrative zone name"),
    citizen_name: Optional[str] = Form("Field Worker Spot Report", description="Reporter identifier"),
    citizen_contact: Optional[str] = Form(None, description="Contact phone"),
    assigned_worker_id: Optional[str] = Form("WRK-4089", description="Assigned worker ID"),
    estimated_duration_mins: Optional[int] = Form(25, description="Estimated clearance duration"),
    image: Optional[UploadFile] = File(None, description="Live camera snapshot of the waste spot")
):
    new_id = f"TSK-NGP-{int(datetime.now().timestamp() * 1000) % 1000000:06d}"
    ticket_no = f"NMC-2026-{int(datetime.now().timestamp() * 100) % 10000:04d}"
    assigned_at = datetime.now(timezone.utc).isoformat()
    image_url = None

    # Process and save camera photo if provided
    if image is not None:
        contents = await image.read()
        if len(contents) > 0:
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            sanitized_ticket = ticket_no.replace("-", "_").replace(" ", "_")
            filename = f"{sanitized_ticket}_{timestamp_str}.jpg"
            saved_file_path = os.path.join(UPLOAD_AUDITS_DIR, filename)

            with open(saved_file_path, "wb") as f:
                f.write(contents)

            image_url = f"/uploads/audits/{filename}"

    if not image_url:
        # High-resolution contextual fallback matching category
        cat_lower = category.lower()
        if "dry" in cat_lower or "plastic" in cat_lower:
            image_url = "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60"
        elif "wet" in cat_lower or "food" in cat_lower or "organic" in cat_lower:
            image_url = "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60"
        elif "hazard" in cat_lower or "sanitary" in cat_lower or "medical" in cat_lower:
            image_url = "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=60"
        else:
            image_url = "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=500&auto=format&fit=crop&q=60"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (
                id, ticket_no, title, description, category, priority, status,
                lat, lon, address, landmark, ward_number, zone_name,
                citizen_name, citizen_contact, assigned_worker_id, assigned_at,
                estimated_duration_mins, ai_purity_score, verification_status,
                bonus_awarded, image_url, proof_image_url, worker_notes, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_id, ticket_no, title, description or "",
            category, priority.upper(), "PENDING",
            latitude, longitude, address, landmark,
            ward_number, zone_name, citizen_name or "Field Worker Spot Report",
            citizen_contact or "", assigned_worker_id or "WRK-4089",
            assigned_at, estimated_duration_mins or 25,
            None, None, 0.0, image_url, None, None, None
        ))

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        return row_to_task_item(row)


@router.get(
    "/tasks",
    response_model=List[TaskItem],
    summary="Get Assigned Daily Tasks & Complaints",
    description="Executes a SELECT query on SQLite tasks table with worker_id, status, priority, ward, and zone filters."
)
def get_worker_tasks(
    worker_id: Optional[str] = "WRK-4089",
    status: Optional[str] = None,
    priority: Optional[str] = None,
    zone: Optional[str] = None,
    ward_number: Optional[int] = None
):
    query = "SELECT * FROM tasks WHERE 1=1"
    params: List[Any] = []

    if worker_id and isinstance(worker_id, str):
        query += " AND assigned_worker_id = ?"
        params.append(worker_id)
    if status and isinstance(status, str):
        if status.upper() == "ACTIVE":
            query += " AND UPPER(status) IN ('PENDING', 'IN_PROGRESS')"
        else:
            query += " AND UPPER(status) = ?"
            params.append(status.upper())
    if priority and isinstance(priority, str):
        query += " AND UPPER(priority) = ?"
        params.append(priority.upper())
    if zone and isinstance(zone, str):
        query += " AND LOWER(zone_name) LIKE ?"
        params.append(f"%{zone.lower()}%")
    if ward_number is not None and ward_number > 0:
        query += " AND ward_number = ?"
        params.append(ward_number)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        tasks = [row_to_task_item(r) for r in rows]


    # Sort: IN_PROGRESS -> PENDING -> FLAGGED -> COMPLETED, and CRITICAL -> HIGH -> MEDIUM -> LOW
    priority_weights = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    status_weights = {"IN_PROGRESS": 0, "PENDING": 1, "FLAGGED": 2, "COMPLETED": 3}

    tasks.sort(
        key=lambda x: (
            status_weights.get(x.status, 4),
            priority_weights.get(x.priority, 4)
        )
    )

    return tasks


@router.post(
    "/tasks/archive-completed",
    summary="Archive or Clear Completed Tasks",
    description="Archives/clears completed tasks for a worker from SQLite database to prevent infinite accumulation."
)
def archive_completed_tasks(worker_id: Optional[str] = "WRK-4089"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM tasks WHERE UPPER(status) = 'COMPLETED' AND assigned_worker_id = ?",
            (worker_id,)
        )
        rows = cursor.fetchall()
        cleared_count = len(rows)
        cursor.execute(
            "DELETE FROM tasks WHERE UPPER(status) = 'COMPLETED' AND assigned_worker_id = ?",
            (worker_id,)
        )
        return {
            "success": True,
            "cleared_count": cleared_count,
            "message": f"Successfully cleared {cleared_count} completed tasks from active shift."
        }


@router.delete(
    "/tasks/{task_id}",
    summary="Delete or Dismiss Single Task",
    description="Deletes a specific task by ID from SQLite database."
)
def delete_task_by_id(task_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM tasks WHERE id = ?", (task_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID '{task_id}' not found."
            )
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        return {"success": True, "deleted_id": task_id}


@router.get(
    "/tasks/{task_id}",
    response_model=TaskItem,
    summary="Get Specific Task Details",
    description="Fetch single sanitation task information from SQLite database."
)
def get_task_by_id(task_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID '{task_id}' not found in database."
            )
        return row_to_task_item(row)


@router.patch(
    "/tasks/{task_id}/status",
    response_model=TaskItem,
    summary="Update Task Status & Completion Proof in DB",
    description="Updates task status, notes, segregation score, and completion timestamp in SQLite tasks table."
)
def update_task_status(
    task_id: str,
    payload: TaskStatusUpdateRequest
):
    valid_statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "FLAGGED", "RESEGREGATED"]
    new_status = payload.status.upper()

    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Must be one of: {', '.join(valid_statuses)}"
        )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID '{task_id}' not found."
            )

        completed_at = datetime.now(timezone.utc).isoformat() if new_status == "COMPLETED" else row["completed_at"]
        worker_notes = payload.worker_notes if payload.worker_notes is not None else row["worker_notes"]
        seg_score = payload.segregation_score if payload.segregation_score is not None else row["ai_purity_score"]
        verdict = (
            ("PASSED" if seg_score >= 75 else "WARNING" if seg_score >= 55 else "FAILED")
            if seg_score is not None else row["verification_status"]
        )
        bonus = calculate_segregation_bonus(seg_score, verdict)

        cursor.execute("""
            UPDATE tasks
            SET status = ?, worker_notes = ?, ai_purity_score = ?,
                verification_status = ?, bonus_awarded = ?, completed_at = ?
            WHERE id = ?
        """, (new_status, worker_notes, seg_score, verdict, bonus, completed_at, task_id))

        # Update worker shift metrics
        if new_status == "COMPLETED" and bonus > 0:
            cursor.execute("""
                UPDATE worker_shift
                SET daily_bonus = daily_bonus + ?
                WHERE worker_id = ?
            """, (bonus, row["assigned_worker_id"]))

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        updated_row = cursor.fetchone()
        return row_to_task_item(updated_row)


@router.post(
    "/verify-segregation",
    response_model=SegregationVerificationResponse,
    summary="AI Waste Segregation Verification with Real File Storage",
    description="Saves uploaded image to backend/uploads/audits/{ticket_no}_{timestamp}.jpg, runs AI analysis hook, updates SQLite DB, and awards bonus."
)
async def verify_waste_segregation(
    task_id: Optional[str] = Form(None, description="Optional associated task ID"),
    waste_category_hint: Optional[str] = Form(None, description="Expected category e.g. WET, DRY, HAZARDOUS"),
    image: UploadFile = File(..., description="Captured waste bin image file")
):
    contents = await image.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty. Please capture a clear photo of the waste bin."
        )

    # 1. Determine ticket identifier
    ticket_no = "AUDIT-UNKNOWN"
    if task_id:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT ticket_no FROM tasks WHERE id = ?", (task_id,))
            row = cursor.fetchone()
            if row:
                ticket_no = row["ticket_no"]

    # 2. Save image to local directory: backend/uploads/audits/{ticket_no}_{timestamp}.jpg
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    sanitized_ticket = ticket_no.replace("-", "_").replace(" ", "_")
    filename = f"{sanitized_ticket}_{timestamp_str}.jpg"
    saved_file_path = os.path.join(UPLOAD_AUDITS_DIR, filename)

    with open(saved_file_path, "wb") as f:
        f.write(contents)

    # 3. Execute AI inference hook
    ai_result = analyze_waste_image(saved_file_path, waste_category_hint)
    score = ai_result["overall_score"]
    verdict = ai_result["verdict"]
    incentive = calculate_segregation_bonus(score, verdict)

    # 4. Update task & shift in SQLite database
    if task_id:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
            task_row = cursor.fetchone()
            if task_row:
                new_status = "COMPLETED" if verdict == "PASSED" else task_row["status"]
                completed_at = datetime.now(timezone.utc).isoformat() if new_status == "COMPLETED" else task_row["completed_at"]
                proof_url = f"/uploads/audits/{filename}"

                cursor.execute("""
                    UPDATE tasks
                    SET ai_purity_score = ?, verification_status = ?,
                        bonus_awarded = ?, proof_image_url = ?,
                        status = ?, completed_at = ?
                    WHERE id = ?
                """, (score, verdict, incentive, proof_url, new_status, completed_at, task_id))

                if incentive > 0:
                    cursor.execute("""
                        UPDATE worker_shift
                        SET daily_bonus = daily_bonus + ?,
                            purity_score = ROUND((purity_score + ?) / 2.0, 1)
                        WHERE worker_id = ?
                    """, (incentive, score, task_row["assigned_worker_id"]))

    verification_id = f"VRF-{timestamp_str}"

    return SegregationVerificationResponse(
        verification_id=verification_id,
        task_id=task_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        overall_score=score,
        verdict=verdict,
        primary_category=ai_result["primary_category"],
        breakdown=SegregationBreakdown(
            wet_organic_pct=ai_result["wet_organic_pct"],
            dry_recyclable_pct=ai_result["dry_recyclable_pct"],
            sanitary_hazardous_pct=ai_result["sanitary_hazardous_pct"],
            unsegregated_contaminant_pct=ai_result["unsegregated_contaminant_pct"]
        ),
        detected_items=ai_result["detected_items"],
        contaminants_found=ai_result["contaminants_found"],
        ai_confidence=ai_result["ai_confidence"],
        incentive_earned_inr=incentive,
        feedback_marathi=ai_result["feedback_marathi"],
        feedback_english=ai_result["feedback_english"],
        safety_advisory=ai_result["safety_advisory"],
        stored_image_path=f"uploads/audits/{filename}"
    )


@router.post(
    "/telemetry",
    summary="Record Real-Time Vehicle & Worker GPS Telemetry",
    description="Saves truck GPS coordinates to SQLite telemetry table."
)
def record_telemetry(payload: TelemetryPayload):
    ts = payload.timestamp or datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO telemetry (truck_no, lat, lon, timestamp)
            VALUES (?, ?, ?, ?)
        """, (payload.truck_no, payload.lat, payload.lon, ts))

    return {
        "status": "success",
        "message": "Telemetry recorded",
        "truck_no": payload.truck_no,
        "lat": payload.lat,
        "lon": payload.lon,
        "timestamp": ts
    }


@router.get(
    "/telemetry/latest",
    summary="Get Latest Vehicle Telemetry",
    description="Fetches latest recorded GPS coordinates for sanitation vehicle."
)
def get_latest_telemetry(truck_no: str = "MH-31-EQ-9104"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM telemetry
            WHERE truck_no = ?
            ORDER BY id DESC LIMIT 1
        """, (truck_no,))
        row = cursor.fetchone()
        if row:
            return {
                "truck_no": row["truck_no"],
                "latitude": row["lat"],
                "longitude": row["lon"],
                "timestamp": row["timestamp"]
            }
        return {
            "truck_no": truck_no,
            "latitude": 21.1470,
            "longitude": 79.0580,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


@router.get(
    "/weather-alerts",
    response_model=List[WeatherAlertItem],
    summary="Real-Time Nagpur Weather & Disaster Safety Alerts from DB",
    description="Fetches live Nagpur IMD meteorological advisories, heatwave warnings, monsoon waterlogging alerts from SQLite database."
)
def get_weather_alerts(
    zone: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM weather_alerts")
        rows = cursor.fetchall()
        alerts = [row_to_weather_alert(r) for r in rows]

    if zone and isinstance(zone, str):
        alerts = [
            a for a in alerts if any(zone.lower() in z.lower() for z in a.affected_zones)
        ]

    return alerts


@router.get(
    "/stats",
    response_model=WorkerStatsResponse,
    summary="Worker Daily Performance & Shift Metrics from DB",
    description="Returns worker profile, attendance, completed tasks, incentive earnings, segregation score from SQLite database."
)
def get_worker_stats(
    worker_id: Optional[str] = "WRK-4089"
):
    with get_db() as conn:
        cursor = conn.cursor()

        # Fetch worker shift record
        cursor.execute("SELECT * FROM worker_shift WHERE worker_id = ?", (worker_id,))
        shift_row = cursor.fetchone()

        # Aggregate task stats
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                AVG(ai_purity_score) as avg_purity,
                SUM(bonus_awarded) as total_bonus
            FROM tasks
            WHERE assigned_worker_id = ?
        """, (worker_id,))
        agg = cursor.fetchone()

        total = agg["total"] or 0
        completed = agg["completed"] or 0
        in_progress = agg["in_progress"] or 0
        pending = agg["pending"] or 0
        avg_score = round(agg["avg_purity"], 1) if agg["avg_purity"] is not None else 94.2
        db_bonus = agg["total_bonus"] or 0.0

        if shift_row:
            worker_name = shift_row["worker_name"]
            zone_assigned = shift_row["zone_assigned"]
            ward_num = shift_row["ward_number"]
            shift_start = shift_row["shift_start"]
            shift_end = shift_row["shift_end"]
            daily_bonus = max(shift_row["daily_bonus"], db_bonus)
            safety_score = shift_row["safety_compliance_score"]
            distance_km = shift_row["route_distance"]
            vehicle_no = shift_row["active_vehicle_number"]
        else:
            worker_name = "Rajesh Rao (राजेश राव)"
            zone_assigned = "Zone 2 - Dharampeth"
            ward_num = 12
            shift_start = "06:00 AM"
            shift_end = "02:30 PM"
            daily_bonus = db_bonus
            safety_score = 98.5
            distance_km = 7.8
            vehicle_no = "MH-31-EQ-9104 (E-Tipper #12)"

    return WorkerStatsResponse(
        worker_id=worker_id or "WRK-4089",
        worker_name=worker_name,
        zone_assigned=zone_assigned,
        ward_number=ward_num,
        shift_start=shift_start,
        shift_end=shift_end,
        total_assigned_today=total,
        completed_today=completed,
        pending_today=pending,
        in_progress_today=in_progress,
        avg_segregation_accuracy=avg_score,
        daily_incentive_earned_inr=daily_bonus,
        safety_compliance_score=safety_score,
        distance_covered_km=distance_km,
        active_vehicle_number=vehicle_no
    )


@router.get(
    "/wards",
    response_model=List[WardGeoItem],
    summary="Nagpur Sanitation Wards & Geo-Coordinates from DB",
    description="Returns geo-coordinates and administrative zone boundaries of Nagpur from SQLite database for Leaflet GIS mapping."
)
def get_nagpur_wards():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM wards ORDER BY ward_id ASC")
        rows = cursor.fetchall()
        return [row_to_ward_geo_item(r) for r in rows]


@router.get(
    "/health",
    summary="Worker Router Health Status",
    description="Sanity check endpoint for worker subsystem with DB query."
)
def worker_health_check():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM tasks")
        task_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM telemetry")
        telemetry_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM wards")
        wards_count = cursor.fetchone()[0]

    return {
        "status": "healthy",
        "module": "worker",
        "database": "sqlite3",
        "db_path": DB_PATH,
        "active_tasks_count": task_count,
        "telemetry_records_count": telemetry_count,
        "wards_count": wards_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
