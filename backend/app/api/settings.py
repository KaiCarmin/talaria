"""
Settings API Endpoints

Handles user settings CRUD operations including zone configuration.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, create_engine
from typing import Dict, Any

from app.core.config import settings
from app.models.user_settings import UserSettings, get_default_zones
from app.services.zone_calculator import validate_zone_array

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])

# Database Setup
engine = create_engine(settings.DATABASE_URL)

def get_session():
    """Dependency for database sessions."""
    with Session(engine) as session:
        yield session


@router.get("/{athlete_id}")
async def get_settings(athlete_id: int, session: Session = Depends(get_session)) -> Dict[str, Any]:
    """
    Get user settings for an athlete.
    Creates default settings if none exist.
    
    Args:
        athlete_id: The athlete's ID
        session: Database session
    
    Returns:
        User settings as dictionary
    """
    # Try to get existing settings
    statement = select(UserSettings).where(UserSettings.athlete_id == athlete_id)
    settings = session.exec(statement).first()
    
    # Create default settings if none exist
    if not settings:
        settings = UserSettings.create_default(athlete_id)
        session.add(settings)
        session.commit()
        session.refresh(settings)
    
    return {
        "id": settings.id,
        "athlete_id": settings.athlete_id,
        "zone_model_type": settings.zone_model_type,
        "max_heart_rate": settings.max_heart_rate,
        "rest_heart_rate": settings.rest_heart_rate,
        "hr_zones": settings.hr_zones,
        "pace_zones": settings.pace_zones,
        "calendar_start_day": settings.calendar_start_day,
        "distance_unit": settings.distance_unit,
        "temperature_unit": settings.temperature_unit,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }


@router.put("/{athlete_id}")
async def update_settings(
    athlete_id: int,
    updates: Dict[str, Any],
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Update user settings.
    
    Args:
        athlete_id: The athlete's ID
        updates: Dictionary of fields to update
        session: Database session
    
    Returns:
        Updated settings
    
    Raises:
        HTTPException: If validation fails or settings not found
    """
    # Get existing settings
    statement = select(UserSettings).where(UserSettings.athlete_id == athlete_id)
    settings = session.exec(statement).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Validate zone_model_type if provided
    if "zone_model_type" in updates:
        zone_model = updates["zone_model_type"]
        if zone_model not in ["3_zone", "5_zone", "7_zone"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid zone_model_type: {zone_model}. Must be one of: 3_zone, 5_zone, 7_zone"
            )
    
    # Get zone model for validation (use updated or existing)
    zone_model = updates.get("zone_model_type", settings.zone_model_type)
    
    # Validate HR zones if provided
    if "hr_zones" in updates:
        is_valid, error_msg = validate_zone_array(updates["hr_zones"], "hr", zone_model)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid HR zones: {error_msg}")
    
    # Validate pace zones if provided
    if "pace_zones" in updates:
        is_valid, error_msg = validate_zone_array(updates["pace_zones"], "pace", zone_model)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid pace zones: {error_msg}")
    
    # Validate heart rate ranges
    max_hr = updates.get("max_heart_rate", settings.max_heart_rate)
    rest_hr = updates.get("rest_heart_rate", settings.rest_heart_rate)
    
    if max_hr <= rest_hr:
        raise HTTPException(
            status_code=400,
            detail=f"Max heart rate ({max_hr}) must be greater than rest heart rate ({rest_hr})"
        )
    
    if max_hr < 120 or max_hr > 220:
        raise HTTPException(status_code=400, detail="Max heart rate must be between 120 and 220")
    
    if rest_hr < 30 or rest_hr > 100:
        raise HTTPException(status_code=400, detail="Rest heart rate must be between 30 and 100")
    
    # Validate calendar_start_day
    if "calendar_start_day" in updates:
        if updates["calendar_start_day"] not in ["monday", "sunday"]:
            raise HTTPException(
                status_code=400,
                detail="calendar_start_day must be 'monday' or 'sunday'"
            )
    
    # Validate distance_unit
    if "distance_unit" in updates:
        if updates["distance_unit"] not in ["km", "miles"]:
            raise HTTPException(status_code=400, detail="distance_unit must be 'km' or 'miles'")
    
    # Validate temperature_unit
    if "temperature_unit" in updates:
        if updates["temperature_unit"] not in ["celsius", "fahrenheit"]:
            raise HTTPException(
                status_code=400,
                detail="temperature_unit must be 'celsius' or 'fahrenheit'"
            )
    
    # Apply updates
    for key, value in updates.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    
    settings.update_timestamp()
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return {
        "id": settings.id,
        "athlete_id": settings.athlete_id,
        "zone_model_type": settings.zone_model_type,
        "max_heart_rate": settings.max_heart_rate,
        "rest_heart_rate": settings.rest_heart_rate,
        "hr_zones": settings.hr_zones,
        "pace_zones": settings.pace_zones,
        "calendar_start_day": settings.calendar_start_day,
        "distance_unit": settings.distance_unit,
        "temperature_unit": settings.temperature_unit,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }


@router.post("/{athlete_id}/reset")
async def reset_settings(
    athlete_id: int,
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Reset user settings to defaults.
    
    Args:
        athlete_id: The athlete's ID
        session: Database session
    
    Returns:
        Reset settings
    """
    # Get existing settings
    statement = select(UserSettings).where(UserSettings.athlete_id == athlete_id)
    settings = session.exec(statement).first()
    
    if settings:
        # Delete existing settings
        session.delete(settings)
        session.commit()
    
    # Create new default settings
    settings = UserSettings.create_default(athlete_id)
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return {
        "id": settings.id,
        "athlete_id": settings.athlete_id,
        "zone_model_type": settings.zone_model_type,
        "max_heart_rate": settings.max_heart_rate,
        "rest_heart_rate": settings.rest_heart_rate,
        "hr_zones": settings.hr_zones,
        "pace_zones": settings.pace_zones,
        "calendar_start_day": settings.calendar_start_day,
        "distance_unit": settings.distance_unit,
        "temperature_unit": settings.temperature_unit,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }


@router.post("/{athlete_id}/change-zone-model")
async def change_zone_model(
    athlete_id: int,
    new_zone_model: Dict[str, str],
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Change the zone model type and reset zones to defaults for the new model.
    
    Args:
        athlete_id: The athlete's ID
        new_zone_model: Dictionary with "zone_model_type" key
        session: Database session
    
    Returns:
        Updated settings with new zone model and default zones
    
    Raises:
        HTTPException: If invalid zone model or settings not found
    """
    zone_model_type = new_zone_model.get("zone_model_type")
    
    if not zone_model_type or zone_model_type not in ["3_zone", "5_zone", "7_zone"]:
        raise HTTPException(
            status_code=400,
            detail="zone_model_type must be one of: 3_zone, 5_zone, 7_zone"
        )
    
    # Get existing settings
    statement = select(UserSettings).where(UserSettings.athlete_id == athlete_id)
    settings = session.exec(statement).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Update zone model and set default zones
    settings.zone_model_type = zone_model_type
    settings.set_defaults_for_zone_model()
    settings.update_timestamp()
    
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return {
        "id": settings.id,
        "athlete_id": settings.athlete_id,
        "zone_model_type": settings.zone_model_type,
        "max_heart_rate": settings.max_heart_rate,
        "rest_heart_rate": settings.rest_heart_rate,
        "hr_zones": settings.hr_zones,
        "pace_zones": settings.pace_zones,
        "calendar_start_day": settings.calendar_start_day,
        "distance_unit": settings.distance_unit,
        "temperature_unit": settings.temperature_unit,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }
