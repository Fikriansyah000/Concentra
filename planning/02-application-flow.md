# 🔄 Concentra — Application Flow

## 1. Flow Utama: Login hingga Laporan Sesi

```mermaid
flowchart TD
    START([User Membuka Concentra]) --> CHECK{Sudah Login?}
    
    CHECK -->|Tidak| LOGIN[Halaman Login]
    LOGIN --> GOOGLE[Login dengan Google OAuth]
    GOOGLE --> SUPA[Supabase Auth Verifikasi]
    SUPA --> JWT[Generate JWT Token]
    JWT --> STORE[Simpan Token di Storage]
    STORE --> DASH
    
    CHECK -->|Ya| DASH[Dashboard]
    
    DASH --> INSTALL{Extension Terinstall?}
    INSTALL -->|Tidak| GUIDE[Panduan Install Extension]
    GUIDE --> INSTALL2[User Install Extension]
    INSTALL2 --> DASH
    
    INSTALL -->|Ya| START_SESSION[Klik Start Session]
    START_SESSION --> CAM_PERM{Izin Kamera?}
    CAM_PERM -->|Tidak| REQ_PERM[Minta Izin Kamera]
    REQ_PERM --> CAM_PERM
    
    CAM_PERM -->|Ya| DETECT[Mulai Face Detection]
    DETECT --> MONITOR[Focus Monitoring Aktif]
    
    MONITOR --> REALTIME[Tampilkan Skor Real-time]
    MONITOR --> BATCH[Batch Data Setiap 30 Detik]
    BATCH --> API[Kirim ke Backend API]
    API --> DB[(Simpan ke Database)]
    
    MONITOR --> ACTIONS{User Action}
    ACTIONS -->|Pause| PAUSE[Pause Session & Detection]
    PAUSE --> RESUME[Resume Session]
    RESUME --> MONITOR
    
    ACTIONS -->|Stop| STOP[Stop Session]
    STOP --> GENERATE[Generate Report]
    GENERATE --> REPORT[Tampilkan Session Report]
    REPORT --> DASH
    
    ACTIONS -->|Lanjut Belajar| MONITOR
```

## 2. Flow Authentication

```mermaid
sequenceDiagram
    actor User
    participant App as React App
    participant Supa as Supabase Auth
    participant Google as Google OAuth
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    
    User->>App: Klik "Login dengan Google"
    App->>Supa: supabase.auth.signInWithOAuth({provider: 'google'})
    Supa->>Google: Redirect ke Google Sign-In
    Google->>User: Tampilkan consent screen
    User->>Google: Izinkan akses
    Google->>Supa: Authorization code
    Supa->>Supa: Exchange code → JWT + Refresh Token
    Supa->>App: Redirect callback dengan session
    App->>App: Simpan JWT di memory/storage
    
    App->>API: POST /api/auth/sync-user (JWT di header)
    API->>API: Verify JWT (Supabase public key)
    API->>DB: INSERT/UPDATE user record
    DB->>API: User data
    API->>App: User profile response
    App->>User: Redirect ke Dashboard
```

## 3. Flow Study Session

