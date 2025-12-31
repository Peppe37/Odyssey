from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_
from pydantic import BaseModel
from backend.database import get_session
from backend.models import User, Map
from backend.api.deps import get_current_user
from backend.services.achievements import get_user_stats
from passlib.context import CryptContext
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserSearchResult(BaseModel):
    id: int
    username: str
    email: str

class StatsResponse(BaseModel):
    total_points: int
    unique_cities: int
    unique_regions: int
    unique_countries: int
    unique_continents: int
    cities_list: List[str]
    regions_list: List[str]
    countries_list: List[str]
    continents_list: List[str]
    badges_by_category: dict
    next_milestones: dict
    total_badges: int
    # Rankings
    global_rank_points: Optional[int] = None
    global_rank_countries: Optional[int] = None
    global_rank_continents: Optional[int] = None

class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    total_points: int
    unique_countries: int
    unique_continents: int
    total_badges: int

class MapInfoResponse(BaseModel):
    id: int
    name: str
    type: str
    creator_username: str

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    bio: Optional[str] = None

@router.get("/search", response_model=List[UserSearchResult])
def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Search for users by username or email."""
    users = session.exec(
        select(User).where(
            or_(
                User.username.ilike(f"%{q}%"),
                User.email.ilike(f"%{q}%")
            ),
            User.id != current_user.id  # Exclude current user
        ).limit(10)
    ).all()
    
    return [UserSearchResult(id=u.id, username=u.username, email=u.email) for u in users]

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    session: Session = Depends(get_session),
    sort_by: str = Query("points", regex="^(points|countries|continents)$"),
    limit: int = Query(50, ge=1, le=100)
):
    """Get global leaderboard."""
    users = session.exec(select(User)).all()
    results = []
    
    # Calculate stats for all users (could be optimized with raw SQL later)
    for user in users:
        stats = get_user_stats(session, user.id)
        results.append(LeaderboardEntry(
            user_id=user.id,
            username=user.username,
            total_points=stats["total_points"],
            unique_countries=stats["unique_countries"],
            unique_continents=stats["unique_continents"],
            total_badges=stats["total_badges"]
        ))
    
    # Sort in python for now (easier than complex SQL with the current dynamic point logic)
    if sort_by == "points":
        results.sort(key=lambda x: x.total_points, reverse=True)
    elif sort_by == "countries":
        results.sort(key=lambda x: x.unique_countries, reverse=True)
    elif sort_by == "continents":
        results.sort(key=lambda x: x.unique_continents, reverse=True)
        
    return results[:limit]

@router.get("/{user_id}/profile", response_model=dict)
def get_public_profile(
    user_id: int,
    session: Session = Depends(get_session)
):
    """Get public profile for a user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    stats = get_user_stats(session, user_id)
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "joined_at": user.created_at,
            "bio": user.bio
        },
        "stats": stats
    }

def calculate_rank(session: Session, current_user_stats, sort_key):
    # This is a bit heavy, looping all users. OK for small scale.
    # In production, this should be a cached SQL query or a separate Rank table.
    users = session.exec(select(User)).all()
    better_count = 0
    for user in users:
        stats = get_user_stats(session, user.id)
        if stats[sort_key] > current_user_stats[sort_key]:
            better_count += 1
    return better_count + 1

@router.get("/me/stats", response_model=StatsResponse)
def get_my_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    stats = get_user_stats(session, current_user.id)
    
    # Calculate ranks
    stats["global_rank_points"] = calculate_rank(session, stats, "total_points")
    stats["global_rank_countries"] = calculate_rank(session, stats, "unique_countries")
    stats["global_rank_continents"] = calculate_rank(session, stats, "unique_continents")
    
    return stats

@router.put("/me", response_model=dict)
def update_my_profile(
    request: UpdateProfileRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Update user profile (bio, username, password)."""
    if request.username:
        # Check uniqueness
        if request.username != current_user.username:
            existing = session.exec(select(User).where(User.username == request.username)).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = request.username
            
    if request.password:
        current_user.hashed_password = pwd_context.hash(request.password)
        
    if request.bio is not None: # Allow empty string to clear bio
        current_user.bio = request.bio
        
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {"message": "Profile updated successfully", "user": {"username": current_user.username, "bio": current_user.bio}}

@router.get("/map-info/{map_id}", response_model=MapInfoResponse)
def get_map_info_for_join(
    map_id: int,
    session: Session = Depends(get_session)
):
    """Get map info for the join page (public endpoint)."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    creator = session.get(User, db_map.creator_id)
    
    return MapInfoResponse(
        id=db_map.id,
        name=db_map.name,
        type=db_map.type,
        creator_username=creator.username if creator else "Unknown"
    )
