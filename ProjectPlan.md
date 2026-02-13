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

* [ ] **User Settings (Implement First):** Create user preferences system for zones, units, and display options
  * [ ] Zone model selector (3-zone, 5-zone, or 7-zone)
  * [ ] HR zones (dynamic array of percentages matching zone model)
  * [ ] Pace zones (dynamic array of pace thresholds matching zone model)
  * [ ] Max HR and Rest HR settings
  * [ ] Calendar preferences (start day: Sunday/Monday)
  * [ ] Unit preferences (km/miles, Celsius/Fahrenheit)
  * [ ] Settings page UI with dynamic zone editor and preferences
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

---

### Phase 3: The Dashboard (Visualization) - DETAILED

#### 3.1 User Settings & Preferences (IMPLEMENT FIRST)

**Goal:** Create user settings model and UI to store preferences that will be used throughout the dashboard

**⚠️ IMPORTANT:** This section must be implemented FIRST before other components, as many features depend on these settings.

- [ ] **Backend: User Settings Model**

  - Create `UserSettings` SQLModel in `backend/app/models/user_settings.py`
  - Fields:
    - `id`: Primary key
    - `athlete_id`: Foreign key to Athlete (unique, indexed)
    - `zone_model_type`: String (default: "5_zone") - Options: "3_zone", "5_zone", "7_zone"
    - `max_heart_rate`: Integer (default: 190) - User's maximum heart rate
    - `rest_heart_rate`: Integer (default: 60) - User's resting heart rate
    - `hr_zones`: JSON/dict field storing zone thresholds as percentages
      - Example for 5-zone: `[60.0, 70.0, 80.0, 90.0, 100.0]` (ascending % of max HR)
      - Example for 3-zone: `[70.0, 85.0, 100.0]`
      - Example for 7-zone: `[55.0, 65.0, 75.0, 82.0, 89.0, 94.0, 100.0]`
      - **Length must match zone model** (3, 5, or 7 thresholds)
    - `pace_zones`: JSON/dict field storing pace thresholds in min/km
      - Example for 5-zone: `[7.0, 6.0, 5.0, 4.5, 4.0]` (descending pace: slower to faster)
      - Example for 3-zone: `[6.5, 5.5, 4.5]`
      - Example for 7-zone: `[7.5, 6.5, 5.5, 5.0, 4.5, 4.0, 3.5]`
      - **Length must match zone model**
    - `calendar_start_day`: String (default: "monday") - Options: "monday" or "sunday"
    - `distance_unit`: String (default: "km") - Options: "km" or "miles"
    - `temperature_unit`: String (default: "celsius") - Options: "celsius" or "fahrenheit"
    - `created_at`, `updated_at`: Audit fields
  - Use SQLModel's JSON column type (PostgreSQL JSONB for performance)
  - Create database migration
  - Add unique constraint on `athlete_id`
  - **Default Settings Factory:**
    - Create `get_default_zones(zone_model_type: str)` helper
    - Returns appropriate default hr_zones and pace_zones based on model type
- [ ] **Backend: Settings Endpoints**

  - Create `backend/app/api/settings.py`
  - `GET /api/v1/settings/{athlete_id}`: Get user settings
    - Return settings JSON
    - Create default settings if none exist
  - `PUT /api/v1/settings/{athlete_id}`: Update user settings
    - **Validate zone_model_type** is one of: "3_zone", "5_zone", "7_zone"
    - **Validate array lengths** match zone model:
      - 3_zone → 3 thresholds
      - 5_zone → 5 thresholds
      - 7_zone → 7 thresholds
    - Validate HR zones array: ascending order, 0-100% range
    - Validate pace zones array: descending order (slower to faster), positive values
    - Validate heart rate ranges: rest_hr < max_hr
    - Return updated settings
  - `POST /api/v1/settings/{athlete_id}/reset`: Reset to defaults
    - Delete existing settings
    - Create new default settings with zone_model_type
    - Return default settings
  - `POST /api/v1/settings/{athlete_id}/change-zone-model`: Change zone model
    - Accept new `zone_model_type`
    - Generate default zones for new model
    - Return updated settings with new zones
