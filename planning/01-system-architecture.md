# 📐 Concentra — System Architecture

## 1. High-Level Architecture Overview

Concentra menggunakan arsitektur **Client-Heavy + Lightweight Backend**, di mana semua proses berat (face detection, focus scoring) dilakukan di sisi browser/extension, sementara backend hanya menerima metadata hasil analisis.

```mermaid
graph TB
    subgraph "Client Side (Browser)"
        CE["Chrome Extension<br/>(Manifest V3)"]
        CS["Content Script<br/>(Injected ke halaman)"]
        BG["Background<br/>Service Worker"]
        MP["MediaPipe Tasks Vision<br/>(Face Landmarker)"]
        
        subgraph "React Web App (Vite + TS)"
            UI["Dashboard UI"]
            AUTH["Auth Module<br/>(Supabase Auth)"]
            STATE["State Management<br/>(Zustand)"]
            QUERY["Data Fetching<br/>(TanStack Query)"]
        end
    end
    
    subgraph "Backend (FastAPI)"
        API["REST API"]
        AUTHMW["JWT Auth Middleware"]
        SESS["Session Service"]
        FOCUS["Focus Log Service"]
        REPORT["Report Service"]
        ANALYTICS["Analytics Service"]
    end
    
    subgraph "Database (PostgreSQL - Neon)"
        DB[(PostgreSQL)]
        USERS["users"]
        SESSIONS["study_sessions"]
        LOGS["focus_logs"]
        REPORTS["reports"]
    end
    
    subgraph "External Services"
        SUPA["Supabase Auth<br/>(Google OAuth)"]
        VERCEL["Vercel<br/>(Frontend Hosting)"]
        RAILWAY["Railway<br/>(Backend Hosting)"]
    end
    
    CE --> CS
    CE --> BG
    CS --> MP
    MP -->|"Face Data (landmarks, head pose)"| CS
    CS -->|"Focus Score, Status"| BG
    BG -->|"Batch Data"| API
    
    UI --> AUTH
    UI --> STATE
    UI --> QUERY
    QUERY --> API
    AUTH --> SUPA
    
    API --> AUTHMW
    AUTHMW --> SESS
    AUTHMW --> FOCUS
    AUTHMW --> REPORT
    AUTHMW --> ANALYTICS
    
    SESS --> DB
    FOCUS --> DB
    REPORT --> DB
    ANALYTICS --> DB
    
    DB --> USERS
    DB --> SESSIONS
    DB --> LOGS
    DB --> REPORTS
```

## 2. Component Architecture

### 2.1 Chrome Extension Architecture

```mermaid
graph LR
    subgraph "Chrome Extension (Manifest V3)"
        POPUP["Popup UI<br/>(React)"]
        BG["Background<br/>Service Worker"]
        CS["Content Script"]
        
        subgraph "Content Script Modules"
            CAMERA["Camera Manager"]
            FACEDET["Face Detector<br/>(MediaPipe)"]
            FOCUSCALC["Focus Calculator"]
            OVERLAY["Overlay UI"]
        end
    end
    
    POPUP -->|"chrome.runtime.sendMessage"| BG
    BG -->|"chrome.tabs.sendMessage"| CS
    CS --> CAMERA
    CAMERA -->|"Video Stream"| FACEDET
    FACEDET -->|"Landmarks + Head Pose"| FOCUSCALC
    FOCUSCALC -->|"Focus Score"| OVERLAY
    FOCUSCALC -->|"Batch via BG"| BG
    BG -->|"HTTP POST"| API["Backend API"]
```

**Tanggung jawab masing-masing komponen:**

| Komponen | Tanggung Jawab |
|----------|---------------|
| **Popup** | UI kontrol sesi (Start/Stop/Pause), status ringkas, login state |
| **Background Service Worker** | Lifecycle management, batching data, komunikasi dengan backend API |
| **Content Script** | Inject ke halaman target, akses kamera, jalankan MediaPipe, hitung focus score |
| **Camera Manager** | Mengelola akses `getUserMedia`, stream kamera |
| **Face Detector** | Menjalankan MediaPipe Face Landmarker, ekstrak landmarks & head pose |
| **Focus Calculator** | Menghitung focus score berdasarkan face data |
| **Overlay UI** | Menampilkan indikator fokus real-time di halaman target |

