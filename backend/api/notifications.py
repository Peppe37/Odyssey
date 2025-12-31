from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime
import json

from backend.database import get_session
from backend.models import Notification, User
from backend.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    message: str
    data: dict | None
    read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationCountResponse(BaseModel):
    unread: int
    total: int

@router.get("", response_model=List[NotificationRead])
def get_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session),
    unread_only: bool = False
):
    """Get all notifications for the current user."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.read == False)
    query = query.order_by(Notification.created_at.desc())
    
    notifications = session.exec(query).all()
    result = []
    for n in notifications:
        data = None
        if n.data:
            try:
                data = json.loads(n.data)
            except:
                data = {"raw": n.data}
        result.append(NotificationRead(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            data=data,
            read=n.read,
            created_at=n.created_at
        ))
    return result

@router.get("/count", response_model=NotificationCountResponse)
def get_notification_count(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Get notification counts."""
    all_notifications = session.exec(
        select(Notification).where(Notification.user_id == current_user.id)
    ).all()
    unread = sum(1 for n in all_notifications if not n.read)
    return NotificationCountResponse(unread=unread, total=len(all_notifications))

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Mark a notification as read."""
    notification = session.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    session.add(notification)
    session.commit()
    return {"message": "Marked as read"}

@router.put("/read-all")
def mark_all_as_read(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Mark all notifications as read."""
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.read == False
        )
    ).all()
    for n in notifications:
        n.read = True
        session.add(n)
    session.commit()
    return {"message": f"Marked {len(notifications)} notifications as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Session = Depends(get_session)
):
    """Delete a notification."""
    notification = session.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    session.delete(notification)
    session.commit()
    return {"message": "Notification deleted"}
