"""
Zone Calculator Service

Helper functions for calculating and working with HR and pace zones.
Supports dynamic zone models (3, 5, or 7 zones).
"""

from typing import List, Tuple
from app.models.user_settings import UserSettings


def calculate_hr_zones(settings: UserSettings) -> List[Tuple[int, int]]:
    """
    Calculate absolute heart rate zones in BPM based on user settings.
    
    Args:
        settings: UserSettings instance with hr_zones (as % of max HR) and max/rest HR
    
    Returns:
        List of tuples [(min_bpm, max_bpm), ...] for each zone
        Length adapts to zone model (3, 5, or 7 zones)
    
    Example for 5-zone model with max_hr=190, rest_hr=60, zones=[60,70,80,90,100]:
        [(60, 114), (114, 133), (133, 152), (152, 171), (171, 190)]
    """
    if not settings.hr_zones:
        return []
    
    zones = []
    previous_max = settings.rest_heart_rate
    
    for zone_percent in settings.hr_zones:
        zone_max = int(settings.max_heart_rate * zone_percent / 100.0)
        zones.append((previous_max, zone_max))
        previous_max = zone_max
    
    return zones


def get_hr_zone(heart_rate: int, settings: UserSettings) -> int:
    """
    Determine which HR zone a given heart rate falls into.
    
    Args:
        heart_rate: Heart rate in BPM
        settings: UserSettings instance
    
    Returns:
        Zone number (1 to N, where N is number of zones)
        Returns 0 if heart_rate is below all zones
    """
    if heart_rate < settings.rest_heart_rate:
        return 0
    
    zones = calculate_hr_zones(settings)
    
    for i, (min_bpm, max_bpm) in enumerate(zones, start=1):
        if min_bpm <= heart_rate <= max_bpm:
            return i
    
    # If above all zones, return the highest zone
    return len(zones)


def calculate_pace_zones(settings: UserSettings) -> List[Tuple[float, float]]:
    """
    Calculate absolute pace zones based on user settings.
    
    Args:
        settings: UserSettings instance with pace_zones (in min/km, descending)
    
    Returns:
        List of tuples [(slower_pace, faster_pace), ...] for each zone
        Length adapts to zone model (3, 5, or 7 zones)
    
    Example for 5-zone model with zones=[7.0, 6.0, 5.0, 4.5, 4.0]:
        [(float('inf'), 7.0), (7.0, 6.0), (6.0, 5.0), (5.0, 4.5), (4.5, 4.0)]
    
    Note: Slower paces have higher values (e.g., 7.0 min/km is slower than 4.0 min/km)
    """
    if not settings.pace_zones:
        return []
    
    zones = []
    previous_slower = float('inf')  # Zone 1 has no upper bound
    
    for pace_threshold in settings.pace_zones:
        zones.append((previous_slower, pace_threshold))
        previous_slower = pace_threshold
    
    return zones


def get_pace_zone(pace: float, settings: UserSettings) -> int:
    """
    Determine which pace zone a given pace falls into.
    
    Args:
        pace: Pace in min/km (higher value = slower)
        settings: UserSettings instance
    
    Returns:
        Zone number (1 to N, where N is number of zones)
        Returns 0 if pace is faster than all zones
    """
    if not settings.pace_zones:
        return 0
    
    zones = calculate_pace_zones(settings)
    
    for i, (slower, faster) in enumerate(zones, start=1):
        # pace should be between slower (higher value) and faster (lower value)
        if faster <= pace <= slower:
            return i
    
    # If faster than all zones (lower than smallest threshold)
    if pace < settings.pace_zones[-1]:
        return len(zones)
    
    return 0


