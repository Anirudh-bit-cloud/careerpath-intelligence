# CareerPath Intelligence — Deployment & Infrastructure Guide

**Version:** 3.0.0  
**Target Environments:** Local Development, Docker Compose, Enterprise Kubernetes, AWS / GCP / Azure Container Services

---

## 1. Quickstart with Docker Compose (PostgreSQL 16 Stack)

The complete production stack includes the FastAPI backend, modern Vite React frontend, and a dedicated PostgreSQL 16 database with automated schema migration.

```bash
# 1. Clone the repository
git clone https://github.com/organization/careerpath-intelligence.git
cd careerpath-intelligence

# 2. Copy the environment template
cp .env.example .env

# 3. Build and launch containers
docker-compose up -d --build

# 4. Verify running services and database health
docker-compose ps
```

The application will be accessible at:
- **Frontend Dashboard:** `http://localhost:5173`
- **FastAPI REST API Docs:** `http://localhost:8000/docs`
- **Prometheus Metrics:** `http://localhost:8000/metrics`
- **Health Check Endpoint:** `http://localhost:8000/health`
- **PostgreSQL Database:** `localhost:5432` (db: `careerpath_db`, user: `careerpath`)

---

## 2. Database Migrations with Alembic

CareerPath Intelligence version 3.0.0 uses Alembic for declarative schema versioning and zero-downtime database upgrades.

```bash
# Apply all pending migrations to database
alembic upgrade head

# Generate a new migration revision based on entity model changes
alembic revision --autogenerate -m "describe_schema_change"

# Rollback one migration step
alembic downgrade -1
```

---

## 3. Manual Local Development Setup

### Backend (Python 3.12+):
```bash
# Create virtual environment
python -m venv venv
# Activate on Windows:
venv\Scripts\activate
# Activate on macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
pip install pyjwt pyotp apscheduler lifelines alembic psycopg2-binary ruff mypy

# Run database schema migrations
alembic upgrade head
python backend/app/database/init_db.py

# Launch FastAPI server with live reload
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend (Node.js 20+):
```bash
cd frontend

# Install packages
npm install

# Run Vite dev server
npm run dev

# Run production build and type checking
npm run build
```

---

## 4. Environment Variables Reference (`.env`)

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://careerpath:careerpath_secret@localhost:5432/careerpath_db` | Connection URI (supports SQLite or PostgreSQL) |
| `JWT_SECRET_KEY` | `cp-jwt-super-secret-production-signing-key` | HMAC-SHA256 signing key for JWT tokens |
| `JWT_KEY_RING` | `{"k2026-01": "cp-jwt-super-secret-production-signing-key"}` | Key ID rotation map supporting zero-downtime key rotation |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173` | Strict comma-separated allowed CORS origins |
| `DEFAULT_WORKSPACE` | `panw-cyber` | Initial tenant identifier |
| `PORT` | `8000` | Backend API listen port |
| `SMTP_HOST` | `smtp.internal.corp` | Outbound mail server for scheduled digests |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Destination webhook for urgent alerts |

---

## 5. Enterprise Monitoring & Telemetry

### Prometheus Scraping
Configure your Prometheus scraper targeting `/metrics`:

```yaml
scrape_configs:
  - job_name: 'careerpath-intelligence'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api.careerpath.internal:8000']
    scrape_interval: 15s
```

Exposed Metrics:
- `careerpath_http_requests_total`: Counter by method (GET, POST, PUT, DELETE)
- `careerpath_active_workforce_records`: Gauge of loaded workforce records
- `careerpath_retention_urgent_total`: Gauge of employees in Urgent Retention Risk Tier

### Request Tracing & Structured Logging
Every HTTP response carries an `X-Request-ID` header. Structured JSON access logs emit timestamp, request ID, status code, client IP, and millisecond latency for ingestion by Datadog, Splunk, or AWS CloudWatch.
