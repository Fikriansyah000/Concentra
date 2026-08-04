# Concentra Monorepo Makefile

.PHONY: help db-up db-down migrate migrate-create backend-dev frontend-dev test seed

help:
	@echo "Concentra Command Helper"
	@echo "------------------------"
	@echo "make db-up          - Start local PostgreSQL database container"
	@echo "make db-down        - Stop local PostgreSQL database container"
	@echo "make migrate        - Run database migrations (Alembic)"
	@echo "make migrate-create - Create a new migration revision (usage: make migrate-create m='description')"
	@echo "make backend-dev    - Start FastAPI backend dev server"
	@echo "make frontend-dev   - Start Vite frontend dev server"
	@echo "make test           - Run backend unit tests"
	@echo "make seed           - Seed initial test data to local database"

db-up:
	docker-compose up -d db

db-down:
	docker-compose down

migrate:
	cd backend && alembic upgrade head

migrate-create:
	cd backend && alembic revision --autogenerate -m "$(m)"

backend-dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev:
	cd frontend && npm run dev

test:
	cd backend && pytest -v

seed:
	cd backend && python -m app.scripts.seed_data
