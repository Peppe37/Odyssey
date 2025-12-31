from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlmodel import Session, select, func, or_
from backend.database import get_session
from backend.models import Map, MapParticipant, Point, User, Route
from backend.schemas import MapCreate, MapRead, PointCreate, PointRead, PointUpdate
from backend.api.deps import get_current_user
from backend.services.geocoding import reverse_geocode, forward_geocode
from backend.services.images import save_upload_file, delete_image
from pydantic import BaseModel

router = APIRouter(prefix="/maps", tags=["maps"])

# --- Schemas for Routes ---
class RouteCreate(BaseModel):
    start_point_id: int
    end_point_id: int

class RouteRead(BaseModel):
    id: int
    map_id: int
    user_id: int
    start_point_id: int
    end_point_id: int
    color: Optional[str] = None

# --- Paginated Response ---
class PaginatedPointsResponse(BaseModel):
    items: List[PointRead]
    total: int
    page: int
    limit: int
    pages: int

# --- Map Endpoints ---
@router.post("", response_model=MapRead)
def create_map(
    map_data: MapCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    if map_data.type not in ["Collaborative", "Competitive", "Personal"]:
         raise HTTPException(status_code=400, detail="Invalid map type")

    new_map = Map(name=map_data.name, type=map_data.type, creator_id=current_user.id)
    session.add(new_map)
    session.commit()
    session.refresh(new_map)
    
    # Personal map doesn't strictly need a participant if it's just for the user, 
    # but for code consistency we add the owner as a participant (so they can add points easily).
    participant = MapParticipant(map_id=new_map.id, user_id=current_user.id, role="Owner", assigned_color="#3B82F6")
    session.add(participant)
    session.commit()
    
    return new_map

@router.get("", response_model=List[MapRead])
def list_maps(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    # Get maps where user is creator or participant
    owned = session.exec(select(Map).where(Map.creator_id == current_user.id)).all()
    
    # Also get maps where user is participant
    participations = session.exec(
        select(Map).join(MapParticipant).where(MapParticipant.user_id == current_user.id)
    ).all()
    
    all_maps = {m.id: m for m in owned}
    for m in participations:
        all_maps[m.id] = m
    
    return list(all_maps.values())

@router.get("/{map_id}", response_model=MapRead)
def get_map(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    if db_map.creator_id == current_user.id:
        return db_map

    # Check participation
    participant = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == current_user.id
        )
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return db_map

@router.delete("/{map_id}")
def delete_map(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    if db_map.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this map")
    
    # Delete points images first
    points = session.exec(select(Point).where(Point.map_id == map_id)).all()
    for p in points:
        delete_image(p.photo_path)
        session.delete(p)

    # Delete routes
    routes = session.exec(select(Route).where(Route.map_id == map_id)).all()
    for r in routes:
        session.delete(r)

    # Delete participants
    for mp in session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id)).all():
        session.delete(mp)
    
    session.delete(db_map)
    session.commit()
    return {"message": "Map deleted"}

# Color palette for participants
COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]

@router.post("/{map_id}/join")
def join_map(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Self-join endpoint for invite links."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    if db_map.type == "Personal":
        raise HTTPException(status_code=403, detail="Cannot join a Personal map")

    # Check limit of participants if needed, but not specified yet.

    # Check if already a participant
    existing = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == current_user.id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already a participant")
    
    # Assign a color
    current_participants = session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id)).all()
    color_index = len(current_participants) % len(COLORS)
    
    new_participant = MapParticipant(
        map_id=map_id,
        user_id=current_user.id,
        role="Collaborator" if db_map.type == "Collaborative" else "Competitor",
        assigned_color=COLORS[color_index]
    )
    session.add(new_participant)
    session.commit()
    
    return {"message": "Successfully joined the map"}

# --- Point Endpoints with Pagination, Search, Sort ---
@router.post("/{map_id}/points", response_model=PointRead)
async def add_point(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    latitude: float = Form(...),
    longitude: float = Form(...),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    participant = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == current_user.id
        )
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this map")
    
    # Validate coordinates
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    
    # Process Image
    photo_path = None
    if photo:
        photo_path = await save_upload_file(photo)

    geo_data = await reverse_geocode(latitude, longitude)
    
    new_point = Point(
        map_id=map_id,
        user_id=current_user.id,
        latitude=latitude,
        longitude=longitude,
        city=geo_data.get("city"),
        region=geo_data.get("region"),
        country=geo_data.get("country"),
        continent=geo_data.get("continent"),
        category=category,
        description=description,
        photo_path=photo_path
    )
    session.add(new_point)
    session.commit()
    session.refresh(new_point)
    
    return new_point

