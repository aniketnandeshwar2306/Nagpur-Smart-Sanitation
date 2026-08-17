"""
Authentication API router for Nagpur SmartSanitation platform.
MongoDB-backed with bcrypt password hashing and JWT tokens.
Supports: Citizen login/register, Worker login, Admin login, Unified app login.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv

from database import get_db

load_dotenv()

# Config
JWT_SECRET = os.getenv("JWT_SECRET", "nagpur-smart-sanitation-secret-key-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"]
)

# Models
class LoginRequest(BaseModel):
    username: str = Field(..., description="Phone, email, or Employee ID")
    password: str = Field(..., min_length=4)
    role: Optional[Literal["citizen", "worker", "admin"]] = Field(None, description="Optional role filter")

class CitizenRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    ward: str = Field(default="Ward 14 - Dharampeth")
    password: str = Field(..., min_length=4)

class UserProfile(BaseModel):
    id: str
    name: str
    role: Literal["citizen", "worker", "admin"]
    ward: str
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    vehicle_number: Optional[str] = None
    zone_assigned: Optional[str] = None

class AuthResponse(BaseModel):
    status: str = "success"
    message: str
    access_token: str
    token_type: str = "bearer"
    role: Literal["citizen", "worker", "admin"]
    user: UserProfile

# Helpers
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def user_doc_to_profile(user: dict) -> UserProfile:
    return UserProfile(
        id=user.get("id", str(user.get("_id"))),
        name=user.get("name", "User"),
        role=user.get("role", "citizen"),
        ward=user.get("ward", "Ward 14 - Dharampeth"),
        phone=user.get("phone"),
        email=user.get("email"),
        avatar_url=user.get("avatar_url"),
        vehicle_number=user.get("vehicle_number"),
        zone_assigned=user.get("zone_assigned"),
    )

def find_user_by_identifier(db, username: str) -> Optional[dict]:
    """Find a user in MongoDB by phone, email, or user ID."""
    query = {"$or": [{"phone": username}, {"email": username}, {"id": username}]}
    return db.users.find_one(query)

# Routes
@router.post("/login", response_model=AuthResponse)
def unified_login(payload: LoginRequest, db=Depends(get_db)):
    """
    Unified login endpoint (used by web and mobile app).
    Accepts phone, email, or employee ID. Authenticates against MongoDB.
    """
    username = payload.username.strip()
    user = find_user_by_identifier(db, username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this phone/email/ID. Please register first."
        )

    if not verify_password(payload.password.strip(), user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password."
        )

    user_role = user.get("role", "citizen")
    if payload.role and user_role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as '{user_role}', not '{payload.role}'."
        )

    token = create_access_token(user["id"], user_role)
    return AuthResponse(
        message=f"Welcome back, {user['name']}!",
        access_token=token,
        role=user_role,
        user=user_doc_to_profile(user),
    )


@router.post("/citizen/login", response_model=AuthResponse)
def citizen_login(payload: LoginRequest, db=Depends(get_db)):
    """Website citizen login endpoint."""
    payload.role = "citizen"
    return unified_login(payload, db)


@router.post("/worker/login", response_model=AuthResponse)
def worker_login(payload: LoginRequest, db=Depends(get_db)):
    """Website worker login endpoint."""
    payload.role = "worker"
    return unified_login(payload, db)


@router.post("/admin/login", response_model=AuthResponse)
def admin_login(payload: LoginRequest, db=Depends(get_db)):
    """Website admin login endpoint."""
    payload.role = "admin"
    return unified_login(payload, db)


@router.post("/citizen/register", response_model=AuthResponse)
def citizen_register(payload: CitizenRegisterRequest, db=Depends(get_db)):
    """Citizen self-registration endpoint storing user document in MongoDB."""
    phone_clean = payload.phone.strip()

    existing = db.users.find_one({"phone": phone_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists. Please log in."
        )

    if payload.email:
        existing_email = db.users.find_one({"email": payload.email.strip()})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please log in."
            )

    user_doc = {
        "id": f"CIT-{uuid.uuid4().hex[:6].upper()}",
        "name": payload.name.strip(),
        "phone": phone_clean,
        "email": payload.email.strip() if payload.email else None,
        "password_hash": hash_password(payload.password),
        "role": "citizen",
        "ward": payload.ward,
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    db.users.insert_one(user_doc)

    token = create_access_token(user_doc["id"], "citizen")
    return AuthResponse(
        message=f"Registration successful! Welcome to Swachh Nagpur, {user_doc['name']}.",
        access_token=token,
        role="citizen",
        user=user_doc_to_profile(user_doc),
    )


@router.get("/me", response_model=UserProfile)
def get_current_user(token: str = "", db=Depends(get_db)):
    """Get profile for currently authenticated user from JWT token and MongoDB."""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token required")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user_doc_to_profile(user)
