from fastapi import APIRouter
from app.api.v1 import auth, sessions, focus_logs, reports, analytics

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(sessions.router)
api_router.include_router(focus_logs.router)
api_router.include_router(reports.router)
api_router.include_router(analytics.router)
