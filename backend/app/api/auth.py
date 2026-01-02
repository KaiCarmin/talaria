from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.services.strava_api import get_strava_auth_url, exchange_code_for_token
from app.core.config import settings
from app.models.athlete import Athlete

from sqlmodel import create_engine
engine = create_engine(settings.DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

router = APIRouter()

@router.get("/strava/login")
def login_with_strava():
    return {"url": get_strava_auth_url()} 

@router.post("/strava/callback")
async def strava_callback(code: str, session: Session = Depends(get_session)):
    # 1. Exchange code for tokens (Async call)
    token_data = await exchange_code_for_token(code)
    
    # 2. Extract Athlete Info
    strava_athlete = token_data["athlete"]
    
    # 3. Check if athlete already exists in DB
    statement = select(Athlete).where(Athlete.strava_id == strava_athlete["id"])
    existing_athlete = session.exec(statement).first()
    
    if existing_athlete:
        # UPDATE: User exists, just refresh their tokens
        existing_athlete.access_token = token_data["access_token"]
        existing_athlete.refresh_token = token_data["refresh_token"]
        existing_athlete.expires_at = token_data["expires_at"]
        existing_athlete.profile_medium = strava_athlete.get("profile_medium")
        session.add(existing_athlete)
    else:
        # CREATE: New User
        new_athlete = Athlete(
            strava_id=strava_athlete["id"],
            username=strava_athlete.get("username"),
            firstname=strava_athlete.get("firstname"),
            lastname=strava_athlete.get("lastname"),
            profile_medium=strava_athlete.get("profile_medium"),
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            expires_at=token_data["expires_at"]
        )
        session.add(new_athlete)
    
    session.commit()
    
    return {"message": "Login Successful", "athlete_id": strava_athlete["id"]}