def format_pace(seconds_per_km: float) -> str:
    """
    Convert pace from seconds per km to MM:SS format.
    
    Args:
        seconds_per_km: Pace in seconds per kilometer
    
    Returns:
        Formatted string like "5:30" for 5 minutes 30 seconds per km
    
    Example:
        format_pace(330.0) -> "5:30"
        format_pace(240.0) -> "4:00"
    """
    if seconds_per_km <= 0:
        return "0:00"
    
    minutes = int(seconds_per_km // 60)
    seconds = int(seconds_per_km % 60)
    
    return f"{minutes}:{seconds:02d}"


def parse_pace(pace_string: str) -> float:
    """
    Parse a pace string (MM:SS) to seconds per km.
    
    Args:
        pace_string: Pace string like "5:30" or "4:00"
    
    Returns:
        Pace in seconds per km
    
    Example:
        parse_pace("5:30") -> 330.0
        parse_pace("4:00") -> 240.0
    """
    try:
        parts = pace_string.strip().split(":")
        if len(parts) != 2:
            return 0.0
        
        minutes = int(parts[0])
        seconds = int(parts[1])
        
        return float(minutes * 60 + seconds)
    except (ValueError, IndexError):
        return 0.0


def validate_zone_array(zones: List[float], zone_type: str, zone_model: str) -> Tuple[bool, str]:
    """
    Validate a zone array for correctness.
    
    Args:
        zones: List of zone thresholds
        zone_type: "hr" or "pace"
        zone_model: "3_zone", "5_zone", or "7_zone"
    
    Returns:
        Tuple of (is_valid, error_message)
        error_message is empty string if valid
    """
    # Check zone model is valid
    zone_counts = {"3_zone": 3, "5_zone": 5, "7_zone": 7}
    if zone_model not in zone_counts:
        return False, f"Invalid zone model: {zone_model}"
    
    expected_count = zone_counts[zone_model]
    
    # Check length
    if len(zones) != expected_count:
        return False, f"Expected {expected_count} zones for {zone_model}, got {len(zones)}"
    
    # Check all values are positive
    if any(z <= 0 for z in zones):
        return False, "All zone values must be positive"
    
    if zone_type == "hr":
        # HR zones should be ascending percentages
        if not all(zones[i] < zones[i+1] for i in range(len(zones)-1)):
            return False, "HR zones must be in strictly ascending order"
        
        # Check range
        if any(z < 0 or z > 100 for z in zones):
            return False, "HR zone percentages must be between 0 and 100"
        
        # Last zone should be 100%
        if zones[-1] != 100.0:
            return False, "Last HR zone must be 100% (maximum effort)"
    
    elif zone_type == "pace":
        # Pace zones should be descending (slower to faster)
        if not all(zones[i] > zones[i+1] for i in range(len(zones)-1)):
            return False, "Pace zones must be in descending order (slower to faster)"
        
        # Check reasonable range (2.5 to 10 min/km)
        if any(z < 2.5 or z > 10.0 for z in zones):
            return False, "Pace zones should be between 2.5 and 10.0 min/km"
    
    else:
        return False, f"Invalid zone type: {zone_type}"
    
    return True, ""


def get_zone_names(zone_model_type: str) -> List[str]:
    """
    Get descriptive names for zones based on the zone model.
    
    Args:
        zone_model_type: "3_zone", "5_zone", or "7_zone"
    
    Returns:
        List of zone names
    """
    zone_names = {
        "3_zone": ["Easy", "Moderate", "Hard"],
        "5_zone": ["Recovery", "Aerobic", "Tempo", "Threshold", "Max"],
        "7_zone": ["Recovery", "Easy", "Aerobic", "Tempo", "Threshold", "VO2 Max", "Sprint"]
    }
    
    return zone_names.get(zone_model_type, zone_names["5_zone"])


def get_zone_colors() -> List[str]:
    """
    Get standard colors for zones (supports up to 7 zones).
    
    Returns:
        List of color codes (hex or named colors)
    """
    return [
        "#9CA3AF",  # Gray - Zone 1 (Recovery/Easy)
        "#60A5FA",  # Blue - Zone 2 (Easy/Aerobic)
        "#34D399",  # Green - Zone 3 (Aerobic/Tempo)
        "#FBBF24",  # Yellow - Zone 4 (Tempo/Threshold)
        "#FB923C",  # Orange - Zone 5 (Threshold/VO2 Max)
        "#F87171",  # Red - Zone 6 (VO2 Max/Max)
        "#DC2626",  # Dark Red - Zone 7 (Sprint)
    ]
