from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class ActivityBase(SQLModel):
    strava_id: int = Field(unique=True, index=True)
    athlete_id: int = Field(foreign_key="athlete.id")
    name: str
    distance: float  # meters
    moving_time: int  # seconds
    elapsed_time: int  # seconds
    total_elevation_gain: float  # meters
    sport_type: str  # e.g., "Run", "Ride", "Swim"
    start_date: datetime
    start_date_local: datetime
    timezone: Optional[str] = None
    average_speed: Optional[float] = None  # meters per second
    max_speed: Optional[float] = None  # meters per second
    average_heartrate: Optional[float] = None
    max_heartrate: Optional[int] = None

class Activity(ActivityBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityCreate(ActivityBase):
    pass
