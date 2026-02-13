"""
User Settings Model

Stores user preferences for zones, units, and display options.
Zones are stored as JSON arrays that adapt to the selected zone model (3, 5, or 7 zones).
"""

from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Column, JSON
from sqlalchemy import UniqueConstraint


def get_default_zones(zone_model_type: str) -> tuple[List[float], List[float]]:
    """
    Return default HR zones (%) and pace zones (min/km) for a given zone model.
    
    Args:
        zone_model_type: One of "3_zone", "5_zone", "7_zone"
    
    Returns:
        Tuple of (hr_zones, pace_zones)
    """
    defaults = {
        "3_zone": (
            [70.0, 85.0, 100.0],  # HR zones as % of max HR
            [6.5, 5.5, 4.5]  # Pace zones in min/km (slower to faster)
        ),
        "5_zone": (
            [60.0, 70.0, 80.0, 90.0, 100.0],
            [7.0, 6.0, 5.0, 4.5, 4.0]
        ),
        "7_zone": (
            [55.0, 65.0, 75.0, 82.0, 89.0, 94.0, 100.0],
            [7.5, 6.5, 5.5, 5.0, 4.5, 4.0, 3.5]
        )
    }
    
    if zone_model_type not in defaults:
        # Default to 5-zone if invalid
        zone_model_type = "5_zone"
    
    return defaults[zone_model_type]


class UserSettings(SQLModel, table=True):
    """User preferences and settings model."""
    
    __tablename__ = "user_settings"
    __table_args__ = (UniqueConstraint("athlete_id", name="uq_athlete_id"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    athlete_id: int = Field(foreign_key="athlete.id", index=True)
    
    # Zone configuration
    zone_model_type: str = Field(default="5_zone")  # Options: "3_zone", "5_zone", "7_zone"
    
    # Heart rate settings
    max_heart_rate: int = Field(default=190)  # User's maximum heart rate
    rest_heart_rate: int = Field(default=60)  # User's resting heart rate
    
    # Dynamic zone arrays (stored as JSON)
    # HR zones: Array of percentages of max HR (ascending)
    # Length must match zone model (3, 5, or 7)
    hr_zones: List[float] = Field(
        default_factory=lambda: [60.0, 70.0, 80.0, 90.0, 100.0],
        sa_column=Column(JSON)
    )
    
    # Pace zones: Array of pace thresholds in min/km (descending: slower to faster)
    # Length must match zone model (3, 5, or 7)
    pace_zones: List[float] = Field(
        default_factory=lambda: [7.0, 6.0, 5.0, 4.5, 4.0],
        sa_column=Column(JSON)
    )
    
    # Display preferences
    calendar_start_day: str = Field(default="monday")  # Options: "monday", "sunday"
    distance_unit: str = Field(default="km")  # Options: "km", "miles"
    temperature_unit: str = Field(default="celsius")  # Options: "celsius", "fahrenheit"
    
    # Audit fields
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def update_timestamp(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()
    
    def set_defaults_for_zone_model(self) -> None:
        """Set default zone arrays based on zone_model_type."""
        hr_defaults, pace_defaults = get_default_zones(self.zone_model_type)
        self.hr_zones = hr_defaults
        self.pace_zones = pace_defaults
    
    @classmethod
    def create_default(cls, athlete_id: int) -> "UserSettings":
        """Create default settings for an athlete."""
        settings = cls(athlete_id=athlete_id)
        settings.set_defaults_for_zone_model()
        return settings