```mermaid
sequenceDiagram
    actor User
    participant Ext as Chrome Extension
    participant CS as Content Script
    participant MP as MediaPipe
    participant BG as Background SW
    participant API as FastAPI
    participant DB as PostgreSQL
    
    Note over User, Ext: === START SESSION ===
    User->>Ext: Klik "Start Session"
    Ext->>BG: runtime.sendMessage({type: 'START_SESSION'})
    BG->>API: POST /api/sessions
    API->>DB: INSERT study_session (status: 'active')
    DB->>API: session_id
    API->>BG: {session_id, started_at}
    BG->>CS: tabs.sendMessage({type: 'START_DETECTION'})
    
    Note over CS, MP: === FACE DETECTION LOOP ===
    CS->>CS: navigator.mediaDevices.getUserMedia()
    loop Setiap Frame (requestAnimationFrame)
        CS->>MP: faceLandmarker.detect(videoFrame)
        MP->>CS: {landmarks, headPose, faceCount}
        CS->>CS: Hitung Focus Score
        CS->>CS: Update Overlay UI
        CS->>CS: Buffer focus data
    end
    
    Note over CS, BG: === BATCH SYNC (setiap 30 detik) ===
    loop Setiap 30 Detik
        CS->>BG: sendMessage({type: 'SYNC_DATA', data: focusBuffer[]})
        BG->>API: POST /api/focus-logs/batch
        API->>DB: INSERT focus_logs (batch)
        DB->>API: OK
        API->>BG: {synced: true}
    end
    
    Note over User, Ext: === PAUSE/RESUME ===
    User->>Ext: Klik "Pause"
    Ext->>BG: sendMessage({type: 'PAUSE_SESSION'})
    BG->>CS: sendMessage({type: 'PAUSE_DETECTION'})
    CS->>CS: Stop detection loop, keep stream
    BG->>API: PATCH /api/sessions/{id} (status: 'paused')
    
    User->>Ext: Klik "Resume"
    Ext->>BG: sendMessage({type: 'RESUME_SESSION'})
    BG->>CS: sendMessage({type: 'RESUME_DETECTION'})
    CS->>CS: Restart detection loop
    BG->>API: PATCH /api/sessions/{id} (status: 'active')
    
    Note over User, Ext: === STOP SESSION ===
    User->>Ext: Klik "Stop Session"
    Ext->>BG: sendMessage({type: 'STOP_SESSION'})
    BG->>CS: sendMessage({type: 'STOP_DETECTION'})
    CS->>CS: Stop detection, release camera
    CS->>BG: sendMessage({type: 'FINAL_SYNC', data: remainingBuffer})
    BG->>API: POST /api/focus-logs/batch (final)
    BG->>API: PATCH /api/sessions/{id} (status: 'completed')
    BG->>API: POST /api/reports/generate/{session_id}
    API->>DB: Calculate aggregates, INSERT report
    DB->>API: Report data
    API->>BG: {report}
    BG->>Ext: Report summary
    Ext->>User: Tampilkan Session Report
```

## 4. Flow Focus Score Calculation

```mermaid
flowchart TD
    FRAME[Video Frame Input] --> DETECT{Wajah Terdeteksi?}
    
    DETECT -->|Tidak| MISSING[Face Missing]
    MISSING --> TIMER{Berapa Lama Missing?}
    TIMER -->|< 3 detik| GRACE[Grace Period - Skor Stabil]
    TIMER -->|3-10 detik| REDUCE1[Kurangi 2 poin/detik]
    TIMER -->|> 10 detik| REDUCE2[Kurangi 5 poin/detik]
    
    DETECT -->|Ya| MULTI{Jumlah Wajah?}
    MULTI -->|> 1| WARN[Warning: Multiple Faces]
    MULTI -->|1| POSE[Analisis Head Pose]
    
    POSE --> YAW{Yaw Angle}
    YAW -->|< 15°| FRONT[Menghadap Depan ✅]
    YAW -->|15°-30°| SLIGHT[Sedikit Berpaling ⚠️]
    YAW -->|> 30°| AWAY[Berpaling Jauh ❌]
    
    POSE --> PITCH{Pitch Angle}
    PITCH -->|Normal| OK_PITCH[Posisi OK]
    PITCH -->|Tunduk > 20°| DOWN[Menunduk ⚠️]
    
    FRONT --> CALC[Hitung Skor]
    SLIGHT --> CALC
    AWAY --> CALC
    OK_PITCH --> CALC
    DOWN --> CALC
    GRACE --> CALC
    REDUCE1 --> CALC
    REDUCE2 --> CALC
    
    CALC --> SMOOTH[Exponential Moving Average]
    SMOOTH --> CLAMP[Clamp 0-100]
    CLAMP --> OUTPUT[Focus Score Output]
    
    OUTPUT --> INDICATOR{Skor Level}
    INDICATOR -->|80-100| HIGH[🟢 Fokus Tinggi]
    INDICATOR -->|50-79| MED[🟡 Fokus Sedang]
    INDICATOR -->|20-49| LOW[🟠 Fokus Rendah]
    INDICATOR -->|0-19| CRIT[🔴 Tidak Fokus]
```

