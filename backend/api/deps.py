from typing import Generator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session, select
from backend.database import get_session
from backend.core.config import settings
from backend.auth import ALGORITHM, SECRET_KEY
from backend.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
        
        # Support both user_id (new) and username (legacy) in sub
        # Try to parse as int for user_id first
        try:
            user_id = int(sub)
            user = session.get(User, user_id)
        except ValueError:
            # Legacy: sub is username
            user = session.exec(select(User).where(User.username == sub)).first()
            
    except JWTError:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    return user
