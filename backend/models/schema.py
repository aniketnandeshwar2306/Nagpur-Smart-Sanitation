"""
Shared DB Models for Nagpur SmartSanitation.
All tables are defined here using SQLModel for type-safe ORM.
"""

import uuid as _uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
  """User account for citizens, workers, and admins."""
  __tablename__ = "users"

  id: str = Field(
  default_factory=lambda: str(_uuid.uuid4()),
  primary_key=True,
  description="Unique user ID (UUID)"
  )
  name: str = Field(..., max_length=100)
  phone: str = Field(..., max_length=20, index=True)
  email: Optional[str] = Field(default=None, max_length=150)
  password_hash: str = Field(..., max_length=255)
  role: str = Field(..., max_length=10, description="citizen | worker | admin")
  ward: str = Field(default="Ward 14 - Dharampeth", max_length=100)
  avatar_url: Optional[str] = Field(default=None, max_length=500)
  vehicle_number: Optional[str] = Field(default=None, max_length=30, description="Workers only")
  zone_assigned: Optional[str] = Field(default=None, max_length=100, description="Workers only")
  is_active: bool = Field(default=True)
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
