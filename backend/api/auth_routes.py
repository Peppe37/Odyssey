from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from backend.database import get_session
from backend.models import User
from backend.schemas import UserCreate, UserRead, Token, LoginRequest
from backend.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.api.deps import get_current_user
from backend.services.turnstile import verify_turnstile
from backend.services.oauth import get_google_auth_url, get_user_from_code
from backend.core.config import settings
import secrets

router = APIRouter()


@router.post("/register", response_model=UserRead)
async def register_user(user: UserCreate, request: Request, session: Session = Depends(get_session)):
    # Validate terms acceptance
    if not user.accept_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the Terms and Conditions and Privacy Policy"
        )
    
    # Verify Turnstile captcha
    client_ip = request.client.host if request.client else None
    is_valid = await verify_turnstile(user.captcha_token, client_ip)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha verification failed. Please try again."
        )
    
    # Check for existing email
    db_user = session.exec(select(User).where(User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check for existing username
    db_user_username = session.exec(select(User).where(User.username == user.username)).first()
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already taken")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        terms_accepted_at=datetime.utcnow()
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    
    # Check user exists and has a password (not OAuth-only user)
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login_with_captcha(
    login_data: LoginRequest,
    request: Request,
    session: Session = Depends(get_session)
):
    """Login endpoint with Turnstile captcha verification."""
    # Verify Turnstile captcha
    client_ip = request.client.host if request.client else None
    is_valid = await verify_turnstile(login_data.captcha_token, client_ip)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha verification failed. Please try again."
        )
    
    user = session.exec(select(User).where(User.username == login_data.username)).first()
    
    if not user or not user.hashed_password or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/google")
async def google_login():
    """Redirect to Google OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    state = secrets.token_urlsafe(32)
    auth_url = get_google_auth_url(state)
    return RedirectResponse(url=auth_url)


@router.get("/auth/google/callback")
async def google_callback(
    code: str,
    state: str | None = None,
    error: str | None = None,
    session: Session = Depends(get_session)
):
    """Handle Google OAuth callback."""
    if error:
        # Redirect to frontend login page with error
        return RedirectResponse(url=f"/login?error={error}")
    
    try:
        # Get user info from Google
        google_user = await get_user_from_code(code)
        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name", "").replace(" ", "_").lower()
        
        if not google_id or not email:
            return RedirectResponse(url="/login?error=invalid_google_response")
        
        # Check if user already exists by google_id
        user = session.exec(select(User).where(User.google_id == google_id)).first()
        
        if not user:
            # Check if email already exists
            user = session.exec(select(User).where(User.email == email)).first()
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                if not user.terms_accepted_at:
                    user.terms_accepted_at = datetime.utcnow()
                session.add(user)
                session.commit()
            else:
                # Create new user
                # Generate unique username from name or email
                base_username = name if name else email.split("@")[0]
                username = base_username
                counter = 1
                while session.exec(select(User).where(User.username == username)).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User(
                    email=email,
                    username=username,
                    google_id=google_id,
                    terms_accepted_at=datetime.utcnow()  # OAuth users accept terms implicitly
                )
                session.add(user)
                session.commit()
                session.refresh(user)
        
        # Generate JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        # Redirect to frontend with token
        return RedirectResponse(url=f"/login?token={access_token}")
        
    except Exception as e:
        # Log error and redirect to login with error
        print(f"Google OAuth error: {e}")
        return RedirectResponse(url="/login?error=oauth_failed")


@router.get("/users/me", response_model=UserRead)
def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    # Return user with is_google_user flag
    return UserRead(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        total_badges=current_user.total_badges,
        bio=current_user.bio,
        created_at=current_user.created_at,
        is_google_user=current_user.google_id is not None
    )
