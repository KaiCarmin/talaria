from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel, create_engine

# 1. Configuration & Settings
from app.core.config import settings

# 2. Database Models
from app.models.activity import Activity
from app.models.athlete import Athlete

# 3. API Routers
from app.api import auth

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

# 4. Register Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
def read_root():
    return {"message": "Talaria API is flying! ⚡"}