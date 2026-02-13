"""
Exploration script to understand the Strava Activity API response format.
This helps us design accurate database models.

Usage:
    python scripts/explore_activity_model.py

Requirements:
    - Docker containers must be running (database needs to be accessible)
    - At least one authenticated user in the database
"""

import asyncio
import httpx
import json
import os
import sys
from pathlib import Path
from datetime import datetime

from sqlmodel import Session, create_engine, select
from app.models.athlete import Athlete
from app.core.config import settings

STRAVA_BASE_URL = "https://www.strava.com/api/v3"


async def get_athlete_token():
    """Fetch a valid access token from the database."""
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        statement = select(Athlete).limit(1)
        athlete = session.exec(statement).first()
        
        if not athlete:
            print("❌ No authenticated users found in database.")
            print("   Please authenticate via the app first (visit http://localhost:5173)")
            sys.exit(1)
            
        print(f"✅ Found athlete: {athlete.firstname} {athlete.lastname} (Strava ID: {athlete.strava_id})")
        
        # Check if token is expired
        current_time = int(datetime.now().timestamp())
        if athlete.expires_at < current_time:
            print("⚠️  Token is expired. Attempting refresh...")
            athlete = await refresh_token(session, athlete)
        
        return athlete.access_token, athlete.strava_id