### 2.2 React Web App Architecture

```mermaid
graph TB
    subgraph "React App (Vite + TypeScript)"
        subgraph "Pages"
            LOGIN["Login Page"]
            DASH["Dashboard"]
            SESSION["Session Detail"]
            HISTORY["Session History"]
            SETTINGS["Settings"]
        end
        
        subgraph "Core"
            ROUTER["React Router v6"]
            GUARD["Auth Guard"]
        end
        
        subgraph "State Layer"
            ZUSTAND["Zustand Store"]
            TQUERY["TanStack Query"]
        end
        
        subgraph "Services"
            AUTHSVC["Auth Service<br/>(Supabase)"]
            APISVC["API Service<br/>(Axios/Fetch)"]
        end
    end
    
    ROUTER --> GUARD
    GUARD --> LOGIN
    GUARD --> DASH
    GUARD --> SESSION
    GUARD --> HISTORY
    GUARD --> SETTINGS
    
    DASH --> ZUSTAND
    DASH --> TQUERY
    SESSION --> ZUSTAND
    SESSION --> TQUERY
    
    TQUERY --> APISVC
    LOGIN --> AUTHSVC
```

### 2.3 Backend Architecture

```mermaid
graph TB
    subgraph "FastAPI Backend"
        subgraph "API Layer"
            AUTHEP["Auth Endpoints"]
            SESSEP["Session Endpoints"]
            FOCUSEP["Focus Log Endpoints"]
            REPORTEP["Report Endpoints"]
            ANALYTICSEP["Analytics Endpoints"]
        end
        
        subgraph "Middleware"
            CORS["CORS Middleware"]
            JWT["JWT Verification"]
            RATE["Rate Limiter"]
        end
        
        subgraph "Service Layer"
            AUTHSVC["Auth Service"]
            SESSSVC["Session Service"]
            FOCUSSVC["Focus Service"]
            REPORTSVC["Report Service"]
            ANALYTICSSVC["Analytics Service"]
        end
        
        subgraph "Data Layer"
            MODELS["SQLAlchemy Models"]
            SCHEMAS["Pydantic Schemas"]
            ALEMBIC["Alembic Migrations"]
        end
        
        subgraph "Database"
            DB[(PostgreSQL)]
        end
    end
    
    CORS --> JWT
    JWT --> AUTHEP
    JWT --> SESSEP
    JWT --> FOCUSEP
    JWT --> REPORTEP
    JWT --> ANALYTICSEP
    
    AUTHEP --> AUTHSVC
    SESSEP --> SESSSVC
    FOCUSEP --> FOCUSSVC
    REPORTEP --> REPORTSVC
    ANALYTICSEP --> ANALYTICSSVC
    
    AUTHSVC --> MODELS
    SESSSVC --> MODELS
    FOCUSSVC --> MODELS
    REPORTSVC --> MODELS
    ANALYTICSSVC --> MODELS
    
    MODELS --> DB
    SCHEMAS -.-> AUTHEP
    SCHEMAS -.-> SESSEP
    SCHEMAS -.-> FOCUSEP
    SCHEMAS -.-> REPORTEP
    SCHEMAS -.-> ANALYTICSEP
    ALEMBIC -.-> DB
```

## 3. Data Flow Architecture

### 3.1 Real-time Focus Monitoring Data Flow

```
┌──────────────┐    Video Frame     ┌──────────────┐    Landmarks      ┌──────────────┐
│              │ ─────────────────> │              │ ──────────────── > │              │
│  Webcam      │                    │  MediaPipe   │                    │  Focus       │
│  (getUserMedia)                   │  Face        │    Head Pose       │  Calculator  │
│              │                    │  Landmarker  │ ──────────────── > │              │
└──────────────┘                    └──────────────┘                    └──────┬───────┘
                                                                              │
                                           Focus Score + Metadata             │
                                    ┌─────────────────────────────────────────┘
                                    │
                                    ▼
                            ┌──────────────┐    Batch (setiap 30s)    ┌──────────────┐
                            │  In-Memory   │ ──────────────────────> │  Background  │
                            │  Buffer      │                          │  Service     │
                            │              │                          │  Worker      │
                            └──────────────┘                          └──────┬───────┘
                                                                             │
                                                                    HTTP POST│(JWT)
                                                                             ▼
                                                                    ┌──────────────┐
                                                                    │  FastAPI     │
                                                                    │  Backend     │
                                                                    └──────┬───────┘
                                                                             │
                                                                             ▼
                                                                    ┌──────────────┐
                                                                    │  PostgreSQL  │
                                                                    │  (Neon)      │
                                                                    └──────────────┘
```

