# Talaria: AI Running Coach - Project Plan

## 1. Architecture Overview

Talaria is a containerized, full-stack application designed to ingest running data, visualize it for the user, and analyze it with AI.

* **Frontend:** React (Vite) + Tailwind CSS + Recharts (Visualization).
* **Backend:** FastAPI (Python). REST API for data management and future AI orchestration.
* **Database:** PostgreSQL. Stores user profiles, tokens, and raw activity data.
* **Intelligence:** LLM Integration (Gemini/OpenAI) for generating insights from data.

---

## 2. Development Stages

### 🟢 Phase 1: The Foundation (Infrastructure & Auth)

**Goal:** A working environment where a user can log in and save their identity.

* [X] **Docker Setup:** Create `docker-compose.yml` for Backend, Frontend, and DB.
* [X] **Database Schema:** Define `Athlete` model with SQLModel.
* [X] **Backend Auth:** Implement `GET /login` and `POST /callback` for Strava OAuth.
* [X] **Token Persistence:** Save/Update User Access Tokens in Postgres.
* [X] **Frontend Auth:** Create Login Page and Handle Redirects.

### 🟡 Phase 2: Data Ingestion (The Pipeline)

**Goal:** Fetch and store running activities so we have data to display.

* [ ] **Strava Service:** Create a backend service to fetch activities from Strava API.
* [ ] **Activity Model:** Design the `Activity` database table (distance, time, heart rate, polyline).
* [ ] **Sync Endpoint:** Create `POST /sync` to trigger a data fetch.
* [ ] **Background Tasks:** (Optional) Ensure fetching doesn't freeze the UI.

### 🔵 Phase 3: The Dashboard (Visualization)

**Goal:** A professional UI where users can explore their running history.

* [ ] **Dashboard Layout:** Create the main app skeleton (Sidebar, Header, Main View).
* [ ] **Activity List:** A table view of the user's last 10 runs.
* [ ] **Activity Calender:** A calender view of activities.
* [ ] **Charts:** Use `recharts` to plot Pace vs. Heart Rate.
* [ ] **Map Visualization:** Render run routes using Leaflet or Mapbox.
* [ ] **UI Polish:** Loading states, error handling, and responsive design.

### 🔴 Phase 4: The Intelligence (AI Integration)

**Goal:** Turn the visualized data into actionable coaching advice.

* [ ] **LLM Client:** Set up the Python client (Google Gemini / OpenAI).
* [ ] **Prompt Engineering:** Design system prompts ("Act as a running coach...").
* [ ] **Analysis Endpoint:** Create `GET /analyze/{activity_id}`.
* [ ] **The "Insight" Card:** Display AI feedback alongside the charts in the UI.

---

## 3. In-depth Development Plan

### Phase 1: The Foundation (Infrastructure & Auth) - DETAILED

#### 1.1 Docker Setup ✅
- [X] Create multi-service `docker-compose.yml`
  - Backend service (FastAPI on port 8000)
  - Frontend service (Vite dev server on port 5173)
  - PostgreSQL database (port 5432)
- [X] Configure volume mounts for hot reloading
- [X] Set up environment variables and secrets management
- [X] Configure Dockerfiles for both services

#### 1.2 Database Schema ✅
- [X] Install SQLModel and Alembic for database management
- [X] Define `Athlete` model with fields:
  - `id`: Primary key
  - `strava_id`: Unique identifier from Strava
  - `firstname`, `lastname`: User profile data
  - `access_token`, `refresh_token`: OAuth credentials
  - `token_expires_at`: Token expiration timestamp
  - `created_at`, `updated_at`: Audit fields
- [X] Create database connection and session management
- [X] Set up async database operations

#### 1.3 Backend Auth ✅
- [X] Configure Strava OAuth credentials in environment
- [X] Implement `GET /api/auth/login` endpoint
  - Generate OAuth authorization URL
  - Include scopes: `read,activity:read_all`
  - Redirect to Strava authorization page
- [X] Implement `POST /api/auth/callback` endpoint
  - Exchange authorization code for access token
  - Fetch athlete profile from Strava
  - Create or update athlete in database
  - Return success response with athlete data

#### 1.4 Token Persistence ✅
- [X] Create database CRUD operations for Athlete model
- [X] Implement token refresh logic
- [X] Store encrypted tokens securely
- [X] Handle token expiration and refresh flow

#### 1.5 Frontend Auth ✅
- [X] **Login Page Component**
  - Create `Login.tsx` with styled button
  - Add Talaria branding and hero section
  - Implement "Connect with Strava" button
  - Add loading states during OAuth flow
  
