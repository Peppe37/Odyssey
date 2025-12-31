from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    total_badges: int
    bio: Optional[str] = None
    created_at: datetime
    
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Map Schemas ---
class MapBase(BaseModel):
    name: str
    type: str = "Collaborative"  # Collaborative, Competitive, Personal

class MapCreate(MapBase):
    pass

class MapRead(MapBase):
    id: int
    creator_id: int

    class Config:
        from_attributes = True

# --- Point Schemas ---
class PointBase(BaseModel):
    latitude: float
    longitude: float
    category: Optional[str] = None
    description: Optional[str] = None

class PointCreate(PointBase):
    pass

class PointRead(PointBase):
    id: int
    map_id: int
    user_id: int
    latitude: float
    longitude: float
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    timestamp: Optional[datetime] = None
    category: Optional[str] = None
    description: Optional[str] = None
    photo_path: Optional[str] = None

    class Config:
        from_attributes = True

class PointUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None  # Can update by city name
    category: Optional[str] = None
    description: Optional[str] = None

# --- Participant Schemas ---
class ParticipantCreate(BaseModel):
    username: str

class ParticipantRead(BaseModel):
    user_id: int
    username: str
    role: str
    assigned_color: Optional[str] = None

    class Config:
        from_attributes = True
