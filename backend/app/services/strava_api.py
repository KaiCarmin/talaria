import httpx
from fastapi import HTTPException
from app.core.config import settings

# URLs
BASE_URL = "https://www.strava.com/api/v3"
TOKEN_URL = "https://www.strava.com/oauth/token"
AUTHORIZE_URL = "https://www.strava.com/oauth/authorize"

def get_strava_auth_url():
    """
    This stays synchronous because it's just string formatting.
    No network call happens here.
    """
    redirect_uri = "http://localhost:5173/exchange_token" 
    scope = "read,activity:read_all"
    return (
        f"{AUTHORIZE_URL}?client_id={settings.STRAVA_CLIENT_ID}"
        f"&response_type=code&redirect_uri={redirect_uri}"
        f"&approval_prompt=force&scope={scope}"
    )

async def exchange_code_for_token(code: str):
    """
    ASYNC: Uses httpx to swap code for token without blocking the loop.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKEN_URL,
            data={
                "client_id": settings.STRAVA_CLIENT_ID,
                "client_secret": settings.STRAVA_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
            },
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Strava Auth Failed: {response.text}")
        
    data = response.json()
    
    return {
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "athlete": data["athlete"],
        "expires_at": data["expires_at"]
    }