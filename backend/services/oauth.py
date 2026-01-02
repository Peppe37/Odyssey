"""Google OAuth service for authentication."""
import httpx
from urllib.parse import urlencode
from backend.core.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = ["openid", "email", "profile"]


def get_google_auth_url(state: str | None = None) -> str:
    """
    Generate a Google OAuth authorization URL.
    
    Args:
        state: Optional state parameter for CSRF protection
        
    Returns:
        The full authorization URL to redirect users to
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    
    if state:
        params["state"] = state
    
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict:
    """
    Exchange an authorization code for access and refresh tokens.
    
    Args:
        code: The authorization code from Google callback
        
    Returns:
        Token response containing access_token, id_token, etc.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ValueError("Google OAuth credentials are not configured")
    
    payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(GOOGLE_TOKEN_URL, data=payload)
        response.raise_for_status()
        return response.json()


async def get_google_user_info(access_token: str) -> dict:
    """
    Get user info from Google using an access token.
    
    Args:
        access_token: A valid Google access token
        
    Returns:
        User info including id, email, name, picture
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        response.raise_for_status()
        return response.json()


async def get_user_from_code(code: str) -> dict:
    """
    Complete OAuth flow: exchange code and get user info.
    
    Args:
        code: The authorization code from Google callback
        
    Returns:
        User info dict with id, email, name, picture
    """
    tokens = await exchange_code_for_tokens(code)
    access_token = tokens.get("access_token")
    if not access_token:
        raise ValueError("Failed to get access token from Google")
    
    return await get_google_user_info(access_token)
