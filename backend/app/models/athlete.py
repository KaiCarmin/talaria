from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class AthleteBase(SQLModel):
    strava_id: int = Field(unique=True, index=True)
    username: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    profile_medium: Optional[str] = None # URL to profile pic
    
    # Security: Store tokens so we can fetch data later
    access_token: str
    refresh_token: str
    expires_at: int # Unix timestamp

class Athlete(AthleteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AthleteCreate(AthleteBase):
    pass