"""Cloudflare Turnstile captcha verification service."""
import httpx
from backend.core.config import settings

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str, remote_ip: str | None = None) -> bool:
    """
    Verify a Turnstile captcha token with Cloudflare API.
    
    Args:
        token: The turnstile response token from the frontend
        remote_ip: Optional client IP address for additional verification
        
    Returns:
        True if verification succeeded, False otherwise
    """
    if not settings.ACTIVE_TURNSTILE_SECRET_KEY:
        # If no secret key is configured, skip verification (dev mode)
        return True
    
    payload = {
        "secret": settings.ACTIVE_TURNSTILE_SECRET_KEY,
        "response": token,
    }
    
    if remote_ip:
        payload["remoteip"] = remote_ip
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(TURNSTILE_VERIFY_URL, data=payload)
            result = response.json()
            return result.get("success", False)
        except Exception:
            # If verification fails due to network error, deny access
            return False
