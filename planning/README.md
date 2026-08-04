# 📋 Concentra — Planning Documents Index

> **Concentra** adalah aplikasi Web + Chrome Extension untuk memonitor tingkat konsentrasi pengguna saat belajar online menggunakan teknologi Face Detection berbasis browser (MediaPipe Tasks Vision).

---

## 📂 Daftar Dokumen Perencanaan

| # | Dokumen | Deskripsi | Link |
|---|---------|-----------|------|
| 01 | **System Architecture** | Arsitektur sistem, komponen, data flow, security, deployment | [📐 Buka](./01-system-architecture.md) |
| 02 | **Application Flow** | Flow aplikasi dari login hingga report, focus score calculation | [🔄 Buka](./02-application-flow.md) |
| 03 | **Database ERD** | Entity Relationship Diagram, SQL schema, indexes, query patterns | [🗄️ Buka](./03-database-erd.md) |
| 04 | **Project Structure** | Struktur folder frontend, backend, dan chrome extension | [📁 Buka](./04-project-structure.md) |
| 05 | **API Endpoints** | Daftar lengkap REST API endpoints dengan request/response schema | [🔌 Buka](./05-api-endpoints.md) |
| 06 | **Diagrams** | Sequence diagram, activity diagram, state diagram, component diagram | [📊 Buka](./06-diagrams.md) |
| 07 | **Roadmap** | Roadmap 8 minggu, milestone mingguan, deliverables | [🗺️ Buka](./07-roadmap.md) |
| 08 | **Risks & Mitigation** | 12 risiko teknis dengan strategi mitigasi | [⚠️ Buka](./08-risks-and-mitigation.md) |
| 09 | **Future Development** | Saran pengembangan lanjutan (Eye Blink, Emotion, AI Prediction) | [🚀 Buka](./09-future-development.md) |
| 10 | **Local Development** | Panduan setup local testing (Docker, database, backend, frontend, extension) | [🖥️ Buka](./10-local-development.md) |

---

## 🏗️ Technology Stack

```
┌────────────────────────────────────────────────────────────────┐
│                        CONCENTRA STACK                         │
├────────────────┬──────────────────┬────────────────────────────┤
│   Frontend     │   Backend        │   Infrastructure           │
│                │                  │                            │
│ • React 18     │ • FastAPI        │ • Vercel (Frontend)        │
│ • TypeScript   │ • SQLAlchemy 2   │ • Railway (Backend)        │
│ • Vite 5       │ • Alembic        │ • Neon (PostgreSQL)        │
│ • TailwindCSS  │ • Pydantic v2    │ • Supabase (Auth)          │
│ • React Router │ • JWT Auth       │ • Docker (Local Dev)       │
│ • Zustand      │ • Python 3.11+   │                            │
│ • TanStack Q   │                  │                            │
├────────────────┼──────────────────┤                            │
│  Extension     │   Face Detection │                            │
│                │                  │                            │
│ • Manifest V3  │ • MediaPipe      │                            │
│ • React        │   Tasks Vision   │                            │
│ • TypeScript   │ • Face Landmarker│                            │
│ • Content Script                  │                            │
│ • Service Worker                  │                            │
└────────────────┴──────────────────┴────────────────────────────┘
```

---

## 🎯 MVP Features Checklist

- [ ] Authentication (Google OAuth via Supabase)
- [ ] Dashboard (stats, history, weekly chart)
- [ ] Study Session (start/pause/resume/stop + timer)
- [ ] Chrome Extension (popup, content script, background SW)
- [ ] Face Detection (MediaPipe Face Landmarker)
- [ ] Focus Monitoring (score 0-100, head pose, indicators)
- [ ] Session Report (duration, avg score, timeline, distractions)
- [ ] Backend API (CRUD + Analytics)
- [ ] Database (PostgreSQL: users, sessions, focus_logs, reports)

---

## ⏱️ Timeline Overview

```
Week 1  ████░░░░  Foundation & Backend Core
Week 2  ████████  Backend Complete & Testing
Week 3  ████████  Frontend Core & Auth
Week 4  ████████  Frontend Features & Charts
Week 5  ████████  Chrome Extension
Week 6  ████████  Face Detection & Focus Score
Week 7  ████████  Integration & E2E Testing
Week 8  ████████  Polish, Deploy & Documentation
```

**Total Estimated Effort: ~333 jam (8 minggu × ~42 jam/minggu)**
