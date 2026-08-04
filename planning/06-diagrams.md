# 📊 Concentra — Diagrams

## 1. Sequence Diagram: Focus Monitoring Process

```mermaid
sequenceDiagram
    actor User
    participant Page as Web Page<br/>(Google Meet/YouTube/etc)
    participant CS as Content Script
    participant Cam as Camera<br/>(getUserMedia)
    participant MP as MediaPipe<br/>Face Landmarker
    participant FC as Focus<br/>Calculator
    participant OV as Overlay UI
    participant BG as Background<br/>Service Worker
    participant API as FastAPI<br/>Backend
    participant DB as PostgreSQL
    
    Note over User, DB: === INITIALIZATION ===
    User->>Page: Membuka halaman belajar
    CS->>CS: Detect page URL & type
    
    Note over User, DB: === START SESSION (via Popup) ===
    User->>BG: Klik "Start Session"
    BG->>API: POST /api/v1/sessions
    API->>DB: INSERT study_session
    DB-->>API: session_id
    API-->>BG: {session_id, status: 'active'}
    BG->>CS: START_DETECTION message
    
    Note over CS, MP: === CAMERA SETUP ===
    CS->>Cam: getUserMedia({video: true})
    Cam-->>CS: MediaStream
    CS->>MP: Inisialisasi FaceLandmarker
    MP-->>CS: Model loaded & ready
    CS->>OV: Tampilkan overlay indicator
    
    Note over CS, MP: === DETECTION LOOP (setiap frame) ===
    rect rgb(230, 245, 255)
        loop requestAnimationFrame (~30fps, sampling 1/s)
            CS->>MP: detect(videoFrame, timestamp)
            
            alt Wajah Terdeteksi
                MP-->>CS: {landmarks[], headPose, faceCount: 1}
                CS->>FC: calculateScore(landmarks, headPose)
                FC->>FC: Apply yaw/pitch penalties
                FC->>FC: Apply EMA smoothing
                FC-->>CS: {score: 85, level: 'high', direction: 'front'}
            else Wajah Tidak Terdeteksi
                MP-->>CS: {landmarks: [], faceCount: 0}
                CS->>FC: handleFaceMissing(duration)
                FC->>FC: Apply face-missing penalty
                FC-->>CS: {score: 45, level: 'low', faceMissing: true}
            else Multiple Wajah
                MP-->>CS: {landmarks[], faceCount: 2+}
                CS->>FC: handleMultipleFaces()
                FC-->>CS: {score: current, warning: 'multiple_faces'}
            end
            
            CS->>OV: updateIndicator(score, level, direction)
            CS->>CS: bufferFocusData(focusEntry)
        end
    end
    
    Note over CS, BG: === DATA SYNC (setiap 30 detik) ===
    rect rgb(255, 245, 230)
        loop Setiap 30 Detik
            CS->>BG: SYNC_DATA message + focusBuffer[]
            BG->>BG: Validate & prepare batch
            BG->>API: POST /api/v1/focus-logs/batch
            API->>API: Validate JWT + data
            API->>DB: Batch INSERT focus_logs
            DB-->>API: inserted_count
            API-->>BG: {synced: true, count: 30}
            BG-->>CS: SYNC_ACK
            CS->>CS: Clear synced buffer
        end
    end
    
    Note over User, DB: === PAUSE SESSION ===
    User->>BG: Klik "Pause"
    BG->>CS: PAUSE_DETECTION
    CS->>CS: Stop detection loop
    CS->>Cam: Keep stream alive (don't release)
    CS->>OV: Show "Paused" status
    BG->>API: PATCH /api/v1/sessions/{id} {action: 'pause'}
    API->>DB: UPDATE status='paused', paused_at=NOW()
    
    Note over User, DB: === RESUME SESSION ===
    User->>BG: Klik "Resume"
    BG->>CS: RESUME_DETECTION
    CS->>CS: Restart detection loop
    CS->>OV: Show "Active" status
    BG->>API: PATCH /api/v1/sessions/{id} {action: 'resume'}
    API->>DB: UPDATE status='active'
    
    Note over User, DB: === STOP SESSION ===
    User->>BG: Klik "Stop Session"
    BG->>CS: STOP_DETECTION
    CS->>CS: Final sync remaining buffer
    CS->>BG: FINAL_SYNC + remainingBuffer
    BG->>API: POST /api/v1/focus-logs/batch (final)
    CS->>Cam: stream.getTracks().forEach(t => t.stop())
    CS->>OV: Remove overlay
    
    BG->>API: PATCH /api/v1/sessions/{id} {action: 'stop'}
    API->>DB: UPDATE status='completed', compute durations
    
    Note over API, DB: === REPORT GENERATION ===
    BG->>API: POST /api/v1/reports/generate/{session_id}
    API->>DB: SELECT focus_logs WHERE session_id
    DB-->>API: All focus log entries
    API->>API: Calculate aggregates (avg, median, streaks, distribution)
    API->>API: Generate focus timeline
    API->>API: Generate summary & recommendations
    API->>DB: INSERT report
    DB-->>API: report data
    API-->>BG: {report}
    BG->>User: Tampilkan notifikasi report
```

