import httpx
from fastapi import HTTPException
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from app.core.config import settings

# URLs
BASE_URL = "https://www.strava.com/api/v3"
TOKEN_URL = "https://www.strava.com/oauth/token"
AUTHORIZE_URL = "https://www.strava.com/oauth/authorize"

# Strava API Rate Limits
# - 100 requests per 15 minutes
# - 1000 requests per day
RATE_LIMIT_15MIN = 100
RATE_LIMIT_DAILY = 1000

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


async def refresh_access_token(refresh_token: str) -> Dict:
    """
    Refresh an expired Strava access token.
    
    Args:
        refresh_token: The refresh token from the database
        
    Returns:
        Dict with new access_token, refresh_token, and expires_at
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKEN_URL,
            data={
                "client_id": settings.STRAVA_CLIENT_ID,
                "client_secret": settings.STRAVA_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=400, 
            detail=f"Token refresh failed: {response.text}"
        )
    
    data = response.json()
    return {
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "expires_at": data["expires_at"]
    }


async def get_athlete_activities(
    access_token: str,
    after: Optional[int] = None,
    before: Optional[int] = None,
    page: int = 1,
    per_page: int = 30
) -> List[Dict]:
    """
    Fetch a list of activities for the authenticated athlete.
    
    Args:
        access_token: Valid Strava access token
        after: Unix timestamp to fetch activities after this time
        before: Unix timestamp to fetch activities before this time
        page: Page number (default 1)
        per_page: Number of activities per page (max 200, default 30)
        
    Returns:
        List of activity summary objects
        
    Strava API: GET /athlete/activities
    Docs: https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
    """
    params = {
        "page": page,
        "per_page": min(per_page, 200)  # Strava max is 200
    }
    
    if after:
        params["after"] = after
    if before:
        params["before"] = before
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{BASE_URL}/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Access token expired or invalid")
    elif response.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    elif response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Strava API error: {response.text}"
        )
    
    return response.json()


async def get_activity_detail(access_token: str, activity_id: int) -> Dict:
    """
    Fetch detailed information for a specific activity.
    
    Args:
        access_token: Valid Strava access token
        activity_id: Strava activity ID
        
    Returns:
        Detailed activity object with additional fields
        
    Strava API: GET /activities/{id}
    Docs: https://developers.strava.com/docs/reference/#api-Activities-getActivityById
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{BASE_URL}/activities/{activity_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"include_all_efforts": False}  # Exclude segment efforts for performance
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Access token expired or invalid")
    elif response.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    elif response.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    elif response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Strava API error: {response.text}"
        )
    
    return response.json()


async def get_activity_streams(
    access_token: str,
    activity_id: int,
    keys: Optional[List[str]] = None
) -> Dict:
    """
    Fetch activity streams (time-series data like heartrate, cadence, etc).
    
    Args:
        access_token: Valid Strava access token
        activity_id: Strava activity ID
        keys: List of stream types to fetch. Available types:
              - time: Integer seconds
              - distance: Float meters
              - latlng: Array of [lat, lng]
              - altitude: Float meters
              - velocity_smooth: Float meters per second
              - heartrate: Integer BPM
              - cadence: Integer RPM (cycling) or steps per minute (running)
              - watts: Integer watts
              - temp: Integer degrees Celsius
              - moving: Boolean
              - grade_smooth: Float percent
              
    Returns:
        Dictionary of stream data keyed by type
        
    Strava API: GET /activities/{id}/streams
    Docs: https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
    """
    if keys is None:
        # Default streams for running analysis
        keys = ["time", "distance", "latlng", "altitude", "heartrate", "cadence", "velocity_smooth"]
    
    keys_str = ",".join(keys)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{BASE_URL}/activities/{activity_id}/streams",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "keys": keys_str,
                "key_by_type": True  # Return as dict instead of list
            }
        )
    
    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Access token expired or invalid")
    elif response.status_code == 404:
        # Streams might not exist for all activities
        return {}
    elif response.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    elif response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Strava API error: {response.text}"
        )
    
    return response.json()


# ============================================================================
# Helper Functions for Rate Limiting and Data Transformation
# ============================================================================

async def retry_with_backoff(
    func,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0
):
    """
    Retry a function with exponential backoff.
    
    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        backoff_factor: Multiplier for delay on each retry
        
    Returns:
        Result of the function call
        
    Raises:
        The last exception if all retries fail
    """
    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func()
        except HTTPException as e:
            last_exception = e
            
            # Don't retry on auth errors or not found
            if e.status_code in [401, 403, 404]:
                raise
            
            # On rate limit, wait longer
            if e.status_code == 429:
                delay = 60.0  # Wait 1 minute on rate limit
            
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= backoff_factor
            else:
                raise last_exception
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= backoff_factor
            else:
                raise
    
    if last_exception:
        raise last_exception


def transform_strava_activity(strava_data: Dict, athlete_id: int) -> Dict:
    """
    Transform Strava API activity response to our internal Activity model format.
    
    Args:
        strava_data: Raw activity data from Strava API
        athlete_id: Internal database ID of the athlete
        
    Returns:
        Dictionary matching our Activity model fields
    """
    return {
        "strava_id": strava_data["id"],
        "athlete_id": athlete_id,
        "name": strava_data["name"],
        "distance": strava_data.get("distance", 0.0),
        "moving_time": strava_data.get("moving_time", 0),
        "elapsed_time": strava_data.get("elapsed_time", 0),
        "total_elevation_gain": strava_data.get("total_elevation_gain", 0.0),
        "sport_type": strava_data.get("sport_type", strava_data.get("type", "Run")),
        "start_date": datetime.fromisoformat(strava_data["start_date"].replace("Z", "+00:00")),
        "start_date_local": datetime.fromisoformat(strava_data["start_date_local"]),
        "timezone": strava_data.get("timezone"),
        "average_speed": strava_data.get("average_speed"),
        "max_speed": strava_data.get("max_speed"),
        "average_heartrate": strava_data.get("average_heartrate"),
        "max_heartrate": strava_data.get("max_heartrate"),
        "has_heartrate": strava_data.get("has_heartrate", False),
        "average_cadence": strava_data.get("average_cadence"),
        "elev_high": strava_data.get("elev_high"),
        "elev_low": strava_data.get("elev_low"),
        "polyline": strava_data.get("map", {}).get("summary_polyline"),
        "calories": strava_data.get("calories"),
        "achievement_count": strava_data.get("achievement_count"),
        "kudos_count": strava_data.get("kudos_count"),
        "comment_count": strava_data.get("comment_count"),
        "athlete_count": strava_data.get("athlete_count"),
    }


def calculate_pace(distance_meters: float, time_seconds: int) -> Optional[float]:
    """
    Calculate pace in minutes per kilometer.
    
    Args:
        distance_meters: Distance in meters
        time_seconds: Time in seconds
        
    Returns:
        Pace in minutes per kilometer, or None if distance is 0
    """
    if distance_meters == 0:
        return None
    
    distance_km = distance_meters / 1000.0
    time_minutes = time_seconds / 60.0
    return time_minutes / distance_km


def format_pace(pace_min_per_km: Optional[float]) -> str:
    """
    Format pace as MM:SS per km.
    
    Args:
        pace_min_per_km: Pace in minutes per kilometer
        
    Returns:
        Formatted string like "5:30" (5 minutes 30 seconds per km)
    """
    if pace_min_per_km is None:
        return "N/A"
    
    minutes = int(pace_min_per_km)
    seconds = int((pace_min_per_km - minutes) * 60)
    return f"{minutes}:{seconds:02d}"