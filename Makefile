.PHONY: dev-frontend dev-backend install test lint seed-demo docker-up docker-down

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && python -m uvicorn api.main:app --reload --port 8000

install:
	cd frontend && npm install
	pip install fastapi "uvicorn[standard]" pydantic pydantic-settings

seed-demo:
	python scripts/seed/demo_seed.py

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

test:
	pytest backend/tests/

lint:
	ruff check backend/
	cd frontend && npm run lint
