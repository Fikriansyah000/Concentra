# 🔌 Concentra — REST API Endpoints

## Base URL

- **Local:** `http://localhost:8000/api/v1`
- **Production:** `https://concentra-api.railway.app/api/v1`

## Authentication Headers

Semua endpoint (kecuali yang ditandai 🔓) memerlukan header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/auth/sync-user` | Sinkronisasi user setelah login Supabase | ✅ |
| GET | `/auth/me` | Get current user profile | ✅ |
| PATCH | `/auth/me` | Update user profile | ✅ |
| POST | `/auth/logout` | Logout (invalidate session server-side) | ✅ |
| GET | `/auth/health` | Health check endpoint | 🔓 |

### Detail

#### `POST /auth/sync-user`
Dipanggil setelah user berhasil login via Supabase. Membuat atau update record user di database backend.

**Request Body:**
```json
{
  "supabase_uid": "string",
  "email": "string",
  "full_name": "string",
  "avatar_url": "string | null"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2025-01-01T00:00:00Z",
  "is_new_user": false
}
```

#### `GET /auth/me`
**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2025-01-01T00:00:00Z",
  "last_login_at": "2025-06-01T10:00:00Z",
  "total_sessions": 45,
  "total_study_hours": 67.5
}
```

---

## 2. Study Session Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/sessions` | Create new session (start) | ✅ |
| GET | `/sessions` | List user sessions (with pagination) | ✅ |
| GET | `/sessions/{id}` | Get session detail | ✅ |
| PATCH | `/sessions/{id}` | Update session (pause/resume/stop) | ✅ |
| DELETE | `/sessions/{id}` | Delete session | ✅ |
| GET | `/sessions/active` | Get currently active session | ✅ |

### Detail

#### `POST /sessions`
Membuat sesi belajar baru.

**Request Body:**
```json
{
  "title": "string | null",
  "source_url": "string | null",
  "source_type": "google_meet | youtube | coursera | zoom | lms | other | null"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "active",
  "title": "Belajar Calculus",
  "source_url": "https://youtube.com/watch?v=...",
  "source_type": "youtube",
  "started_at": "2025-06-01T10:00:00Z",
  "created_at": "2025-06-01T10:00:00Z"
}
```

#### `GET /sessions`
Mengambil daftar sesi dengan pagination.

**Query Parameters:**
| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `page` | int | 1 | Halaman |
| `per_page` | int | 10 | Items per halaman |
| `status` | string | null | Filter: active/paused/completed |
| `sort_by` | string | started_at | Sort field |
| `sort_order` | string | desc | asc/desc |
| `from_date` | string | null | Filter tanggal mulai |
| `to_date` | string | null | Filter tanggal akhir |

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Belajar Calculus",
      "status": "completed",
      "source_type": "youtube",
      "started_at": "2025-06-01T10:00:00Z",
      "ended_at": "2025-06-01T11:30:00Z",
      "active_duration_seconds": 5400,
      "avg_focus_score": 78.5,
      "pause_count": 2
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 10,
  "total_pages": 5
}
```

#### `PATCH /sessions/{id}`
Update status sesi.

**Request Body:**
```json
{
  "action": "pause | resume | stop | abandon",
  "title": "string | null"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "paused",
  "paused_at": "2025-06-01T10:30:00Z",
  "pause_count": 1,
  "updated_at": "2025-06-01T10:30:00Z"
}
```

---

## 3. Focus Log Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/focus-logs/batch` | Batch insert focus logs | ✅ |
| GET | `/focus-logs/session/{session_id}` | Get logs for a session | ✅ |
| GET | `/focus-logs/session/{session_id}/timeline` | Get aggregated timeline | ✅ |
| GET | `/focus-logs/latest` | Get latest focus data (real-time) | ✅ |

### Detail

#### `POST /focus-logs/batch`
Batch insert focus logs dari extension (dikirim setiap 30 detik).

**Request Body:**
```json
{
  "session_id": "uuid",
  "logs": [
    {
      "focus_score": 85.5,
      "face_detected": true,
      "face_count": 1,
      "head_yaw": 5.2,
      "head_pitch": -3.1,
      "head_roll": 1.0,
      "head_direction": "front",
      "focus_level": "high",
      "is_distracted": false,
      "face_missing_duration_ms": 0,
      "recorded_at": "2025-06-01T10:00:01Z"
    },
    {
      "focus_score": 72.3,
      "face_detected": true,
      "face_count": 1,
      "head_yaw": 22.1,
      "head_pitch": -5.0,
      "head_roll": 2.3,
      "head_direction": "left",
      "focus_level": "medium",
      "is_distracted": false,
      "face_missing_duration_ms": 0,
      "recorded_at": "2025-06-01T10:00:02Z"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "inserted_count": 30,
  "session_id": "uuid",
  "latest_score": 72.3
}
```

#### `GET /focus-logs/session/{session_id}/timeline`
Mengambil data timeline yang sudah di-aggregate per interval.

**Query Parameters:**
| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `interval` | string | "1m" | Interval aggregasi: 10s, 30s, 1m, 5m |

**Response:** `200 OK`
```json
{
  "session_id": "uuid",
  "interval": "1m",
  "data": [
    {
      "timestamp": "2025-06-01T10:00:00Z",
      "avg_score": 85.2,
      "min_score": 72.0,
      "max_score": 95.0,
      "face_detected_ratio": 0.98,
      "distraction_count": 1,
      "dominant_direction": "front"
    }
  ]
}
```

---

## 4. Report Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/reports/generate/{session_id}` | Generate report untuk sesi | ✅ |
| GET | `/reports/{id}` | Get report by ID | ✅ |
| GET | `/reports/session/{session_id}` | Get report by session ID | ✅ |
| GET | `/reports` | List user reports | ✅ |
| DELETE | `/reports/{id}` | Delete report | ✅ |