- [X] **OAuth Redirect Handler**
  - Create callback route handler
  - Extract authorization code from URL params
  - Send code to backend `/callback` endpoint
  - Handle success/error responses
  
- [X] **Session Management**
  - Store athlete data in React context or state
  - Implement protected routes
  - Add logout functionality
  - Handle token refresh on app reload
  
- [X] **Error Handling**
  - Display user-friendly error messages
  - Handle OAuth cancellation/denial
  - Network error recovery
  - Redirect logic for unauthorized access

---

### Phase 2: Data Ingestion (The Pipeline) - DETAILED

#### 2.1 Strava Service Layer
- [ ] **Create `strava_api.py` Service**
  - Implement `StravaClient` class with authentication
  - Add rate limiting (100 requests per 15 min, 1000 per day)
  - Implement exponential backoff for API errors
  - Create helper methods for common operations

- [ ] **Activity Fetching Methods**
  - `get_athlete_activities(after: timestamp, per_page: int)`: Fetch activity list
  - `get_activity_detail(activity_id: int)`: Get detailed activity with streams
  - `get_activity_streams(activity_id: int, keys: list)`: Fetch time-series data
  - Implement pagination for large datasets
  
- [ ] **Data Transformation**
  - Convert Strava API response to internal format
  - Parse polyline data for route visualization
  - Calculate derived metrics (avg pace, split times)
  - Handle missing/optional fields gracefully

#### 2.2 Activity Model Design
- [ ] **Database Schema**
  - Create `Activity` model with fields:
    - `id`: Primary key
    - `athlete_id`: Foreign key to Athlete
    - `strava_activity_id`: Unique Strava identifier
    - `name`: Activity title
    - `distance`: Meters (float)
    - `moving_time`: Seconds (int)
    - `elapsed_time`: Seconds (int)
    - `total_elevation_gain`: Meters (float)
    - `start_date`: Timestamp
    - `average_speed`: m/s (float)
    - `max_speed`: m/s (float)
    - `average_heartrate`: bpm (float, optional)
    - `max_heartrate`: bpm (int, optional)
    - `polyline`: Encoded route string
    - `created_at`, `updated_at`: Audit fields
  
- [ ] **Activity Streams Model** (Optional for detailed analysis)
  - `activity_id`: Foreign key
  - `type`: Stream type (time, distance, heartrate, cadence, watts, altitude)
  - `data`: JSON array of values
  - Support for time-series analysis

- [ ] **Database Migration**
  - Create Alembic migration for Activity table
  - Add indexes on `athlete_id` and `start_date`
  - Add unique constraint on `strava_activity_id`

#### 2.3 Sync Endpoint Implementation
- [ ] **Create `POST /api/sync` Endpoint**
  - Authenticate user via session/token
  - Validate user has valid Strava tokens
  - Check token expiration and refresh if needed
  
- [ ] **Sync Logic**
  - Determine last sync timestamp from database
  - Fetch activities since last sync
  - Process activities in batches
  - Update existing activities if modified
  - Insert new activities into database
  - Return sync summary (new: X, updated: Y)
  
- [ ] **Error Handling**
  - Handle Strava API rate limits
  - Partial sync recovery on failure
  - Log sync errors for debugging
  - Return meaningful error messages

#### 2.4 Background Tasks (Optional but Recommended)
- [ ] **Setup Celery or FastAPI BackgroundTasks**
  - Configure task queue (Redis/RabbitMQ)
  - Create background worker service
  - Add to docker-compose if using Celery
  
- [ ] **Async Sync Implementation**
  - Move sync logic to background task
  - Return task ID immediately to user
  - Create `GET /api/sync/status/{task_id}` endpoint
  - Implement WebSocket for real-time progress updates
  
- [ ] **Scheduled Sync** (Future Enhancement)
  - Create periodic task to auto-sync activities
  - Run daily for active users
  - Send notification when new activities detected

#### 2.5 Frontend Integration
- [ ] **Sync Button Component**
  - Add "Sync Activities" button to dashboard
  - Show loading spinner during sync
  - Display success message with count
  - Handle errors gracefully
  
- [ ] **Initial Data Load**
  - Trigger automatic sync on first login
  - Show progress indicator for large syncs
  - Cache synced data locally for performance
  
- [ ] **Sync Status Indicator**
  - Show last sync timestamp
  - Display sync progress if background task
  - Add manual refresh option

