from typing import Annotated, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
import json

from backend.database import get_session
from backend.models import Map, MapParticipant, User, Notification, Point
from backend.schemas import ParticipantCreate, ParticipantRead
from backend.api.deps import get_current_user

router = APIRouter(prefix="/maps/{map_id}/participants", tags=["participants"])

COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]

class ColorUpdate(BaseModel):
    color: str

@router.post("", response_model=dict)
def invite_participant(
    map_id: int,
    invite_data: ParticipantCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Create a pending invite (notification only, user must accept)."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    if db_map.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can invite participants")
    
    user_to_invite = session.exec(select(User).where(User.username == invite_data.username)).first()
    if not user_to_invite:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_invite.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")
    
    existing = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == user_to_invite.id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a participant")
    
    existing_notif = session.exec(
        select(Notification).where(
            Notification.user_id == user_to_invite.id,
            Notification.type == "invite",
            Notification.read == False
        )
    ).all()
    for notif in existing_notif:
        if notif.data:
            try:
                data = json.loads(notif.data)
                if data.get("map_id") == map_id:
                    raise HTTPException(status_code=400, detail="User already has a pending invite")
            except:
                pass
    
    notification = Notification(
        user_id=user_to_invite.id,
        type="invite",
        title="Map Invitation",
        message=f"{current_user.username} invited you to join '{db_map.name}'",
        data=json.dumps({"map_id": map_id, "map_name": db_map.name, "inviter": current_user.username})
    )
    session.add(notification)
    session.commit()
    
    return {"message": f"Invitation sent to {user_to_invite.username}"}

@router.post("/accept/{notification_id}")
def accept_invite(
    map_id: int,
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Accept a pending invite and become a participant. Restores any hidden points."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    notification = session.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.data:
        try:
            data = json.loads(notification.data)
            if data.get("map_id") != map_id:
                raise HTTPException(status_code=400, detail="Notification is not for this map")
        except:
            raise HTTPException(status_code=400, detail="Invalid notification data")
    
    existing = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == current_user.id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already a participant")
    
    current_participants = session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id)).all()
    color_index = len(current_participants) % len(COLORS)
    
    new_participant = MapParticipant(
        map_id=map_id,
        user_id=current_user.id,
        role="Collaborator" if db_map.type == "Collaborative" else "Competitor",
        assigned_color=COLORS[color_index]
    )
    session.add(new_participant)
    
    # Restore any hidden points for this user on this map
    hidden_points = session.exec(
        select(Point).where(
            Point.map_id == map_id,
            Point.user_id == current_user.id,
            Point.hidden_at != None
        )
    ).all()
    for point in hidden_points:
        point.hidden_at = None
        session.add(point)
    
    notification.read = True
    session.add(notification)
    session.commit()
    
    restored_count = len(hidden_points)
    return {"message": f"Successfully joined the map. {restored_count} points restored." if restored_count else "Successfully joined the map"}

@router.post("/decline/{notification_id}")
def decline_invite(
    map_id: int,
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Decline a pending invite."""
    notification = session.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    session.add(notification)
    session.commit()
    
    return {"message": "Invitation declined"}

@router.get("", response_model=List[ParticipantRead])
def list_participants(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    participants = session.exec(select(MapParticipant).where(MapParticipant.map_id == map_id)).all()
    
    result = []
    for p in participants:
        user = session.get(User, p.user_id)
        result.append(ParticipantRead(
            user_id=p.user_id,
            username=user.username if user else "Unknown",
            role=p.role,
            assigned_color=p.assigned_color
        ))
    return result

@router.put("/{user_id}/color")
def update_participant_color(
    map_id: int,
    user_id: int,
    color_data: ColorUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Update a participant's color (owner only, or self)."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    if user_id != current_user.id and db_map.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can change others' colors")
    
    participant = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == user_id
        )
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    participant.assigned_color = color_data.color
    session.add(participant)
    session.commit()
    
    return {"message": "Color updated"}

@router.delete("/leave")
def leave_map(
    map_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Leave a map as a participant. Hides user's points (not deleted, restored on rejoin)."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    
    if db_map.creator_id == current_user.id:
        raise HTTPException(status_code=400, detail="Owner cannot leave their own map")
    
    participant = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == current_user.id
        )
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="You are not a participant")
    
    # Hide user's points (set hidden_at instead of deleting)
    user_points = session.exec(
        select(Point).where(Point.map_id == map_id, Point.user_id == current_user.id, Point.hidden_at == None)
    ).all()
    for point in user_points:
        point.hidden_at = datetime.utcnow()
        session.add(point)
    
    session.delete(participant)
    
    # Notify the creator
    notification = Notification(
        user_id=db_map.creator_id,
        type="leave",
        title="Participant Left",
        message=f"{current_user.username} left your map '{db_map.name}'",
        data=json.dumps({"map_id": map_id, "map_name": db_map.name, "user": current_user.username})
    )
    session.add(notification)
    
    session.commit()
    return {"message": "You left the map"}

@router.delete("/{user_id}")
def remove_participant(
    map_id: int,
    user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Remove a participant (owner only). Hides their points (not deleted)."""
    db_map = session.get(Map, map_id)
    if not db_map:
        raise HTTPException(status_code=404, detail="Map not found")
    if db_map.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can remove participants")
    if user_id == db_map.creator_id:
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    
    participant = session.exec(
        select(MapParticipant).where(
            MapParticipant.map_id == map_id,
            MapParticipant.user_id == user_id
        )
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Hide user's points (set hidden_at instead of deleting)
    user_points = session.exec(
        select(Point).where(Point.map_id == map_id, Point.user_id == user_id, Point.hidden_at == None)
    ).all()
    for point in user_points:
        point.hidden_at = datetime.utcnow()
        session.add(point)
    
    user = session.get(User, user_id)
    session.delete(participant)
    
    # Notify the removed user
    if user:
        notification = Notification(
            user_id=user_id,
            type="removed",
            title="Removed from Map",
            message=f"You were removed from '{db_map.name}' by {current_user.username}",
            data=json.dumps({"map_id": map_id, "map_name": db_map.name})
        )
        session.add(notification)
    
    session.commit()
    return {"message": "Participant removed"}
