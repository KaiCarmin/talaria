from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Talaria"
    PROJECT_VERSION: str = "0.1.0"
    
    # Database (We enforce that this must be set)
    DATABASE_URL: str
    
    # Strava (These are required; app will fail to start if missing)
    STRAVA_CLIENT_ID: str
    STRAVA_CLIENT_SECRET: str
    
    # Configuration to read from .env files (useful for local dev)
    # Inside Docker, it will read the Environment Variables directly.
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

# Instantiate the settings once to be imported elsewhere
settings = Settings()