### Detail

#### `POST /reports/generate/{session_id}`
Generate report untuk sesi yang sudah completed.

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "total_duration_seconds": 5400,
  "active_duration_seconds": 5100,
  "avg_focus_score": 78.5,
  "median_focus_score": 80.0,
  "max_focus_score": 98.0,
  "min_focus_score": 12.0,
  "total_distractions": 15,
  "total_face_missing_events": 3,
  "longest_focus_streak_seconds": 720,
  "longest_distraction_seconds": 45,
  "focus_time_percentage": 72.5,
  "focus_distribution": {
    "high": 45.0,
    "medium": 30.0,
    "low": 15.0,
    "critical": 10.0
  },
  "head_direction_summary": {
    "front": 65.0,
    "left": 15.0,
    "right": 12.0,
    "down": 8.0
  },
  "focus_timeline": [
    {"time": "2025-06-01T10:00:00Z", "score": 85},
    {"time": "2025-06-01T10:01:00Z", "score": 82}
  ],
  "summary_text": "Sesi belajar selama 1 jam 30 menit dengan fokus rata-rata 78.5%...",
  "recommendations": [
    "Coba kurangi distraksi di 15 menit terakhir",
    "Posisi terbaik Anda adalah di 30 menit pertama"
  ],
  "generated_at": "2025-06-01T11:30:05Z"
}
```

#### `GET /reports`
List reports dengan pagination.

**Query Parameters:**
| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `page` | int | 1 | Halaman |
| `per_page` | int | 10 | Items per halaman |
| `sort_by` | string | generated_at | Sort field |
| `sort_order` | string | desc | asc/desc |

---

## 5. Analytics Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/analytics/summary` | Overall user analytics summary | ✅ |
| GET | `/analytics/weekly` | Weekly statistics | ✅ |
| GET | `/analytics/daily` | Daily statistics | ✅ |
| GET | `/analytics/focus-trend` | Focus score trend over time | ✅ |
| GET | `/analytics/study-pattern` | Study pattern analysis | ✅ |

### Detail

#### `GET /analytics/summary`
Ringkasan analytics keseluruhan.

**Response:** `200 OK`
```json
{
  "total_sessions": 45,
  "total_study_time_seconds": 243000,
  "total_study_time_hours": 67.5,
  "overall_avg_focus_score": 75.3,
  "best_focus_score": 98.0,
  "total_distractions": 342,
  "avg_session_duration_minutes": 90,
  "current_streak_days": 5,
  "longest_streak_days": 12,
  "improvement_percentage": 12.5,
  "sessions_this_week": 8,
  "study_time_this_week_hours": 12.0
}
```

#### `GET /analytics/weekly`
Statistik per hari dalam seminggu terakhir.

**Query Parameters:**
| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `weeks` | int | 1 | Jumlah minggu ke belakang |

**Response:** `200 OK`
```json
{
  "period": "2025-05-26 to 2025-06-01",
  "days": [
    {
      "date": "2025-05-26",
      "day_name": "Monday",
      "session_count": 2,
      "total_duration_minutes": 180,
      "avg_focus_score": 80.2,
      "total_distractions": 12
    }
  ],
  "week_summary": {
    "total_sessions": 8,
    "total_hours": 12.0,
    "avg_focus": 75.3,
    "best_day": "Monday",
    "worst_day": "Friday"
  }
}
```

#### `GET /analytics/focus-trend`
Tren perkembangan fokus dari waktu ke waktu.

**Query Parameters:**
| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| `period` | string | "30d" | Period: 7d, 14d, 30d, 90d |
| `granularity` | string | "day" | Granularity: day, week |

**Response:** `200 OK`
```json
{
  "period": "30d",
  "granularity": "day",
  "data": [
    {
      "date": "2025-05-01",
      "avg_focus_score": 72.0,
      "session_count": 2,
      "study_minutes": 120
    }
  ],
  "trend": "improving",
  "trend_percentage": 8.5
}
```

#### `GET /analytics/study-pattern`
Analisis pola belajar (jam terbaik, hari terbaik).

**Response:** `200 OK`
```json
{
  "best_hour": 10,
  "best_hour_avg_focus": 85.2,
  "best_day": "Tuesday",
  "best_day_avg_focus": 82.0,
  "avg_session_duration_minutes": 75,
  "preferred_platform": "youtube",
  "hourly_distribution": [
    {"hour": 8, "session_count": 5, "avg_focus": 70.0},
    {"hour": 9, "session_count": 12, "avg_focus": 78.0},
    {"hour": 10, "session_count": 15, "avg_focus": 85.2}
  ]
}
```

---

## 6. Error Responses

Semua error menggunakan format standar:

```json
{
  "detail": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "optional_field_name"
  }
}
```

### Error Codes

| HTTP Status | Code | Deskripsi |
|-------------|------|-----------|
| 400 | `VALIDATION_ERROR` | Request body tidak valid |
| 401 | `UNAUTHORIZED` | Token tidak valid atau expired |
| 403 | `FORBIDDEN` | Tidak punya akses ke resource |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 409 | `CONFLICT` | Conflict (misal: session sudah active) |
| 422 | `UNPROCESSABLE_ENTITY` | Data valid tapi tidak bisa diproses |
| 429 | `RATE_LIMITED` | Terlalu banyak request |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 7. API Rate Limits

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Auth | 10 req | /menit |
| Sessions | 30 req | /menit |
| Focus Logs (batch) | 10 req | /menit |
| Reports | 20 req | /menit |
| Analytics | 30 req | /menit |
| Global per user | 100 req | /menit |