### Focus Score Formula

```
Base Score Calculation:
  - face_present = true → base = 100
  - face_present = false → base = previous_score - penalty_per_second

Head Pose Penalties:
  - yaw_penalty = max(0, (|yaw| - 15) * 2)     → 0-30 poin
  - pitch_penalty = max(0, (|pitch| - 20) * 1.5) → 0-20 poin

Distraction Multiplier:
  - consecutive_distraction < 5s  → multiplier = 1.0
  - consecutive_distraction 5-15s → multiplier = 1.5
  - consecutive_distraction > 15s → multiplier = 2.0

Final Score:
  raw_score = base - (yaw_penalty + pitch_penalty) * multiplier
  smoothed_score = α * raw_score + (1 - α) * previous_smoothed_score
  final_score = clamp(smoothed_score, 0, 100)
  
  dimana α = 0.3 (smoothing factor)
```

## 5. Flow Data Synchronization

```mermaid
flowchart TD
    subgraph "Client (Extension)"
        COLLECT[Collect Focus Data] --> BUFFER[In-Memory Buffer]
        BUFFER --> CHECK{Buffer Size > 100<br/>OR Timer > 30s?}
        CHECK -->|Ya| SEND[Kirim Batch ke Backend]
        CHECK -->|Tidak| COLLECT
        
        SEND --> ONLINE{Online?}
        ONLINE -->|Ya| HTTP[HTTP POST /api/focus-logs/batch]
        ONLINE -->|Tidak| LOCAL[Simpan ke chrome.storage.local]
        
        HTTP --> RESP{Response OK?}
        RESP -->|Ya| CLEAR[Clear Buffer]
        RESP -->|Tidak| RETRY{Retry Count < 3?}
        RETRY -->|Ya| WAIT[Wait dengan Exponential Backoff]
        WAIT --> HTTP
        RETRY -->|Tidak| LOCAL
        
        LOCAL --> QUEUE[Offline Queue]
        QUEUE --> LISTEN[Listen untuk Online Event]
        LISTEN --> SYNC[Sync Offline Data]
        SYNC --> HTTP
    end
    
    subgraph "Server (FastAPI)"
        HTTP --> VALIDATE[Validate JWT + Data]
        VALIDATE --> INSERT[Batch INSERT focus_logs]
        INSERT --> DB[(PostgreSQL)]
    end
```

## 6. Flow Report Generation

```mermaid
flowchart TD
    STOP[Session Stopped] --> TRIGGER[Trigger Report Generation]
    
    TRIGGER --> FETCH[Fetch All Focus Logs untuk Session]
    FETCH --> DB[(PostgreSQL)]
    
    DB --> CALC_DURATION[Hitung Total Durasi]
    DB --> CALC_AVG[Hitung Rata-rata Focus Score]
    DB --> CALC_DIST[Hitung Jumlah Distraksi]
    DB --> CALC_TIMELINE[Generate Focus Timeline]
    
    CALC_DURATION --> AGGREGATE[Aggregate Data]
    CALC_AVG --> AGGREGATE
    CALC_DIST --> AGGREGATE
    CALC_TIMELINE --> AGGREGATE
    
    AGGREGATE --> SUMMARY[Generate Summary Text]
    SUMMARY --> SAVE[Simpan Report ke Database]
    SAVE --> RETURN[Return Report ke Client]
    
    RETURN --> DISPLAY[Tampilkan di Dashboard]
    DISPLAY --> CHART[Grafik Timeline Fokus]
    DISPLAY --> STATS[Statistik Ringkasan]
    DISPLAY --> TIPS[Tips Peningkatan Fokus]
```
