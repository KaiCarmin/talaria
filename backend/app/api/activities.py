"""
Activity endpoints for syncing and managing Strava activities.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import Dict, List
from datetime import datetime
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