- [ ] **Backend: Settings Helper Functions**

  - Create `backend/app/services/zone_calculator.py`
  - `get_default_zones(zone_model_type: str) -> tuple[list, list]`: Return default zones
    - 3-zone: HR [70, 85, 100], Pace [6.5, 5.5, 4.5]
    - 5-zone: HR [60, 70, 80, 90, 100], Pace [7.0, 6.0, 5.0, 4.5, 4.0]
    - 7-zone: HR [55, 65, 75, 82, 89, 94, 100], Pace [7.5, 6.5, 5.5, 5.0, 4.5, 4.0, 3.5]
  - `calculate_hr_zones(settings: UserSettings) -> list[tuple]`: Calculate absolute HR zones
    - Returns list of tuples: `[(min_bpm, max_bpm), (min_bpm, max_bpm), ...]`
    - Length adapts to zone model (3, 5, or 7 tuples)
    - Zone 1 starts at rest_hr, each zone ends at settings.hr_zones[i] * max_hr / 100
  - `get_hr_zone(heart_rate: int, settings: UserSettings) -> int`: Get zone number for HR
    - Returns 1 to N (where N is number of zones)
  - `calculate_pace_zones(settings: UserSettings) -> list[tuple]`: Calculate absolute pace zones
    - Returns list of tuples: `[(slower_pace, faster_pace), ...]`
    - Length adapts to zone model
  - `get_pace_zone(pace: float, settings: UserSettings) -> int`: Get zone number for pace
    - Returns 1 to N (where N is number of zones)
  - `format_pace(seconds_per_km: float) -> str`: Convert to "M:SS" format
  - `validate_zone_array(zones: list, zone_type: str, zone_model: str) -> bool`: Validate zones
    - Check length matches model
    - Check ordering (ascending for HR %, descending for pace)
- [ ] **Frontend: Settings Context**

  - Create `frontend/src/context/SettingsContext.tsx`
  - Provide global settings state using React Context
  - Functions:
    - `useSettings()`: Hook to access settings
    - `fetchSettings()`: Load settings from API
    - `updateSettings(updates)`: Update and persist settings
    - `resetSettings()`: Reset to defaults
  - Store settings in context and localStorage for offline access
  - Auto-fetch settings after authentication
- [ ] **Frontend: Settings Page Component**

  - Create `frontend/src/pages/Settings.tsx`
  - Tabbed interface:
    - **Profile Tab**: User info (read-only from Strava)
    - **Zones Tab**: HR and Pace zone configuration
    - **Preferences Tab**: Calendar, units, display options
  - Add route `/settings` with Settings icon in sidebar
- [ ] **Frontend: Zones Tab**

  - Create `frontend/src/components/settings/ZonesTab.tsx`
  - **Zone Model Selector:**
    - Dropdown to select zone model: "3-Zone", "5-Zone", "7-Zone"
    - Show explanation of each model
    - Warning when changing (resets zone values to defaults)
    - Confirm dialog before switching
  - **Heart Rate Zones Section:**
    - Input for Max HR (number input, 120-220 range)
    - Input for Rest HR (number input, 30-100 range)
    - **Dynamic zone editor:**
      - **N rows for N zones** (3, 5, or 7 based on model)
      - Each row: Zone number, color, percentage slider/input
      - Calculated absolute BPM display (auto-updates)
      - Dynamic zone descriptions based on model:
        - 3-zone: Easy, Moderate, Hard
        - 5-zone: Recovery, Aerobic, Tempo, Threshold, Max
        - 7-zone: Recovery, Easy, Aerobic, Tempo, Threshold, VO2 Max, Sprint
    - Save button with validation
    - Reset zones to defaults button (keeps model)
  - **Pace Zones Section:**
    - Similar dynamic layout to HR zones
    - Pace input in MM:SS format per km
    - **N zones adapting to model**
    - Visual pace slider/editor (range depends on zone count)
    - Common presets dropdown: "Beginner", "Intermediate", "Advanced"
      - Presets adjust to zone model automatically
  - **Zone Preview Chart:**
    - Visual bar chart showing zone ranges
    - Color-coded by zone
    - **Number of bars adapts to zone model**
    - Hover to see details
    - Visual validation (highlight overlaps or gaps)
- [ ] **Frontend: Preferences Tab**

  - Create `frontend/src/components/settings/PreferencesTab.tsx`
  - **Calendar Preferences:**
    - Radio buttons: "Start week on Monday" / "Start week on Sunday"
    - Preview mini calendar showing the change
  - **Unit Preferences:**
    - Distance: km / miles radio buttons
    - Temperature: Celsius / Fahrenheit (for future weather features)
  - **Display Preferences (Future):**
    - Theme: Light / Dark / Auto
    - Chart colors
    - Default views
  - Auto-save on change with debounce
  - Success toast on save