## 2. Activity Diagram: User Journey

```mermaid
stateDiagram-v2
    [*] --> OpenApp: User buka Concentra
    
    state AuthCheck <<choice>>
    OpenApp --> AuthCheck: Cek status login
    
    AuthCheck --> LoginPage: Belum login
    AuthCheck --> Dashboard: Sudah login
    
    state LoginPage {
        [*] --> ShowLogin
        ShowLogin --> GoogleAuth: Klik Login Google
        GoogleAuth --> AuthSuccess: Berhasil
        GoogleAuth --> AuthFailed: Gagal
        AuthFailed --> ShowLogin: Coba lagi
    }
    
    AuthSuccess --> Dashboard
    
    state Dashboard {
        [*] --> ViewStats
        ViewStats --> ViewHistory: Lihat riwayat
        ViewStats --> StartNewSession: Mulai sesi baru
        ViewStats --> ViewReport: Lihat report
        ViewStats --> ViewSettings: Buka settings
        ViewHistory --> ViewSessionDetail: Pilih sesi
        ViewSessionDetail --> ViewReport
    }
    
    state ExtensionCheck <<choice>>
    StartNewSession --> ExtensionCheck: Cek extension
    
    ExtensionCheck --> InstallGuide: Extension belum terinstall
    ExtensionCheck --> CameraPermission: Extension tersedia
    
    InstallGuide --> ExtensionCheck: Setelah install
    
    state CameraPermission <<choice>>
    CameraPermission --> RequestCamera: Belum diizinkan
    CameraPermission --> StudySession: Sudah diizinkan
    
    RequestCamera --> CameraPermission: User merespon
    
    state StudySession {
        [*] --> SessionActive
        
        state SessionActive {
            [*] --> FaceDetecting
            FaceDetecting --> FocusCalculation: Face data
            FocusCalculation --> UpdateUI: Score computed
            UpdateUI --> DataBuffer: Buffer data
            DataBuffer --> BatchSync: Buffer penuh/30s
            BatchSync --> FaceDetecting: Lanjut
        }
        
        SessionActive --> SessionPaused: User pause
        SessionPaused --> SessionActive: User resume
        SessionActive --> SessionStopped: User stop
        SessionPaused --> SessionStopped: User stop
    }
    
    SessionStopped --> GenerateReport: Otomatis generate
    GenerateReport --> ViewReport
    
    ViewReport --> Dashboard: Kembali ke dashboard
    
    state ViewSettings {
        [*] --> ProfileSettings
        ProfileSettings --> NotificationSettings
        NotificationSettings --> ExtensionSettings
    }
    
    ViewSettings --> Dashboard: Kembali
    
    Dashboard --> Logout: User logout
    Logout --> [*]
```

## 3. State Diagram: Study Session States

```mermaid
stateDiagram-v2
    [*] --> Created: POST /sessions
    
    Created --> Active: auto-start
    
    Active --> Paused: PAUSE action
    Paused --> Active: RESUME action
    
    Active --> Completed: STOP action
    Paused --> Completed: STOP action
    
    Active --> Abandoned: Connection lost > 30 min
    Paused --> Abandoned: Paused > 60 min
    
    Completed --> [*]: Report generated
    Abandoned --> [*]: Marked as abandoned
    
    note right of Active
        - Face detection aktif
        - Focus scoring berjalan
        - Data di-buffer & sync
        - Timer berjalan
    end note
    
    note right of Paused
        - Face detection dihentikan
        - Camera stream tetap aktif
        - Timer dihentikan
        - pause_count += 1
    end note
    
    note right of Completed
        - Semua data di-sync
        - Camera dilepaskan
        - Durasi dihitung
        - Report di-generate
    end note
```

