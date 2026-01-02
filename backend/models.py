from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: Optional[str] = None  # Optional for OAuth users
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    terms_accepted_at: Optional[datetime] = None  # When user accepted T&C
    total_badges: int = Field(default=0)
    bio: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    maps: List["Map"] = Relationship(back_populates="creator")
    points: List["Point"] = Relationship(back_populates="user")
    achievements: List["Achievement"] = Relationship(back_populates="user")
    participations: List["MapParticipant"] = Relationship(back_populates="user")
    notifications: List["Notification"] = Relationship(back_populates="user")

class Map(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    type: str # Collaborative/Competitive/Personal
    creator_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    creator: Optional[User] = Relationship(back_populates="maps")
    points: List["Point"] = Relationship(back_populates="map")
    participants: List["MapParticipant"] = Relationship(back_populates="map")
    routes: List["Route"] = Relationship(back_populates="map")

class Point(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    map_id: Optional[int] = Field(default=None, foreign_key="map.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    latitude: float
    longitude: float
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    hidden_at: Optional[datetime] = None  # Set when user leaves, cleared when user rejoins
    
    # New fields
    category: Optional[str] = None # Restaurant, Hotel, etc.
    description: Optional[str] = None
    photo_path: Optional[str] = None
    
    map: Optional[Map] = Relationship(back_populates="points")
    user: Optional[User] = Relationship(back_populates="points")

class Route(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    map_id: Optional[int] = Field(default=None, foreign_key="map.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    start_point_id: int = Field(foreign_key="point.id")
    end_point_id: int = Field(foreign_key="point.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    map: Optional[Map] = Relationship(back_populates="routes")

class MapParticipant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    map_id: Optional[int] = Field(default=None, foreign_key="map.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    role: str = "Collaborator" # Owner/Collaborator
    assigned_color: Optional[str] = None
    
    map: Optional[Map] = Relationship(back_populates="participants")
    user: Optional[User] = Relationship(back_populates="participations")

class Achievement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    type: str # Cities/Countries/Continents
    level: int # Fibonacci
    
    user: Optional[User] = Relationship(back_populates="achievements")

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    type: str  # invite, achievement, etc.
    title: str
    message: str
    data: Optional[str] = None  # JSON string for extra data like map_id
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[User] = Relationship(back_populates="notifications")