- [ ] **Frontend: Settings Integration**

  - Update all components to use settings context:
    - Calendar: Use `calendar_start_day` setting
    - Charts: Use zone settings for colored backgrounds
    - Activity cards: Display pace in user's preferred unit
    - Tables: Format distances according to unit preference
  - Create helper hooks:
    - `useHrZones()`: Returns calculated HR zones
    - `usePaceZones()`: Returns calculated pace zones
    - `useDistanceUnit()`: Returns conversion function
  - Add unit toggle buttons where appropriate
- [ ] **Validation & Error Handling**

  - Backend validation:
    - **Zone array length** must match zone_model_type (3, 5, or 7)
    - HR zones must be in **strictly ascending order**
    - HR zone percentages must be 0-100
    - Last HR zone must be 100% (max effort)
    - Max HR > Rest HR (at least 30 bpm difference)
    - Pace zones must be in **descending order** (slower to faster)
    - Pace zones must be positive values
    - Return detailed validation errors with field names
  - Frontend validation:
    - Real-time validation as user types
    - Check zone array completeness (no null values)
    - Visual error indicators (red border, error text)
    - Helpful error messages:
      - "Zone thresholds must increase"
      - "Must have exactly N zones for N-zone model"
      - "Pace zones must decrease (faster paces are lower)"
    - Disable save if invalid
    - Show which specific zone has the error
  - Default fallbacks if settings fail to load
  - Graceful degradation: use 5-zone defaults if custom zones invalid
- [ ] **Testing**

  - Unit tests for zone calculation functions
  - Test edge cases (very high/low HR, extreme paces)
  - Test settings persistence
  - Test default settings creation
  - Integration test: Update settings → See changes in charts

#### 3.2 Dashboard Layout & Navigation

**Goal:** Create a professional, responsive dashboard shell that adapts to browser screen size with clean navigation

Make as little hard coded variables where there should be a user decision:

- [ ] **Create Layout Components**

  - `Layout.tsx`: Main app container with sidebar and content area
  - `Sidebar.tsx`: Collapsible navigation menu with icons
  - `Header.tsx`: Top bar with user profile, sync status, and actions
  - Implement responsive breakpoints (mobile: <768px, tablet: 768-1024px, desktop: >1024px)
- [ ] **Sidebar Navigation**

  - Menu items:
    - Dashboard (home icon)
    - Activities (list icon)
    - Calendar (calendar icon)
    - Statistics (chart icon)
    - Settings (gear icon)
  - Active state highlighting
  - Collapse/expand functionality with hamburger menu
  - Persist sidebar state in localStorage
  - Smooth transitions and animations
- [ ] **Header Component**

  - Display athlete name and profile picture
  - "Sync Activities" button with last sync timestamp
  - Quick stats graph of total weekly km past 7 weeks
  - Logout button
  - Responsive: collapse to icons on mobile
- [ ] **Routing Setup**

  - Configure React Router for navigation
  - Routes:
    - `/dashboard` - Overview/home
    - `/activities` - Activity table view
    - `/activities/:id` - Single activity detail view
    - `/calendar` - Calendar view
    - `/stats` - Statistics dashboard (future)
  - Protected route wrapper for all dashboard pages

#### 3.3 Activity Table View

**Goal:** Display a comprehensive, sortable, and filterable table of running activities

- [ ] **Backend: Activity List Endpoint**

  - Create `GET /api/v1/activities/{athlete_id}` endpoint
  - Query parameters:
    - `limit`: Number of activities (default: 10, max: 100)
    - `offset`: Pagination offset
    - `sort_by`: Field to sort by (date, distance, avg pace)
    - `order`: asc/desc (default: desc by date)
    - `activity_type`: Filter by type (Run, Race, Workout)
  - Return: Array of activities with key fields
  - Add total count for pagination
- [ ] **Frontend: Activities Table Component**

  - Create `ActivitiesTable.tsx`
  - Columns:
    - Date (formatted: "Feb 13, 2026")
    - Name (clickable link to detail view)
    - Distance (km with 2 decimals)
    - Duration (formatted: "45:32")
    - Pace (min/km)
    - Heart Rate (avg, with icon indicator)
    - Elevation Gain (m)
    - Calories
  - Features:
    - Click row to navigate to detail view
    - Sortable columns (click header to sort)
    - Hover effects for better UX
    - Loading skeleton while fetching
    - Empty state when no activities