@router.get("/{map_id}/points", response_model=List[PointRead])
def get_points(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    # Only validation checks
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    points = session.exec(select(Point).where(Point.map_id == map_id, Point.hidden_at == None)).all()
    return points

@router.get("/{map_id}/points/paginated", response_model=PaginatedPointsResponse)
def get_points_paginated(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc"),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    # Base query - exclude hidden points
    query = select(Point).where(Point.map_id == map_id, Point.hidden_at == None)
    
    # Search filter
    if search:
        search_filter = or_(
            Point.city.ilike(f"%{search}%"),
            Point.region.ilike(f"%{search}%"),
            Point.country.ilike(f"%{search}%"),
            Point.description.ilike(f"%{search}%"), # Added description search
            Point.category.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Filters
    if country:
        query = query.where(Point.country == country)
    if city:
        query = query.where(Point.city == city)
    if category:
        query = query.where(Point.category == category)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()
    
    # Sorting
    sort_column = getattr(Point, sort_by, Point.timestamp)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    points = session.exec(query).all()
    pages = (total + limit - 1) // limit
    
    return PaginatedPointsResponse(
        items=points,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.delete("/{map_id}/points/{point_id}")
def delete_point(
    map_id: int,
    point_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    point = session.get(Point, point_id)
    if not point or point.map_id != map_id:
        raise HTTPException(status_code=404, detail="Point not found")
    if point.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own points")
    
    # Delete image
    delete_image(point.photo_path)
    
    session.delete(point)
    # Also delete associated routes?
    # For now, let's just delete the point. Routes might need cascade delete or manual cleanup.
    # We can delete routes connected to this point
    routes = session.exec(select(Route).where(or_(Route.start_point_id == point.id, Route.end_point_id == point.id))).all()
    for r in routes:
        session.delete(r)

    session.commit()
    
    return {"message": "Point deleted"}


# --- Routes Endpoints ---

@router.post("/{map_id}/routes", response_model=RouteRead)
def create_route(
    map_id: int,
    route_data: RouteCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
        
    participant = session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id, MapParticipant.user_id == current_user.id)).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Verify points exist and belong to map
    start = session.get(Point, route_data.start_point_id)
    end = session.get(Point, route_data.end_point_id)
    
    if not start or start.map_id != map_id:
        raise HTTPException(status_code=400, detail="Start point invalid")
    if not end or end.map_id != map_id:
        raise HTTPException(status_code=400, detail="End point invalid")

    new_route = Route(
        map_id=map_id,
        user_id=current_user.id,
        start_point_id=route_data.start_point_id,
        end_point_id=route_data.end_point_id
    )
    session.add(new_route)
    session.commit()
    session.refresh(new_route)
    
    return RouteRead(
        id=new_route.id,
        map_id=new_route.map_id,
        user_id=new_route.user_id,
        start_point_id=new_route.start_point_id,
        end_point_id=new_route.end_point_id,
        color=participant.assigned_color
    )

@router.get("/{map_id}/routes", response_model=List[RouteRead])
def get_routes(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    routes = session.exec(select(Route).where(Route.map_id == map_id)).all()
    results = []
    
    # We need to fetch participant colors efficiently ?
    # For simplicity, we fetch color on the fly or pre-fetch participants
    participants = session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id)).all()
    user_colors = {p.user_id: p.assigned_color for p in participants}
    
    for r in routes:
        results.append(RouteRead(
            id=r.id,
            map_id=r.map_id,
            user_id=r.user_id,
            start_point_id=r.start_point_id,
            end_point_id=r.end_point_id,
            color=user_colors.get(r.user_id, "#808080")
        ))
        
    return results

@router.delete("/{map_id}/routes/{route_id}")
def delete_route(
    map_id: int,
    route_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    route = session.get(Route, route_id)
    if not route or route.map_id != map_id:
        raise HTTPException(status_code=404, detail="Route not found")
        
    if route.user_id != current_user.id:
         # Optionally allow map owner to delete?
         db_map = session.get(Map, map_id)
         if db_map.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot delete other user's route")

    session.delete(route)
    session.commit()
    return {"message": "Route deleted"}

@router.put("/{map_id}/routes/{route_id}", response_model=RouteRead)
def update_route(
    map_id: int,
    route_id: int,
    route_data: RouteCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    route = session.get(Route, route_id)
    if not route or route.map_id != map_id:
        raise HTTPException(status_code=404, detail="Route not found")
        
    if route.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit other user's route")

    # Verify points exist and belong to map
    start = session.get(Point, route_data.start_point_id)
    end = session.get(Point, route_data.end_point_id)
    
    if not start or start.map_id != map_id:
        raise HTTPException(status_code=400, detail="Start point invalid")
    if not end or end.map_id != map_id:
        raise HTTPException(status_code=400, detail="End point invalid")

    route.start_point_id = route_data.start_point_id
    route.end_point_id = route_data.end_point_id
    
    session.add(route)
    session.commit()
    session.refresh(route)
    
    # Get color
    participant = session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id, MapParticipant.user_id == route.user_id)).first()
    
    return RouteRead(
        id=route.id,
        map_id=route.map_id,
        user_id=route.user_id,
        start_point_id=route.start_point_id,
        end_point_id=route.end_point_id,
        color=participant.assigned_color if participant else "#808080"
    )

@router.put("/{map_id}/points/{point_id}", response_model=PointRead)
async def update_point(
    map_id: int,
    point_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    city: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    point = session.get(Point, point_id)
    if not point or point.map_id != map_id:
        raise HTTPException(status_code=404, detail="Point not found")
    if point.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own points")
    
    if latitude is not None and (-90 <= latitude <= 90):
        point.latitude = latitude
    if longitude is not None and (-180 <= longitude <= 180):
        point.longitude = longitude
    
    # Recalculate geolocation if coords changed and city not manually provided?
    # For simplicity, if coords change, we might want to reverse geocode again unless city is updated.
    # But let's trust the user or the frontend to provide updated info if needed.
    # If city is passed, update it.
    if city is not None:
        point.city = city
    
    if category is not None:
        point.category = category
    if description is not None:
        point.description = description
        
    if photo:
        # Delete old photo if exists
        delete_image(point.photo_path)
        point.photo_path = await save_upload_file(photo)

    session.add(point)
    session.commit()
    session.refresh(point)
    return point