## 4. Component Interaction Diagram: Chrome Extension

```mermaid
graph TB
    subgraph "Chrome Extension"
        subgraph "Popup (popup.html)"
            P_LOGIN[Login Status]
            P_CTRL[Session Controls]
            P_STATS[Quick Stats]
        end
        
        subgraph "Background Service Worker"
            B_AUTH[Auth Manager]
            B_SESSION[Session Manager]
            B_SYNC[Data Syncer]
            B_OFFLINE[Offline Queue]
        end
        
        subgraph "Content Script (injected)"
            C_MAIN[Main Controller]
            C_CAM[Camera Manager]
            C_FACE[Face Detector]
            C_FOCUS[Focus Calculator]
            C_BUF[Data Buffer]
            C_OV[Overlay Renderer]
        end
    end
    
    subgraph "External"
        API[FastAPI Backend]
        STORAGE[Chrome Storage]
    end
    
    %% Popup → Background
    P_CTRL -->|"START/STOP/PAUSE"| B_SESSION
    P_LOGIN -->|"Check auth"| B_AUTH
    B_SESSION -->|"Session state"| P_STATS
    
    %% Background → Content Script
    B_SESSION -->|"START/STOP_DETECTION"| C_MAIN
    C_MAIN --> C_CAM
    C_CAM -->|"video frames"| C_FACE
    C_FACE -->|"landmarks, pose"| C_FOCUS
    C_FOCUS -->|"score, level"| C_OV
    C_FOCUS -->|"focus entry"| C_BUF
    
    %% Content Script → Background
    C_BUF -->|"SYNC_DATA (batch)"| B_SYNC
    
    %% Background → API
    B_SESSION -->|"CRUD sessions"| API
    B_SYNC -->|"POST focus-logs"| API
    B_AUTH -->|"JWT token"| API
    
    %% Background ↔ Storage
    B_AUTH -->|"Store token"| STORAGE
    B_OFFLINE -->|"Queue offline data"| STORAGE
    B_SYNC -->|"Retry failed"| B_OFFLINE
    
    style C_FACE fill:#e1f5fe
    style C_FOCUS fill:#fff3e0
    style B_SYNC fill:#e8f5e9
```

## 5. Data Flow Diagram: Focus Score Pipeline

```mermaid
flowchart LR
    subgraph "Input Layer"
        V[📷 Video Frame]
    end
    
    subgraph "Detection Layer"
        FD[Face Landmarker]
    end
    
    subgraph "Analysis Layer"
        LP[Landmark<br/>Processing]
        HP[Head Pose<br/>Estimation]
        FC[Face Count<br/>Check]
    end
    
    subgraph "Scoring Layer"
        YP[Yaw Penalty<br/>0-30 pts]
        PP[Pitch Penalty<br/>0-20 pts]
        FMP[Face Missing<br/>Penalty]
        BASE[Base Score<br/>100 pts]
    end
    
    subgraph "Smoothing Layer"
        RAW[Raw Score]
        EMA[Exponential<br/>Moving Average<br/>α=0.3]
        CLAMP[Clamp<br/>0-100]
    end
    
    subgraph "Output Layer"
        SCORE[Focus Score]
        LEVEL[Focus Level]
        DIR[Head Direction]
        ALERT[Alerts]
    end
    
    V --> FD
    FD --> LP
    FD --> HP
    FD --> FC
    
    LP --> YP
    LP --> PP
    HP --> YP
    HP --> PP
    FC --> FMP
    
    BASE --> RAW
    YP --> RAW
    PP --> RAW
    FMP --> RAW
    
    RAW --> EMA
    EMA --> CLAMP
    
    CLAMP --> SCORE
    CLAMP --> LEVEL
    HP --> DIR
    FC --> ALERT
```
