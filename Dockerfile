# Multi-stage Dockerfile for CareerPath Intelligence
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Production Runtime
FROM python:3.12-slim AS runner
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY data/ ./data/
COPY ml/ ./ml/

# Copy built frontend static bundle
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize database schemas and seed tenant data
RUN python backend/app/database/init_db.py

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:///./backend/careerpath.db

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
