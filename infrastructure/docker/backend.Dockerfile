FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" pydantic pydantic-settings

COPY backend/ ./backend/

WORKDIR /app/backend
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
