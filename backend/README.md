# 🐍 Concentra Backend (FastAPI + SQLAlchemy)

Backend REST API untuk Concentra Focus Monitoring.

## Requirements
- Python 3.11+
- PostgreSQL 15+ (atau via Docker)

## Quick Start (Local)

1. **Setup Virtual Environment:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Database Migration:**
   ```bash
   alembic upgrade head
   ```

4. **Run Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **API Documentation:**
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