### 3.2 Batching Strategy

- **Interval:** Setiap 30 detik, data focus log di-batch dan dikirim ke backend
- **Buffer Size:** Maksimum 100 entries per batch
- **Retry:** 3x retry dengan exponential backoff jika gagal
- **Offline:** Data disimpan di `chrome.storage.local` jika offline, sync saat online kembali

## 4. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Authentication: Supabase Auth (Google OAuth 2.0)    │
│     └─ JWT Token issued by Supabase                     │
│                                                          │
│  2. API Security:                                        │
│     ├─ JWT verification on every request                │
│     ├─ CORS whitelist (frontend domain only)            │
│     └─ Rate limiting (100 req/min per user)             │
│                                                          │
│  3. Data Privacy:                                        │
│     ├─ NO video/image data sent to server               │
│     ├─ Only metadata (scores, timestamps, head pose)    │
│     ├─ Face processing 100% client-side                 │
│     └─ Camera stream never leaves browser               │
│                                                          │
│  4. Extension Security:                                  │
│     ├─ Minimal permissions (activeTab, storage)         │
│     ├─ Content Security Policy                          │
│     └─ Host permissions restricted to known domains     │
│                                                          │
│  5. Database Security:                                   │
│     ├─ Parameterized queries (SQLAlchemy ORM)           │
│     ├─ Connection pooling                               │
│     └─ SSL/TLS connection                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 5. Deployment Architecture

```mermaid
graph LR
    subgraph "Development"
        DEV_FE["localhost:5173<br/>(Vite Dev Server)"]
        DEV_BE["localhost:8000<br/>(FastAPI Uvicorn)"]
        DEV_DB["localhost:5432<br/>(PostgreSQL Local)"]
        DEV_EXT["Chrome Extension<br/>(Developer Mode)"]
    end
    
    subgraph "Production"
        VERCEL["Vercel<br/>(React Frontend)"]
        RAILWAY["Railway<br/>(FastAPI Backend)"]
        NEON["Neon PostgreSQL<br/>(Database)"]
        CWS["Chrome Web Store<br/>(Extension)"]
    end
    
    DEV_FE -.->|"Deploy"| VERCEL
    DEV_BE -.->|"Deploy"| RAILWAY
    DEV_DB -.->|"Migrate"| NEON
    DEV_EXT -.->|"Publish"| CWS
    
    VERCEL -->|"API Calls"| RAILWAY
    RAILWAY -->|"SQL"| NEON
```

## 6. Technology Stack Summary

| Layer | Technology | Versi | Alasan Pemilihan |
|-------|-----------|-------|-----------------|
| **Frontend Framework** | React + TypeScript | 18.x | Ekosistem besar, type-safety |
| **Build Tool** | Vite | 5.x | Fast HMR, optimal build |
| **Styling** | TailwindCSS | 3.x | Rapid UI development |
| **Routing** | React Router | 6.x | SPA routing standard |
| **State Management** | Zustand | 4.x | Lightweight, minimal boilerplate |
| **Data Fetching** | TanStack Query | 5.x | Caching, refetching, optimistic updates |
| **Face Detection** | MediaPipe Tasks Vision | 0.10.x | Client-side, no server needed |
| **Extension** | Chrome Manifest V3 | V3 | Standar terbaru Chrome |
| **Backend** | FastAPI | 0.100+ | Async, auto-docs, Pydantic v2 |
| **ORM** | SQLAlchemy | 2.x | Mature, async support |
| **Migration** | Alembic | 1.x | Standard untuk SQLAlchemy |
| **Validation** | Pydantic | 2.x | Fast validation, native FastAPI |
| **Auth** | Supabase Auth | Latest | Google OAuth built-in |
| **Database** | PostgreSQL | 15+ | ACID, relational, reliable |
| **DB Hosting** | Neon | - | Serverless PostgreSQL, free tier |
| **Frontend Deploy** | Vercel | - | Zero-config React deployment |
| **Backend Deploy** | Railway | - | Easy Python deployment |