- [ ] **Pagination & Filtering**

  - Add pagination controls (Previous/Next, page numbers)
  - Items per page selector (10, 25, 50, 100)
  - Search/filter bar:
    - Text search by activity name
    - Date range picker
    - Distance range filter
    - Activity type dropdown
  - Clear filters button
- [ ] **Table Enhancements**

  - Export to CSV functionality
  - Row selection with bulk actions (future: delete, compare)
  - Responsive: horizontal scroll on mobile
  - Sticky header on scroll
  - Performance: Virtual scrolling for large datasets

#### 3.4 Activity Calendar View

**Goal:** Visual calendar showing activity distribution and patterns

**⚠️ NOTE:** Use user's `calendar_start_day` setting from section 3.1 to determine week start.

- [ ] **Calendar Library Setup**

  - Install `react-big-calendar` or `@fullcalendar/react`
  - Configure date formatting with `date-fns`
  - Set up calendar theming to match app design
  - **Configure week start day from user settings**
- [ ] **Backend: Calendar Data Endpoint**

  - Create `GET /api/v1/activities/{athlete_id}/calendar`
  - Query parameters:
    - `year`: Year to fetch (default: current year)
    - `month`: Optional month filter (1-12)
  - Return: Activities grouped by date with summary:
    ```json
    {
      "2026-02-13": {
        "activities": [...],
        "total_distance": 5000,
        "total_time": 1800,
        "count": 1
      }
    }
    ```
- [ ] **Frontend: Calendar Component**

  - Create `ActivityCalendar.tsx`
  - Month view as default
  - Each day cell shows:
    - activity name, type and short summery with coloring by type
  - Click on date to:
    - Show day detail panel with all activities
    - Quick view of activity stats
  - Navigation:
    - Previous/Next month buttons
    - Month/Year picker
    - "Today" button
- [ ] **Calendar Enhancements**

  - Week view and agenda view options
  - Heat map color scheme:
    - No activity: light gray
    - Light: green-100
    - Medium: green-400
    - Heavy: green-700
  - Weekly/Monthly distance goals with progress rings
  - Tooltips on hover showing quick stats

#### 3.5 Single Activity Detail View

**Goal:** Comprehensive view of a single activity with charts and map

- [ ] **Backend: Activity Detail Endpoint**

  - Enhance `GET /api/v1/activities/{athlete_id}/{activity_id}`
  - Return full activity data including:
    - All activity fields from model
    - Decoded polyline coordinates
    - Calculated splits (per km or mile)
    - Pace zones breakdown
    - Heart rate zones (if available)
- [ ] **Backend: Activity Streams Endpoint**

  - Create `GET /api/v1/activities/{athlete_id}/{activity_id}/streams`
  - Fetch detailed time-series data from Strava:
    - Time (seconds array)
    - Distance (meters array)
    - Altitude (meters array)
    - Velocity_smooth (m/s array)
    - Heartrate (bpm array)
    - Cadence (steps/min array)
    - Lat/Long (coordinate arrays for map)
  - Cache streams data for performance
  - Return normalized data ready for charting
- [ ] **Frontend: Activity Detail Page Component**

  - Create `ActivityDetail.tsx`
  - Layout structure:
    - Header section: Activity name, date, edit button
    - Stats grid: Distance, time, pace, elevation in cards
    - Map section: Full-width route visualization
    - Charts section: 2-column grid of time-series charts
    - Splits table: Kilometer/mile breakdown
    - Footer: Kudos count, achievement badges
