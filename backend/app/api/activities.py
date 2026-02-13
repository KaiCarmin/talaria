"""
Activity endpoints for syncing and managing Strava activities.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from collections import defaultdict
import logging

from app.models.athlete import Athlete
from app.models.activity import Activity
from app.services import strava_api
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Database Dependency
# ============================================================================

from sqlmodel import create_engine

engine = create_engine(settings.DATABASE_URL)

def get_session():
    """Dependency for database sessions."""
    with Session(engine) as session:
        yield session


# ============================================================================
# Sync Endpoint
# ============================================================================

@router.post("/sync/{athlete_id}")
async def sync_activities(
    athlete_id: int,
    session: Session = Depends(get_session)
) -> Dict:
    """
    Sync activities from Strava for a specific athlete.
    
    This endpoint:
    1. Validates the athlete exists and has valid tokens
    2. Refreshes the access token if expired
    3. Fetches new activities from Strava since last sync
    4. Stores/updates activities in the database
    5. Returns a summary of the sync operation
    
    Args:
        athlete_id: Internal database ID of the athlete
        
    Returns:
        Dict with sync summary: {
            "success": bool,
            "activities_synced": int,
            "activities_updated": int,
            "last_sync": str (ISO datetime),
            "message": str
        }
    """
    # Step 1: Get athlete from database
    athlete = session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")
    
    logger.info(f"Starting sync for athlete {athlete.firstname} {athlete.lastname} (ID: {athlete_id})")
    
    # Step 2: Check if token needs refresh
    current_time = int(datetime.now().timestamp())
    if athlete.expires_at < current_time:
        logger.info("Access token expired, refreshing...")
        try:
            token_data = await strava_api.refresh_access_token(athlete.refresh_token)
            
            # Update athlete with new tokens
            athlete.access_token = token_data["access_token"]
            athlete.refresh_token = token_data["refresh_token"]
            athlete.expires_at = token_data["expires_at"]
            athlete.updated_at = datetime.now()
            
            session.add(athlete)
            session.commit()
            session.refresh(athlete)
            
            logger.info("Token refreshed successfully")
        except HTTPException as e:
            logger.error(f"Token refresh failed: {e.detail}")
            raise HTTPException(
                status_code=401,
                detail="Failed to refresh access token. Please re-authenticate."
            )
    
    # Step 3: Determine last sync time
    # Get the most recent activity for this athlete
    statement = select(Activity).where(
        Activity.athlete_id == athlete_id
    ).order_by(Activity.start_date.desc()).limit(1)
    
    latest_activity = session.exec(statement).first()
    
    if latest_activity:
        # Sync activities after the last one we have
        after_timestamp = int(latest_activity.start_date.timestamp())
        logger.info(f"Last activity: {latest_activity.name} on {latest_activity.start_date}")
    else:
        # First sync - get activities from last 30 days
        after_timestamp = int((datetime.now().timestamp()) - (30 * 24 * 60 * 60))
        logger.info("First sync - fetching activities from last 30 days")
    
    # Step 4: Fetch activities from Strava
    try:
        activities_data = await strava_api.get_athlete_activities(
            access_token=athlete.access_token,
            after=after_timestamp,
            per_page=100  # Fetch up to 100 activities
        )
        
        logger.info(f"Fetched {len(activities_data)} activities from Strava")
    except HTTPException as e:
        logger.error(f"Failed to fetch activities: {e.detail}")
        raise
    
    # Step 5: Process and store activities
    new_count = 0
    updated_count = 0
    
    for strava_activity in activities_data:
        try:
            # Transform Strava data to our model format
            activity_data = strava_api.transform_strava_activity(
                strava_activity, 
                athlete_id
            )
            
            # Check if activity already exists
            existing = session.exec(
                select(Activity).where(
                    Activity.strava_id == strava_activity["id"]
                )
            ).first()
            
            if existing:
                # Update existing activity
                for key, value in activity_data.items():
                    if key not in ["id", "created_at"]:  # Don't update these
                        setattr(existing, key, value)
                existing.updated_at = datetime.now()
                session.add(existing)
                updated_count += 1
                logger.debug(f"Updated activity: {existing.name}")
            else:
                # Create new activity
                new_activity = Activity(**activity_data)
                session.add(new_activity)
                new_count += 1
                logger.debug(f"Created new activity: {new_activity.name}")
        
        except Exception as e:
            logger.error(f"Error processing activity {strava_activity.get('id')}: {str(e)}")
            continue
    
    # Commit all changes
    try:
        session.commit()
        logger.info(f"Sync complete: {new_count} new, {updated_count} updated")
    except Exception as e:
        session.rollback()
        logger.error(f"Database commit failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save activities to database")
    
    # Step 6: Return summary
    return {
        "success": True,
        "activities_synced": new_count,
        "activities_updated": updated_count,
        "total": new_count + updated_count,
        "last_sync": datetime.now().isoformat(),
        "message": f"Successfully synced {new_count + updated_count} activities"
    }


# ============================================================================
# Activity List Endpoint
# ============================================================================

@router.get("/activities/{athlete_id}")
async def get_activities(
    athlete_id: int,
    limit: int = 10,
    offset: int = 0,
    sort_by: str = "start_date",
    order: str = "desc",
    activity_type: str = None,
    session: Session = Depends(get_session)
) -> Dict:
    """
    Get activities for an athlete from the database with sorting and filtering.
    
    Args:
        athlete_id: Internal database ID of the athlete
        limit: Number of activities to return (default 10, max 100)
        offset: Number of activities to skip (default 0)
        sort_by: Field to sort by (start_date, distance, moving_time, average_speed)
        order: Sort order - asc or desc (default desc)
        activity_type: Filter by activity type (Run, Race, Workout, etc.)
        
    Returns:
        Dict with activities list and metadata
    """
    # Verify athlete exists
    athlete = session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")
    
    # Validate and cap limit
    limit = min(limit, 100)
    
    # Build query
    statement = select(Activity).where(Activity.athlete_id == athlete_id)
    
    # Apply type filter if specified
    if activity_type:
        statement = statement.where(Activity.type == activity_type)
    
    # Apply sorting
    sort_field = getattr(Activity, sort_by, Activity.start_date)
    if order.lower() == "asc":
        statement = statement.order_by(sort_field.asc())
    else:
        statement = statement.order_by(sort_field.desc())
    
    # Apply pagination
    statement = statement.offset(offset).limit(limit)
    
    # Execute query
    activities = session.exec(statement).all()
    
    # Get total count (with filter applied)
    count_statement = select(Activity).where(Activity.athlete_id == athlete_id)
    if activity_type:
        count_statement = count_statement.where(Activity.type == activity_type)
    total_count = len(session.exec(count_statement).all())
    
    return {
        "activities": activities,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total_count
    }


# ============================================================================
# Calendar Endpoint
# ============================================================================

@router.get("/activities/{athlete_id}/calendar")
async def get_activities_calendar(
    athlete_id: int,
    year: int = None,
    month: int = None,
    session: Session = Depends(get_session)
) -> Dict:
    """
    Get activities grouped by date for calendar view.
    
    Args:
        athlete_id: Internal database ID of the athlete
        year: Year to fetch (default: current year)
        month: Optional month filter (1-12)
        
    Returns:
        Dict with activities grouped by date:
        {
            "2026-02-13": {
                "activities": [...],
                "total_distance": 5000,
                "total_time": 1800,
                "count": 1
            }
        }
    """
    # Verify athlete exists
    athlete = session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")
    
    # Default to current year if not specified
    if year is None:
        year = datetime.now().year
    
    # Build query for the specified period
    statement = select(Activity).where(Activity.athlete_id == athlete_id)
    
    # Filter by year and optionally month
    if month:
        # Validate month
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
        # Filter for specific month
        from datetime import datetime
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        statement = statement.where(
            Activity.start_date >= start_date,
            Activity.start_date < end_date
        )
    else:
        # Filter for entire year
        start_date = datetime(year, 1, 1)
        end_date = datetime(year + 1, 1, 1)
        statement = statement.where(
            Activity.start_date >= start_date,
            Activity.start_date < end_date
        )
    
    # Order by date
    statement = statement.order_by(Activity.start_date.asc())
    
    # Execute query
    activities = session.exec(statement).all()
    
    # Group activities by date
    calendar_data = defaultdict(lambda: {
        "activities": [],
        "total_distance": 0,
        "total_time": 0,
        "count": 0
    })
    
    for activity in activities:
        # Get date string (YYYY-MM-DD)
        date_key = activity.start_date.date().isoformat()
        
        # Add activity to the day
        calendar_data[date_key]["activities"].append({
            "id": activity.id,
            "name": activity.name,
            "type": activity.sport_type,
            "distance": activity.distance,
            "moving_time": activity.moving_time,
            "average_speed": activity.average_speed,
            "start_date": activity.start_date.isoformat()
        })
        
        # Update totals for the day
        calendar_data[date_key]["total_distance"] += activity.distance
        calendar_data[date_key]["total_time"] += activity.moving_time
        calendar_data[date_key]["count"] += 1
    
    return dict(calendar_data)


# ============================================================================
# Helper Functions
# ============================================================================

def decode_polyline(polyline_str: str) -> List[Tuple[float, float]]:
    """
    Decode a polyline string into a list of lat/lng coordinates.
    
    Args:
        polyline_str: Encoded polyline string from Strava
        
    Returns:
        List of (latitude, longitude) tuples
    """
    if not polyline_str:
        return []
    
    coordinates = []
    index = 0
    lat = 0
    lng = 0
    
    while index < len(polyline_str):
        # Decode latitude
        result = 0
        shift = 0
        while True:
            b = ord(polyline_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat
        
        # Decode longitude
        result = 0
        shift = 0
        while True:
            b = ord(polyline_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng
        
        coordinates.append((lat / 1e5, lng / 1e5))
    
    return coordinates


def calculate_splits(distance: float, moving_time: int, split_distance: int = 1000) -> List[Dict]:
    """
    Calculate splits for an activity.
    
    Args:
        distance: Total distance in meters
        moving_time: Total moving time in seconds
        split_distance: Split distance in meters (default 1000m = 1km)
        
    Returns:
        List of split dictionaries with pace and time info
    """
    if distance == 0 or moving_time == 0:
        return []
    
    num_splits = int(distance / split_distance)
    time_per_split = moving_time / (distance / split_distance)
    splits = []
    
    for i in range(num_splits):
        split_num = i + 1
        split_time = time_per_split
        # Pace in min/km (or min/mile)
        pace = (split_time / 60) / (split_distance / 1000)
        
        splits.append({
            "split": split_num,
            "distance": split_distance,
            "time": int(split_time),
            "pace": round(pace, 2)
        })
    
    # Add final partial split if there's a remainder
    remainder = distance % split_distance
    if remainder > 0:
        remainder_time = (remainder / distance) * moving_time
        remainder_pace = (remainder_time / 60) / (remainder / 1000)
        splits.append({
            "split": num_splits + 1,
            "distance": int(remainder),
            "time": int(remainder_time),
            "pace": round(remainder_pace, 2)
        })
    
    return splits


# ============================================================================
# Single Activity Detail Endpoint
# ============================================================================

@router.get("/activities/{athlete_id}/{activity_id}")
async def get_activity_detail(
    athlete_id: int,
    activity_id: int,
    session: Session = Depends(get_session)
) -> Dict:
    """
    Get detailed information for a single activity.
    
    Args:
        athlete_id: Internal database ID of the athlete
        activity_id: Internal database ID of the activity
        
    Returns:
        Dict with full activity data including decoded polyline and splits
    """
    # Verify athlete exists
    athlete = session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")
    
    # Get activity
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    
    # Verify activity belongs to athlete
    if activity.athlete_id != athlete_id:
        raise HTTPException(status_code=403, detail="Activity does not belong to this athlete")
    
    # Decode polyline if available
    coordinates = []
    if activity.polyline:
        coordinates = decode_polyline(activity.polyline)
    
    # Calculate splits
    splits = calculate_splits(activity.distance, activity.moving_time)
    
    # Build response
    return {
        "id": activity.id,
        "strava_id": activity.strava_id,
        "name": activity.name,
        "type": activity.sport_type,
        "distance": activity.distance,
        "moving_time": activity.moving_time,
        "elapsed_time": activity.elapsed_time,
        "total_elevation_gain": activity.total_elevation_gain,
        "start_date": activity.start_date.isoformat(),
        "start_date_local": activity.start_date_local.isoformat(),
        "timezone": activity.timezone,
        "average_speed": activity.average_speed,
        "max_speed": activity.max_speed,
        "average_heartrate": activity.average_heartrate,
        "max_heartrate": activity.max_heartrate,
        "has_heartrate": activity.has_heartrate,
        "average_cadence": activity.average_cadence,
        "elev_high": activity.elev_high,
        "elev_low": activity.elev_low,
        "calories": activity.calories,
        "achievement_count": activity.achievement_count,
        "kudos_count": activity.kudos_count,
        "comment_count": activity.comment_count,
        "athlete_count": activity.athlete_count,
        "coordinates": coordinates,
        "splits": splits,
        "created_at": activity.created_at.isoformat(),
        "updated_at": activity.updated_at.isoformat()
    }


# ============================================================================
# Activity Streams Endpoint
# ============================================================================

@router.get("/activities/{athlete_id}/{activity_id}/streams")
async def get_activity_streams_endpoint(
    athlete_id: int,
    activity_id: int,
    session: Session = Depends(get_session)
) -> Dict:
    """
    Get time-series stream data for an activity from Strava.
    
    Args:
        athlete_id: Internal database ID of the athlete
        activity_id: Internal database ID of the activity
        
    Returns:
        Dict with stream data (time, distance, heartrate, cadence, etc.)
    """
    # Verify athlete exists
    athlete = session.get(Athlete, athlete_id)
    if not athlete:
        raise HTTPException(status_code=404, detail=f"Athlete {athlete_id} not found")
    
    # Get activity
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    
    # Verify activity belongs to athlete
    if activity.athlete_id != athlete_id:
        raise HTTPException(status_code=403, detail="Activity does not belong to this athlete")
    
    # Check if token needs refresh
    current_time = int(datetime.now().timestamp())
    if athlete.expires_at < current_time:
        logger.info("Access token expired, refreshing...")
        try:
            token_data = await strava_api.refresh_access_token(athlete.refresh_token)
            
            athlete.access_token = token_data["access_token"]
            athlete.refresh_token = token_data["refresh_token"]
            athlete.expires_at = token_data["expires_at"]
            athlete.updated_at = datetime.now()
            
            session.add(athlete)
            session.commit()
            session.refresh(athlete)
            
            logger.info("Token refreshed successfully")
        except HTTPException as e:
            logger.error(f"Token refresh failed: {e.detail}")
            raise HTTPException(
                status_code=401,
                detail="Failed to refresh access token. Please re-authenticate."
            )
    
    # Fetch streams from Strava
    try:
        streams = await strava_api.get_activity_streams(
            access_token=athlete.access_token,
            activity_id=activity.strava_id
        )
        
        return streams
    except HTTPException as e:
        logger.error(f"Failed to fetch streams: {e.detail}")
        raise
