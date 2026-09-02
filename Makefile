.PHONY: dev-frontend dev-backend install test lint

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && python -m uvicorn api.main:app --reload --port 8000

install:
	cd frontend && npm install
	pip install -e ".[dev]"

test:
	pytest backend/tests/

lint:
	ruff check backend/
	cd frontend && npm run lint
