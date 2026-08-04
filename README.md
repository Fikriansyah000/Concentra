# 👁️ Concentra

**Concentra** adalah Platform Pemantauan Tingkat Konsentrasi Belajar Online secara *Real-time* berbasis AI dan *Face Detection*. Proyek ini dibangun dengan arsitektur modern (FastAPI Backend, React Web Dashboard, dan Chrome Extension) untuk membantu siswa dan profesional melacak, menganalisis, dan meningkatkan fokus mereka saat belajar atau bekerja di depan layar.

## 🚀 Fitur Utama
- **Face & Head Pose Detection**: Mendeteksi arah wajah dan pergerakan kepala menggunakan *MediaPipe Face Landmarker* secara real-time langsung di browser (client-side).
- **Privacy-First**: Pemrosesan wajah dilakukan 100% di browser pengguna. Tidak ada data gambar atau video yang dikirimkan ke server.
- **Focus Scoring Algorithm**: Menghitung *Focus Score* secara dinamis berdasarkan kalkulasi pergerakan *pitch, yaw, dan roll* kepala.
- **Chrome Extension Integration**: Terintegrasi tanpa gangguan di atas *platform* belajar apapun (Google Meet, YouTube, Coursera, dll).
- **Comprehensive Analytics**: Dashboard interaktif yang menyajikan laporan mendalam mengenai pola fokus, durasi, dan tren harian/mingguan.

## 🛠️ Tech Stack
Proyek ini menggunakan struktur *Monorepo* yang memisahkan Backend, Frontend, dan Chrome Extension:

- **Backend (API Layer)**
  - Framework: FastAPI (Python)
  - Database: PostgreSQL (Neon) & SQLite (Local Dev)
  - ORM: SQLAlchemy + Alembic
  - Authentication: Supabase JWT Auth
- **Frontend (Web Dashboard)**
  - Framework: React 18 + Vite + TypeScript
  - Styling: TailwindCSS + Glassmorphism UI
  - State Management: Zustand + TanStack Query
  - Data Visualization: Recharts
- **Chrome Extension (Sensor)** *(Under Development)*
  - Core: Manifest V3, React, Background Service Workers
  - AI Engine: Google MediaPipe Face Landmarker

## 📂 Struktur Proyek
```
Concentra/
├── backend/       # FastAPI server & Database models
├── frontend/      # React Web Dashboard
├── extension/     # Chrome Extension (TBA)
├── planning/      # Dokumentasi Roadmap, ERD, Flow, & Arsitektur
└── README.md
```

## 💻 Cara Menjalankan Lokal (Development)

### 1. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Akses di `http://localhost:5173`. Anda dapat menggunakan **Dev Fast Login** untuk masuk ke Dashboard tanpa setup database.

### 2. Menjalankan Backend
Pastikan Anda memiliki Python 3.12+ (disarankan) terinstal.
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # (Linux/Mac) atau .venv\Scripts\Activate.ps1 (Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Akses API Docs di `http://localhost:8000/docs`.

## 📜 Roadmap Status
Proyek ini dibangun secara bertahap selama 8 minggu (lihat `planning/07-roadmap.md`). Saat ini berada di tahap **Penyelesaian Frontend (Week 3/4)**.

---
*Dibangun untuk produktivitas yang lebih baik. 🚀*
