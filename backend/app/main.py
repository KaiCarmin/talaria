from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine

# 1. Configuration & Settings
from app.core.config import settings

# 2. Database Models
from app.models.activity import Activity
from app.models.athlete import Athlete
from app.models.user_settings import UserSettings

# 3. API Routers
from app.api import auth, activities
from app.api import settings as settings_api

# Database Setup
engine = create_engine(settings.DATABASE_URL)

def create_db_and_tables():
    """Creates tables in Postgres if they don't exist yet"""
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code here runs BEFORE the app starts receiving requests.
    We use it to initialize the Database.
    """
    create_db_and_tables()
    yield
    # Code here runs when the app shuts down (optional)

# Initialize the App
app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# 4. Register Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(activities.router, prefix="/api/v1", tags=["activities"])
app.include_router(settings_api.router)  # Already has /api/v1/settings prefix

@app.get("/")
def read_root():
    return {"message": "Talaria API is flying! ⚡"}