- [ ] **Stats Cards Component**

  - Create `ActivityStats.tsx`
  - **USE USER SETTINGS:** Display distances/paces based on user's unit preference (km/miles)
  - Display cards for:
    - Distance (convert using user's `distance_unit` setting)
    - Moving Time & Elapsed Time
    - Average Pace (min/km or min/mile based on setting)
    - Elevation Gain/Loss (meters or feet based on setting)
    - Average Heart Rate (with zone indicator using user's HR zones)
    - Average Cadence
    - Calories Burned
    - Power (if available)
  - Each card:
    - Icon representing the metric
    - Large number display
    - Unit label
    - Comparison to personal best (optional)

#### 3.6 Charts Implementation (Recharts)

**Goal:** Interactive time-series charts for activity analysis

**⚠️ NOTE:** Use user settings from section 3.1 for zone colors, pace/HR zones, and unit preferences.

- [ ] **Chart Library Setup**

  - Install `recharts` package
  - Create reusable chart wrapper component
  - Define color scheme and theming
  - Configure responsive container
- [ ] **Core Chart Components**

  - Create `ActivityCharts.tsx` container
  - Individual chart components:
    - `PaceChart.tsx`: Pace over distance/time
    - `HeartRateChart.tsx`: HR with zone backgrounds
    - `ElevationChart.tsx`: Elevation profile
    - `CadenceChart.tsx`: Running cadence
    - `SpeedChart.tsx`: Speed variation
- [ ] **Chart Features**

  - All charts share:
    - Synchronized tooltips (hover shows all metrics at that point)
    - Zoom and pan functionality
    - Toggle between distance and time on X-axis
    - Responsive sizing
    - Loading skeleton
    - Empty state for missing data
  - Export chart as image (PNG)
  - Full-screen mode for detailed analysis
- [ ] **Pace Chart Implementation**

  - Line chart with `recharts` LineChart
  - X-axis: Distance (km/mi based on user setting) or Time (minutes)
  - Y-axis: Pace (min/km or min/mile based on user setting)
  - Features:
    - Gradient fill under line
    - Average pace reference line
    - **Use pace zones from user settings via `usePaceZones()` hook**
    - Color zones based on user's configured pace thresholds
    - Click to see split details
- [ ] **Heart Rate Chart Implementation**

  - Area chart with colored zones
  - **Background zones (USE USER SETTINGS from 3.1):**
    - Calculate zones using `useHrZones()` hook
    - Zone colors: Zone 1 (gray), Zone 2 (blue), Zone 3 (green), Zone 4 (orange), Zone 5 (red)
    - Use user's configured zone percentages and max HR
  - Line showing actual HR over time
  - Average and max HR indicators
  - Time in zone breakdown (pie chart below)
- [ ] **Elevation Chart Implementation**

  - Area chart showing elevation profile
  - Gradient fill (green to brown based on altitude)
  - Grade percentage overlay
  - Markers for:
    - Steepest climb
    - Highest point
    - Total gain/loss
  - Smooth interpolation for better visualization

#### 3.7 Map Visualization

**Goal:** Interactive map showing the route of the run

- [ ] **Map Library Selection & Setup**

  - Choose between:
    - **Leaflet** (free, open-source, lighter) - RECOMMENDED - We use this
    - **Mapbox GL** (more features, requires API key)
  - Install `react-leaflet` or `react-map-gl`
  - Install `polyline` package for decoding
  - Set up map tiles (OpenStreetMap for Leaflet)
- [ ] **Map Component Implementation**

  - Create `ActivityMap.tsx`
  - Decode polyline from activity data
  - Display route as polyline overlay
  - Configure map options:
    - Auto-fit bounds to route
    - Zoom controls
    - Scale indicator
    - Attribution
  - Default tile layer styling
- [ ] **Map Features**

  - Route visualization:
    - Green marker: Start point (with label)
    - Red marker: End point (with label)
    - Gradient line: Speed/pace color-coded
    - Arrows showing direction
  - Interactive markers:
    - Click on route to see stats at that point
    - Pause points (stationary markers)
    - Split markers every km/mile
  - Map controls:
    - Layer switcher (street, satellite, terrain)
    - Full-screen button
    - Center on route button
    - Export map as image
- [ ] **Advanced Map Features**

  - Synchronized chart-map interaction:
    - Hover on chart → marker moves on map
    - Click on map → charts highlight that point
  - Segment highlights (fastest km, slowest km)
  - Weather overlay (if API available)
  - Elevation shading on map
  - Side-by-side comparison for multiple activities

#### 3.8 Splits Table

**Goal:** Detailed breakdown of pace per kilometer/mile

**⚠️ NOTE:** Use user's `distance_unit` setting to determine split distance (1km or 1 mile).

- [ ] **Backend: Calculate Splits**

  - Add `calculate_splits()` helper function
  - Accept `unit` parameter (km or mile) from user settings
  - Generate splits data:
    - Distance: 1km or 1 mile segments based on user preference
    - Time for each segment
    - Pace for each segment (min/km or min/mile)
    - Elevation gain/loss per segment
    - Heart rate avg per segment
  - Handle final partial split
  - Return as array of split objects
- [ ] **Frontend: Splits Table Component**

  - Create `SplitsTable.tsx`
  - Columns:
    - Split # (1, 2, 3...)
    - Distance (1 km or variable for last split)
    - Time (mm:ss format)
    - Pace (min/km)
    - Elevation (+/- meters)
    - Heart Rate (avg for split)
    - Gap (difference from average pace)
  - Highlight:
    - Fastest split (green background)
    - Slowest split (red background)
    - Consistent splits (blue)
  - Summary row at bottom:
    - Total distance
    - Total time
    - Average pace
    - Total elevation

#### 3.9 UI Polish & UX Enhancements

**Goal:** Professional, polished user experience with excellent error handling

- [ ] **Loading States**

  - Skeleton loaders for:
    - Activity table rows
    - Chart containers
    - Map placeholder
    - Calendar cells
    - Stats cards
  - Spinner for sync operations
  - Progressive loading (show data as it arrives)
  - Loading percentage indicator for large datasets
- [ ] **Error Handling**

  - Error boundary component for React errors
  - Graceful degradation:
    - Show table if charts fail to load
    - Show text stats if map fails
    - Partial data display
  - User-friendly error messages:
    - Network errors
    - No activities found
    - Invalid activity ID
    - Token expired
  - Retry button for failed operations
  - Error logging to console for debugging
- [ ] **Responsive Design**

  - Mobile-first approach
  - Breakpoints:
    - Mobile: <640px
    - Tablet: 640-1024px
    - Desktop: >1024px
  - Mobile optimizations:
    - Collapsible sidebar → bottom nav
    - Single-column layout for charts
    - Simplified table (hide less important columns)
    - Touch-friendly controls (larger buttons)
    - Swipe gestures for navigation
  - Test on multiple screen sizes
- [ ] **Accessibility (A11y)**

  - ARIA labels for interactive elements
  - Keyboard navigation support:
    - Tab through controls
    - Enter to activate
    - Arrow keys for navigation
  - Focus indicators visible
  - Screen reader friendly:
    - Alt text for icons
    - Semantic HTML
    - Proper heading hierarchy
  - Color contrast compliance (WCAG AA)
  - Reduced motion option for animations
- [ ] **Performance Optimization**

  - Code splitting by route
  - Lazy load components:
    - Charts only when tab is active
    - Map only when scrolled into view
  - Image optimization (if profile pics added)
  - Debounce search/filter inputs
  - Memoize expensive calculations
  - Virtual scrolling for long lists
  - Service worker for offline capability (future)
- [ ] **Visual Design**

  - Consistent color palette:
    - Primary: Blue/Green (running theme)
    - Success: Green
    - Warning: Orange
    - Error: Red
    - Neutral: Gray scale
  - Typography:
    - Headers: Bold, clear hierarchy
    - Body: Readable size (16px base)
    - Monospace for times/numbers
  - Spacing: Consistent padding/margins (4px grid)
  - Shadows: Subtle elevations for depth
  - Animations:
    - Smooth transitions (200-300ms)
    - Fade-in for content loading
    - Slide-in for sidebars
    - Bounce for success feedback
- [ ] **Empty States**

  - "No activities yet" illustration
  - Call-to-action: "Sync your first activities"
  - Helpful tips or onboarding
  - Friendly, encouraging tone
- [ ] **Notifications & Feedback**

  - Toast notifications for:
    - Sync success/failure
    - Data saved
    - Errors occurred
  - Position: Top-right corner
  - Auto-dismiss after 5 seconds
  - Stack multiple notifications
  - Different styles per severity

#### 3.10 Testing & Quality Assurance

- [ ] **Component Testing**

  - Unit tests for utility functions
  - Component tests with React Testing Library
  - Mock API calls for testing
  - Test error scenarios
- [ ] **Integration Testing**

  - Test complete user flows:
    - Login → Sync → View activities
    - Navigate to activity detail
    - Filter and sort activities
  - Test responsive behavior
  - Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] **Performance Testing**

  - Lighthouse audit (aim for >90 score)
  - Bundle size analysis
  - Load time testing with large datasets
  - Memory leak detection

#### 3.11 Documentation

- [ ] **Code Documentation**

  - JSDoc comments for components
  - PropTypes or TypeScript interfaces
  - README in frontend/src/components
  - Storybook for component library (optional)
- [ ] **User Documentation**

  - In-app tooltips and help text
  - Keyboard shortcuts guide
  - FAQ section (future)
