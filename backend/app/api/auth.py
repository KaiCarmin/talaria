from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from app.services.strava_api import get_strava_auth_url, exchange_code_for_token

router = APIRouter()

@router.post("/strava/callback")
async def strava_callback(code: str):  # <--- Note "async def"
    """Frontend sends the code here -> We get the token"""
    
    # We must AWAIT the async function
    token_data = await exchange_code_for_token(code) 
    
    return token_data