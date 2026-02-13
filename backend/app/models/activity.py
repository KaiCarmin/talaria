from typing import Optional
from sqlmodel import SQLModel, Field, Column, Text, BigInteger
from datetime import datetime

class ActivityBase(SQLModel):
    strava_id: int = Field(sa_column=Column(BigInteger, unique=True, index=True))
    athlete_id: int = Field(foreign_key="athlete.id", index=True)
    name: str
    distance: float  # meters
    moving_time: int  # seconds
    elapsed_time: int  # seconds
    total_elevation_gain: float  # meters
    sport_type: str  # e.g., "Run", "Ride", "Swim"
    start_date: datetime = Field(index=True)
    start_date_local: datetime
    timezone: Optional[str] = None
    
    # Speed metrics
    average_speed: Optional[float] = None  # meters per second
    max_speed: Optional[float] = None  # meters per second
    
    # Heart rate metrics
    average_heartrate: Optional[float] = None
    max_heartrate: Optional[int] = None
    has_heartrate: bool = Field(default=False)
    
    # Cadence (steps per minute for running)
    average_cadence: Optional[float] = None
    
    # Elevation details
    elev_high: Optional[float] = None  # meters
    elev_low: Optional[float] = None  # meters
    
    # Route data - encoded polyline for map visualization
    polyline: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Additional metrics
    calories: Optional[float] = None
    achievement_count: Optional[int] = None
    kudos_count: Optional[int] = None
    comment_count: Optional[int] = None
    athlete_count: Optional[int] = None  # number of athletes on the activity

class Activity(ActivityBase, table=True):
    __tablename__ = "activities"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityCreate(ActivityBase):
    pass
