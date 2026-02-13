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

### 🟢 Phase 2: Data Ingestion (The Pipeline) ✅ COMPLETE

**Goal:** Fetch and store running activities so we have data to display.

* [X] **Strava Service:** Create a backend service to fetch activities from Strava API.
* [X] **Activity Model:** Design the `Activity` database table (distance, time, heart rate, polyline).
* [X] **Sync Endpoint:** Create `POST /sync` to trigger a data fetch.
* [X] **Background Tasks:** (Optional) Ensure fetching doesn't freeze the UI.

**Completed:** February 13, 2026**Key Files:**

- `backend/app/models/activity.py` - Activity database model with 25+ fields
- `backend/app/services/strava_api.py` - Strava API client with token refresh, rate limiting, error handling
- `backend/app/api/activities.py` - Sync endpoint and activity retrieval
- `frontend/src/pages/Dashboard.tsx` - Sync button with status display

**Result:** Successfully syncing activities from Strava with full data including routes, heart rate, cadence, and elevation.

---

### 🔵 Phase 3: The Dashboard (Visualization)

**Goal:** A professional UI where users can explore their running history.

* [ ] **Dashboard Layout:** Create the main app skeleton (Sidebar, Header, Main View). should be adaptive to browser screen (web). the menu in a dise bar and the main view clean with the current view chosen.
* [ ] View options:
  * [ ] **Activity Table:** A table view of the user's last 10 runs.
  * [ ] **Activity Calender:** A calender view of activities.
* [ ] Activity view:
  * [ ] **Charts:** Use `recharts` to plot time series date (pace, hr, etc...)
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

#### 2.1 Strava Service Layer ✅

- [X] **Create `strava_api.py` Service**

  - Implement authentication and token refresh
  - Add rate limiting awareness (100 requests per 15 min, 1000 per day)
  - Implement exponential backoff for API errors
  - Create helper methods for common operations
- [X] **Activity Fetching Methods**

  - `get_athlete_activities(after: timestamp, per_page: int)`: Fetch activity list
  - `get_activity_detail(activity_id: int)`: Get detailed activity with streams
  - `get_activity_streams(activity_id: int, keys: list)`: Fetch time-series data
  - Implement pagination for large datasets
- [X] **Data Transformation**

  - Convert Strava API response to internal format with `transform_strava_activity()`
  - Parse polyline data for route visualization
  - Calculate derived metrics (avg pace, split times) with helper functions
  - Handle missing/optional fields gracefully

#### 2.2 Activity Model Design ✅

- [X] **Database Schema**

  - Create `Activity` model with 25+ fields:
    - `id`: Primary key
    - `athlete_id`: Foreign key to Athlete (indexed)
    - `strava_id`: Unique Strava identifier (BIGINT, indexed)
    - `name`: Activity title
    - `distance`: Meters (float)
    - `moving_time`: Seconds (int)
    - `elapsed_time`: Seconds (int)
    - `total_elevation_gain`: Meters (float)
    - `start_date`: Timestamp (indexed)
    - `average_speed`, `max_speed`: m/s (float)
    - `average_heartrate`, `max_heartrate`, `has_heartrate`: Heart rate data
    - `average_cadence`: Running cadence
    - `elev_high`, `elev_low`: Elevation details
    - `polyline`: Encoded route string (TEXT)
    - `calories`, `kudos_count`, `achievement_count`: Additional metrics
    - `created_at`, `updated_at`: Audit fields
- [X] **Activity Streams Model** (Deferred to Phase 4)

  - Can be added later for detailed time-series analysis
  - Will support heartrate, cadence, watts, altitude streams
- [X] **Database Migration**

  - Auto-created by SQLModel on startup
  - Indexes on `athlete_id`, `start_date`, and `strava_id`
  - Unique constraint on `strava_id`

#### 2.3 Sync Endpoint Implementation ✅

- [X] **Create `POST /api/v1/sync/{athlete_id}` Endpoint**

  - Authenticate user via athlete_id parameter
  - Validate user has valid Strava tokens
  - Check token expiration and refresh automatically if needed
- [X] **Sync Logic**

  - Determine last sync timestamp from most recent activity in database
  - Fetch activities since last sync (or last 30 days for first sync)
  - Process activities in batches up to 100
  - Update existing activities if strava_id already exists (upsert)
  - Insert new activities into database
  - Return sync summary (new: X, updated: Y, total: Z)
- [X] **Error Handling**

  - Handle Strava API rate limits with proper error messages
  - Partial sync recovery with try-catch per activity
  - Comprehensive logging for debugging
  - Return meaningful error messages to frontend

#### 2.4 Background Tasks (Deferred)

- [X] **Current Implementation**

  - Sync runs synchronously (acceptable for <100 activities)
  - FastAPI async/await provides non-blocking execution
  - Typical sync completes in 2-5 seconds
- [ ] **Future Enhancement: Background Tasks**

  - Add FastAPI BackgroundTasks for large syncs
  - Or implement Celery with Redis for scheduled tasks
  - Return task ID immediately to user
  - Create `GET /api/sync/status/{task_id}` endpoint
- [ ] **Scheduled Sync** (Future Enhancement)

  - Create periodic task to auto-sync activities
  - Run daily for active users
  - Send notification when new activities detected

#### 2.5 Frontend Integration ✅

- [X] **Sync Button Component**

  - Add "Sync Activities" button to dashboard with Strava branding
  - Show loading spinner and "Syncing..." text during sync
  - Display success message with detailed count (new, updated, total)
  - Handle errors gracefully with user-friendly messages
- [X] **Sync Status Display**

  - Show sync results in styled alert boxes (green for success, red for error)
  - Display breakdown: new activities, updated activities, total processed
  - Clear visual feedback with emojis and formatting
- [ ] **Future Enhancements**

  - Automatic sync on first login
  - Show last sync timestamp
  - Progress bar for large syncs
  - Cache synced data locally for performance
