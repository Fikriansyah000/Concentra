# 🖥️ Concentra — Local Development Setup Guide

## Overview

Panduan ini menjelaskan cara menjalankan seluruh stack Concentra secara lokal untuk development dan testing. Semua komponen berjalan di mesin lokal tanpa memerlukan layanan cloud.

## Prerequisites

| Tool | Versi Minimum | Cara Install |
|------|--------------|--------------|
| Node.js | 18.x+ | [nodejs.org](https://nodejs.org) |
| npm | 9.x+ | Bundled dengan Node.js |
| Python | 3.11+ | [python.org](https://python.org) |
| PostgreSQL | 15+ | [postgresql.org](https://postgresql.org) atau via Docker |
| Docker (opsional) | 24+ | [docker.com](https://docker.com) |
| Chrome | Latest | [google.com/chrome](https://google.com/chrome) |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

---

## 1. Database Setup (PostgreSQL)

### Option A: Docker (Recommended)

```bash
# Jalankan PostgreSQL via Docker
docker run -d \
  --name concentra-db \
  -e POSTGRES_USER=concentra \
  -e POSTGRES_PASSWORD=concentra_dev_2024 \
  -e POSTGRES_DB=concentra_dev \
  -p 5432:5432 \
  -v concentra_pgdata:/var/lib/postgresql/data \
  postgres:15-alpine

# Verifikasi
docker exec -it concentra-db psql -U concentra -d concentra_dev -c "SELECT 1"
```

### Option B: Local PostgreSQL

```bash
# Buat database
createdb -U postgres concentra_dev

# Atau via psql
psql -U postgres
CREATE DATABASE concentra_dev;
CREATE USER concentra WITH PASSWORD 'concentra_dev_2024';
GRANT ALL PRIVILEGES ON DATABASE concentra_dev TO concentra;
\q
```

### Connection String
```
postgresql://concentra:concentra_dev_2024@localhost:5432/concentra_dev
```

---

## 2. Backend Setup (FastAPI)

```bash
# Masuk ke folder backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Dev tools
```

### Environment Variables

Buat file `backend/.env`:

```env
# App
APP_NAME=Concentra
APP_ENV=development
DEBUG=true
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql+asyncpg://concentra:concentra_dev_2024@localhost:5432/concentra_dev
DATABASE_URL_SYNC=postgresql://concentra:concentra_dev_2024@localhost:5432/concentra_dev

# Supabase Auth (untuk development, bisa pakai mock)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Atau gunakan local JWT untuk development
USE_LOCAL_AUTH=true
LOCAL_JWT_SECRET=dev-secret-key-change-in-production-please

# CORS
CORS_ORIGINS=http://localhost:5173,chrome-extension://your-extension-id

# Server
HOST=0.0.0.0
PORT=8000
```

### Database Migration

```bash
# Inisialisasi Alembic (hanya pertama kali)
alembic init alembic

# Jalankan migrasi
alembic upgrade head

# Buat migrasi baru (jika ada perubahan model)
alembic revision --autogenerate -m "description"
```

### Jalankan Backend

```bash
# Development mode dengan auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Atau dengan parameter lengkap
uvicorn app.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000 \
  --log-level debug
```

### Verifikasi Backend

```bash
# Health check
curl http://localhost:8000/api/v1/auth/health

# Swagger docs
# Buka browser: http://localhost:8000/docs

# ReDoc
# Buka browser: http://localhost:8000/redoc
```

---

## 3. Frontend Setup (React + Vite)

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies
npm install
```

### Environment Variables

Buat file `frontend/.env`:

```env
# API
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Atau gunakan local auth untuk development
VITE_USE_LOCAL_AUTH=true
VITE_LOCAL_AUTH_URL=http://localhost:8000

# App
VITE_APP_NAME=Concentra
VITE_APP_ENV=development
```

### Jalankan Frontend

```bash
# Development mode
npm run dev

# Frontend akan berjalan di http://localhost:5173
```

---

## 4. Chrome Extension Setup

```bash
# Masuk ke folder extension
cd extension

# Install dependencies
npm install
```

### Environment Variables

Buat file `extension/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_URL=http://localhost:5173
```

### Build Extension

```bash
# Build untuk development
npm run build:dev

# Output akan ada di extension/dist/
```

### Load Extension di Chrome

1. Buka Chrome → `chrome://extensions/`
2. Aktifkan **"Developer mode"** (toggle di kanan atas)
3. Klik **"Load unpacked"**
4. Pilih folder `extension/dist/`
5. Extension akan muncul di toolbar Chrome
6. Catat **Extension ID** yang diberikan Chrome
7. Update `CORS_ORIGINS` di backend `.env` dengan extension ID

```env
# Update di backend/.env
CORS_ORIGINS=http://localhost:5173,chrome-extension://abcdefghijklmnop
```

### Watch Mode (Auto-rebuild)

```bash
# Extension akan auto-rebuild saat ada perubahan
npm run dev

# Setelah rebuild, klik "Reload" di chrome://extensions/
```

---

## 5. Local Auth (Development Mode)

Untuk mempermudah development tanpa Supabase, gunakan local auth mock:

### Backend: Local Auth Endpoint

```python
# Tambah di backend/app/api/v1/auth.py (dev only)

@router.post("/dev/login")
async def dev_login(email: str = "dev@concentra.local"):
    """Development-only login endpoint"""
    if not settings.USE_LOCAL_AUTH:
        raise HTTPException(403, "Development auth disabled")
    
    # Create or get user
    user = await get_or_create_dev_user(email)
    
    # Generate local JWT
    token = create_access_token({"sub": str(user.id), "email": email})
    
    return {"access_token": token, "user": user}
```

### Frontend: Dev Login Button

```typescript
// Tampilkan tombol "Dev Login" hanya di development
{import.meta.env.VITE_USE_LOCAL_AUTH === 'true' && (
  <button onClick={handleDevLogin}>
    🔧 Dev Login (Skip OAuth)
  </button>
)}
```

---

## 6. Testing Face Detection Locally

### Camera Testing Page

Buat halaman test khusus untuk debug face detection tanpa extension:

```
http://localhost:5173/dev/face-test
```

Halaman ini akan:
1. Mengakses webcam
2. Menjalankan MediaPipe Face Landmarker
3. Menampilkan:
   - Video preview dengan face overlay
   - Landmarks visualization
   - Head pose values (yaw, pitch, roll)
   - Focus score real-time
   - Face detection status
4. Log semua data ke console

### Test di Halaman Nyata

1. Buka YouTube / Google Meet / Coursera
2. Klik icon extension Concentra di toolbar
3. Klik "Start Session"
4. Izinkan akses kamera
5. Overlay fokus akan muncul di sudut halaman
6. Monitor console (F12 → Console) untuk debug output

---

## 7. Docker Compose (Full Stack)

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: concentra-db
    environment:
      POSTGRES_USER: concentra
      POSTGRES_PASSWORD: concentra_dev_2024
      POSTGRES_DB: concentra_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U concentra -d concentra_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: concentra-backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://concentra:concentra_dev_2024@db:5432/concentra_dev
      - USE_LOCAL_AUTH=true
      - LOCAL_JWT_SECRET=dev-secret-key
      - CORS_ORIGINS=http://localhost:5173
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: concentra-frontend
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api/v1
      - VITE_USE_LOCAL_AUTH=true
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host 0.0.0.0

volumes:
  pgdata:
```

### Jalankan Full Stack

```bash
# Start semua services
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop
docker-compose down

# Stop dan hapus data
docker-compose down -v
```

---

## 8. Development Workflow

### Daily Development Flow

```
1. Start database
   → docker start concentra-db (atau docker-compose up db -d)

2. Start backend
   → cd backend && venv\Scripts\activate && uvicorn app.main:app --reload

3. Start frontend
   → cd frontend && npm run dev

4. Build & load extension
   → cd extension && npm run dev
   → Reload di chrome://extensions/

5. Open test page
   → http://localhost:5173 (Dashboard)
   → Open YouTube/Google Meet untuk test extension
```

### Useful Commands

```bash
# Backend
cd backend
alembic upgrade head              # Run migrations
alembic downgrade -1              # Rollback 1 migration
pytest                            # Run tests
pytest --cov=app                  # Run tests with coverage

# Frontend
cd frontend
npm run dev                       # Dev server
npm run build                     # Production build
npm run lint                      # Lint check
npm run type-check                # TypeScript check

# Extension
cd extension
npm run build:dev                 # Dev build
npm run build                     # Production build
npm run watch                     # Watch mode

# Database
docker exec -it concentra-db psql -U concentra -d concentra_dev
# SQL queries langsung di psql
```

---

## 9. Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Port 5432 sudah dipakai | Stop local PostgreSQL: `net stop postgresql-x64-15` (Windows) |
| Extension tidak ke-load | Pastikan `manifest.json` valid, check chrome://extensions errors |
| CORS error | Tambahkan origin di `CORS_ORIGINS` backend env |
| Camera tidak aktif | Check `chrome://settings/content/camera`, pastikan HTTPS atau localhost |
| MediaPipe gagal load | Pastikan WASM files ada di `web_accessible_resources` |
| JWT invalid | Regenerate token, check secret key match |
| Database connection refused | Pastikan PostgreSQL running: `docker ps` |
| Face detection lambat | Kurangi resolusi video, enable frame skipping |

### Debug Tools

```bash
# Check if backend is running
curl http://localhost:8000/docs

# Check database connection
docker exec -it concentra-db pg_isready -U concentra

# Check extension background console
# chrome://extensions → Concentra → "Inspect views: service worker"

# Check content script console
# F12 di halaman target → Console → filter "Concentra"
```

---

## 10. Seed Data (untuk Testing)

```bash
# Backend: seed sample data
cd backend
python -m app.scripts.seed_data

# Atau via API:
# 1. Login (dev mode)
curl -X POST http://localhost:8000/api/v1/auth/dev/login?email=test@example.com

# 2. Create session
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Session", "source_type": "youtube"}'

# 3. Add focus logs
curl -X POST http://localhost:8000/api/v1/focus-logs/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<session_id>", "logs": [...]}'
```