async def refresh_token(session: Session, athlete: Athlete) -> Athlete:
    """Refresh an expired Strava access token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.strava.com/oauth/token",
            data={
                "client_id": settings.STRAVA_CLIENT_ID,
                "client_secret": settings.STRAVA_CLIENT_SECRET,
                "refresh_token": athlete.refresh_token,
                "grant_type": "refresh_token",
            },
        )
    
    if response.status_code != 200:
        print(f"❌ Token refresh failed: {response.text}")
        sys.exit(1)
    
    data = response.json()
    
    # Update athlete with new tokens
    athlete.access_token = data["access_token"]
    athlete.refresh_token = data["refresh_token"]
    athlete.expires_at = data["expires_at"]
    athlete.updated_at = datetime.now()
    
    session.add(athlete)
    session.commit()
    session.refresh(athlete)
    
    print("✅ Token refreshed successfully")
    return athlete


async def fetch_activities_list(access_token: str, per_page: int = 5):
    """
    Fetch a list of activities (summary format).
    
    Endpoint: GET /athlete/activities
    Docs: https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
    """
    print(f"\n📋 Fetching activities list (per_page={per_page})...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{STRAVA_BASE_URL}/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"per_page": per_page, "page": 1}
        )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch activities: {response.status_code}")
        print(response.text)
        return None
    
    activities = response.json()
    print(f"✅ Fetched {len(activities)} activities")
    
    return activities


async def fetch_activity_detail(access_token: str, activity_id: int):
    """
    Fetch detailed information for a specific activity.
    
    Endpoint: GET /activities/{id}
    Docs: https://developers.strava.com/docs/reference/#api-Activities-getActivityById
    """
    print(f"\n🔍 Fetching detailed activity (ID: {activity_id})...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{STRAVA_BASE_URL}/activities/{activity_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"include_all_efforts": False}
        )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch activity detail: {response.status_code}")
        print(response.text)
        return None
    
    activity = response.json()
    print(f"✅ Fetched activity: {activity.get('name', 'Unknown')}")
    
    return activity


async def fetch_activity_streams(access_token: str, activity_id: int):
    """
    Fetch activity streams (time-series data like heartrate, cadence, etc).
    
    Endpoint: GET /activities/{id}/streams
    Docs: https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
    """
    print(f"\n📊 Fetching activity streams (ID: {activity_id})...")
    
    # Available stream types: time, distance, latlng, altitude, velocity_smooth,
    # heartrate, cadence, watts, temp, moving, grade_smooth
    keys = "time,distance,latlng,altitude,heartrate,cadence,watts,velocity_smooth"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{STRAVA_BASE_URL}/activities/{activity_id}/streams",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"keys": keys, "key_by_type": True}
        )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch streams: {response.status_code}")
        print(response.text)
        return None
    
    streams = response.json()
    print(f"✅ Fetched streams: {list(streams.keys())}")
    
    return streams


def save_to_file(data: dict, filename: str):
    """Save JSON data to a file in the scripts/samples directory."""
    samples_dir = Path(__file__).parent / "samples"
    samples_dir.mkdir(exist_ok=True)
    
    filepath = samples_dir / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved to: {filepath}")


def print_activity_summary(activity: dict):
    """Print a formatted summary of activity fields."""
    print("\n" + "=" * 80)
    print("ACTIVITY SUMMARY")
    print("=" * 80)
    
    # Core fields
    print(f"\n📌 Core Information:")
    print(f"   ID: {activity.get('id')}")
    print(f"   Name: {activity.get('name')}")
    print(f"   Type: {activity.get('type')}")
    print(f"   Sport Type: {activity.get('sport_type')}")
    print(f"   Start Date: {activity.get('start_date')}")
    print(f"   Start Date Local: {activity.get('start_date_local')}")
    
    # Distance and time
    print(f"\n📏 Distance & Time:")
    print(f"   Distance: {activity.get('distance')} meters")
    print(f"   Moving Time: {activity.get('moving_time')} seconds")
    print(f"   Elapsed Time: {activity.get('elapsed_time')} seconds")
    
    # Speed
    print(f"\n⚡ Speed:")
    print(f"   Average Speed: {activity.get('average_speed')} m/s")
    print(f"   Max Speed: {activity.get('max_speed')} m/s")
    
    # Elevation
    print(f"\n⛰️  Elevation:")
    print(f"   Total Elevation Gain: {activity.get('total_elevation_gain')} meters")
    print(f"   Elev High: {activity.get('elev_high')}")
    print(f"   Elev Low: {activity.get('elev_low')}")
    
    # Heart rate
    print(f"\n❤️  Heart Rate:")
    print(f"   Average Heartrate: {activity.get('average_heartrate')}")
    print(f"   Max Heartrate: {activity.get('max_heartrate')}")
    print(f"   Has Heartrate: {activity.get('has_heartrate')}")
    
    # Cadence
    print(f"\n👟 Cadence:")
    print(f"   Average Cadence: {activity.get('average_cadence')}")
    
    # Route
    print(f"\n🗺️  Route:")
    print(f"   Start Lat/Lng: {activity.get('start_latlng')}")
    print(f"   End Lat/Lng: {activity.get('end_latlng')}")
    if activity.get('map'):
        map_data = activity.get('map')
        polyline = map_data.get('summary_polyline', '')
        print(f"   Polyline: {polyline[:50]}..." if len(polyline) > 50 else f"   Polyline: {polyline}")
    
    # Additional info
    print(f"\n📝 Additional:")
    print(f"   Calories: {activity.get('calories')}")
    print(f"   Achievement Count: {activity.get('achievement_count')}")
    print(f"   Kudos Count: {activity.get('kudos_count')}")
    print(f"   Comment Count: {activity.get('comment_count')}")
    print(f"   Athlete Count: {activity.get('athlete_count')}")
    
    print("\n" + "=" * 80)


def print_streams_info(streams: dict):
    """Print information about available streams."""
    print("\n" + "=" * 80)
    print("ACTIVITY STREAMS")
    print("=" * 80)
    
    for stream_type, stream_data in streams.items():
        data_length = len(stream_data.get('data', []))
        print(f"\n📊 {stream_type.upper()}:")
        print(f"   Original Size: {stream_data.get('original_size')}")
        print(f"   Resolution: {stream_data.get('resolution')}")
        print(f"   Series Type: {stream_data.get('series_type')}")
        print(f"   Data Points: {data_length}")
        
        # Show sample data
        data = stream_data.get('data', [])
        if data:
            if len(data) <= 5:
                print(f"   Sample: {data}")
            else:
                print(f"   Sample (first 5): {data[:5]}")
    
    print("\n" + "=" * 80)


async def main():
    """Main exploration function."""
    print("=" * 80)
    print("🏃 Strava Activity Model Explorer")
    print("=" * 80)
    
    # Get access token
    access_token, strava_id = await get_athlete_token()
    
    # Fetch activities list
    activities = await fetch_activities_list(access_token, per_page=5)
    if not activities:
        print("❌ No activities found or API error")
        return
    
    save_to_file(activities, "activities_list.json")
    
    # Show all activity IDs
    print(f"\n📋 Available activities:")
    for i, act in enumerate(activities, 1):
        print(f"   {i}. {act.get('name')} (ID: {act.get('id')}) - {act.get('type')}")
    
    # Get the first activity for detailed exploration
    first_activity_id = activities[0].get('id')
    
    # Fetch detailed activity
    activity_detail = await fetch_activity_detail(access_token, first_activity_id)
    if activity_detail:
        save_to_file(activity_detail, "activity_detail.json")
        print_activity_summary(activity_detail)
    
    # Fetch activity streams
    streams = await fetch_activity_streams(access_token, first_activity_id)
    if streams:
        save_to_file(streams, "activity_streams.json")
        print_streams_info(streams)
    
    print("\n✅ Exploration complete!")
    print(f"📁 Sample files saved to: scripts/samples/")
    print("\nNext steps:")
    print("   1. Review the JSON files in scripts/samples/")
    print("   2. Identify required vs optional fields")
    print("   3. Design the Activity model based on this structure")


if __name__ == "__main__":
    asyncio.run(main())
