# 📁 Concentra — Project Structure

## 1. Monorepo Root Structure

```
concentra/
├── 📁 frontend/                    # React Web Application
├── 📁 backend/                     # FastAPI Backend
├── 📁 extension/                   # Chrome Extension
├── 📁 shared/                      # Shared types & constants
├── 📁 planning/                    # Planning documents
├── 📁 docs/                        # Additional documentation
├── .gitignore
├── .env.example
├── README.md
├── docker-compose.yml              # Local development
├── docker-compose.dev.yml          # Dev overrides
└── Makefile                        # Common commands
```

## 2. Frontend Structure (React + Vite + TypeScript)

```
frontend/
├── 📁 public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── manifest.json
│
├── 📁 src/
│   ├── 📁 assets/                  # Static assets
│   │   ├── 📁 images/
│   │   ├── 📁 icons/
│   │   └── 📁 fonts/
│   │
│   ├── 📁 components/              # Reusable UI components
│   │   ├── 📁 ui/                  # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 charts/             # Chart components
│   │   │   ├── FocusLineChart.tsx
│   │   │   ├── FocusDistributionPie.tsx
│   │   │   ├── WeeklyBarChart.tsx
│   │   │   ├── FocusHeatmap.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 layout/             # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   │
│   │   ├── 📁 session/            # Session-related components
│   │   │   ├── SessionTimer.tsx
│   │   │   ├── SessionControls.tsx
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionList.tsx
│   │   │   └── ActiveSessionBanner.tsx
│   │   │
│   │   ├── 📁 focus/              # Focus monitoring components
│   │   │   ├── FocusIndicator.tsx
│   │   │   ├── FocusScoreGauge.tsx
│   │   │   ├── FocusTimeline.tsx
│   │   │   └── DistractionAlert.tsx
│   │   │
│   │   └── 📁 report/             # Report components
│   │       ├── ReportSummary.tsx
│   │       ├── ReportTimeline.tsx
│   │       ├── ReportStats.tsx
│   │       ├── ReportCard.tsx
│   │       └── ReportExport.tsx
│   │
│   ├── 📁 pages/                   # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SessionDetailPage.tsx
│   │   ├── SessionHistoryPage.tsx
│   │   ├── ReportPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── 📁 hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   ├── useFocusData.ts
│   │   ├── useWebSocket.ts        # Optional: real-time updates
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useExtensionStatus.ts
│   │
│   ├── 📁 stores/                  # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── sessionStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   │
│   ├── 📁 services/                # API service layer
│   │   ├── api.ts                  # Axios/fetch instance
│   │   ├── authService.ts
│   │   ├── sessionService.ts
│   │   ├── focusService.ts
│   │   ├── reportService.ts
│   │   └── analyticsService.ts
│   │
│   ├── 📁 queries/                 # TanStack Query hooks
│   │   ├── useSessionQueries.ts
│   │   ├── useFocusQueries.ts
│   │   ├── useReportQueries.ts
│   │   ├── useAnalyticsQueries.ts
│   │   └── queryClient.ts
│   │
│   ├── 📁 lib/                     # Utility libraries
│   │   ├── supabase.ts             # Supabase client init
│   │   ├── utils.ts                # Helper functions
│   │   ├── constants.ts
│   │   ├── formatters.ts           # Date, number formatters
│   │   └── validators.ts
│   │
│   ├── 📁 types/                   # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── session.types.ts
│   │   ├── focus.types.ts
│   │   ├── report.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   │
│   ├── 📁 routes/                  # Route configuration
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── routeConfig.ts
│   │
│   ├── 📁 styles/                  # Global styles
│   │   └── globals.css
│   │
│   ├── App.tsx                     # App entry
│   ├── main.tsx                    # Vite entry point
│   └── vite-env.d.ts
│
├── .env
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 3. Backend Structure (FastAPI + SQLAlchemy)

```
backend/
├── 📁 app/
│   ├── 📁 api/                     # API routes
│   │   ├── 📁 v1/                  # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Auth endpoints
│   │   │   ├── sessions.py         # Session CRUD
│   │   │   ├── focus_logs.py       # Focus log endpoints
│   │   │   ├── reports.py          # Report endpoints
│   │   │   └── analytics.py       # Analytics endpoints
│   │   │
│   │   ├── __init__.py
│   │   ├── router.py               # Main API router
│   │   └── deps.py                 # Dependencies (get_db, get_current_user)
│   │
│   ├── 📁 core/                    # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py               # Settings (pydantic-settings)
│   │   ├── security.py             # JWT verification, Supabase auth
│   │   ├── database.py             # Database engine & session
│   │   └── exceptions.py           # Custom exceptions
│   │
│   ├── 📁 models/                  # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── base.py                 # Base model class
│   │   ├── user.py                 # User model
│   │   ├── study_session.py        # StudySession model
│   │   ├── focus_log.py            # FocusLog model
│   │   └── report.py               # Report model
│   │
│   ├── 📁 schemas/                 # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── auth.py                 # Auth request/response schemas
│   │   ├── session.py              # Session schemas
│   │   ├── focus_log.py            # Focus log schemas
│   │   ├── report.py               # Report schemas
│   │   ├── analytics.py            # Analytics schemas
│   │   └── common.py               # Shared schemas (pagination, etc.)
│   │
│   ├── 📁 services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── session_service.py
│   │   ├── focus_service.py
│   │   ├── report_service.py
│   │   └── analytics_service.py
│   │
│   ├── 📁 utils/                   # Utility functions
│   │   ├── __init__.py
│   │   ├── focus_calculator.py     # Server-side focus calculations
│   │   ├── report_generator.py     # Report generation logic
│   │   └── helpers.py
│   │
│   ├── __init__.py
│   └── main.py                     # FastAPI app instance
│
├── 📁 alembic/                     # Database migrations
│   ├── 📁 versions/                # Migration files
│   │   └── 001_initial.py
│   ├── env.py
│   ├── script.py.mako
│   └── README
│
├── 📁 tests/                       # Test suite
│   ├── 📁 api/
│   │   ├── test_auth.py
│   │   ├── test_sessions.py
│   │   ├── test_focus_logs.py
│   │   └── test_reports.py
│   ├── 📁 services/
│   │   ├── test_session_service.py
│   │   ├── test_focus_service.py
│   │   └── test_report_service.py
│   ├── conftest.py
│   └── __init__.py
│
├── .env
├── .env.example
├── alembic.ini
├── pyproject.toml                  # Python project config
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
└── README.md
```

## 4. Chrome Extension Structure (Manifest V3 + React + TypeScript)

```
extension/
├── 📁 public/
│   ├── manifest.json               # Manifest V3
│   ├── 📁 icons/
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── 📁 models/                  # MediaPipe model files
│       └── face_landmarker.task     # MediaPipe face landmarker model
│
├── 📁 src/
│   ├── 📁 popup/                   # Popup UI (React)
│   │   ├── 📁 components/
│   │   │   ├── PopupHeader.tsx
│   │   │   ├── SessionControl.tsx
│   │   │   ├── FocusStatus.tsx
│   │   │   ├── LoginPrompt.tsx
│   │   │   └── QuickStats.tsx
│   │   ├── Popup.tsx               # Popup root component
│   │   ├── popup.html              # Popup HTML entry
│   │   ├── popup.tsx               # Popup React entry
│   │   └── popup.css
│   │
│   ├── 📁 content/                 # Content Script
│   │   ├── 📁 modules/
│   │   │   ├── CameraManager.ts    # Webcam access & management
│   │   │   ├── FaceDetector.ts     # MediaPipe Face Landmarker wrapper
│   │   │   ├── FocusCalculator.ts  # Focus score computation
│   │   │   ├── HeadPoseEstimator.ts # Head rotation estimation
│   │   │   ├── DataBuffer.ts       # Focus data buffering
│   │   │   └── OverlayRenderer.ts  # On-page overlay UI
│   │   │
│   │   ├── 📁 overlay/            # Overlay UI components
│   │   │   ├── FocusOverlay.ts     # Main overlay container
│   │   │   ├── FocusIndicator.ts   # Score indicator widget
│   │   │   ├── StatusBadge.ts      # Status badge (detecting/paused)
│   │   │   └── overlay.css         # Overlay styles
│   │   │
│   │   ├── content.ts              # Content script entry
│   │   └── contentMain.ts          # Main logic orchestrator
│   │
│   ├── 📁 background/             # Background Service Worker
│   │   ├── background.ts           # Service worker entry
│   │   ├── SessionManager.ts       # Session lifecycle management
│   │   ├── ApiClient.ts            # Backend API communication
│   │   ├── DataSyncer.ts           # Batch data synchronization
│   │   ├── AuthManager.ts          # Token management
│   │   └── OfflineQueue.ts         # Offline data queue
│   │
│   ├── 📁 shared/                  # Shared between popup/content/background
│   │   ├── 📁 types/
│   │   │   ├── messages.types.ts   # Chrome messaging types
│   │   │   ├── session.types.ts
│   │   │   ├── focus.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── constants.ts
│   │   ├── messaging.ts            # Type-safe messaging utilities
│   │   └── storage.ts              # Chrome storage utilities
│   │
│   └── 📁 utils/
│       ├── logger.ts               # Extension logging utility
│       └── permissions.ts          # Permission checking utilities
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts                  # Vite config for extension build
├── tailwind.config.ts
└── README.md
```

### Chrome Extension `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Concentra - Focus Monitor",
  "version": "1.0.0",
  "description": "Monitor tingkat konsentrasi Anda saat belajar online dengan Face Detection",
  
  "permissions": [
    "activeTab",
    "storage",
    "alarms",
    "tabs"
  ],
  
  "host_permissions": [
    "https://meet.google.com/*",
    "https://*.zoom.us/*",
    "https://www.youtube.com/*",
    "https://www.coursera.org/*",
    "https://*.udemy.com/*",
    "*://*/*"
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": ["models/*", "overlay.css"],
      "matches": ["<all_urls>"]
    }
  ],
  
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  },
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

## 5. Shared Types Structure

```
shared/
├── 📁 types/
│   ├── session.types.ts
│   ├── focus.types.ts
│   ├── report.types.ts
│   ├── user.types.ts
│   └── api.types.ts
│
├── 📁 constants/
│   ├── focusLevels.ts
│   ├── sessionStatus.ts
│   └── headDirections.ts
│
└── package.json
```

## 6. Docker Configuration (Local Development)

```
docker-compose.yml
├── services:
│   ├── db (PostgreSQL 15)
│   │   └── ports: 5432
│   ├── backend (FastAPI)
│   │   └── ports: 8000
│   └── frontend (Vite dev server) [optional]
│       └── ports: 5173
```
