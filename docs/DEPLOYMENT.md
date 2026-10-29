# CareerPath Intelligence — Deployment & Infrastructure Guide

This guide covers building, configuring, and deploying CareerPath Intelligence in local, Docker, and enterprise cloud environments.

---

## 1. Quickstart with Docker Compose

The fastest way to deploy the complete application stack (FastAPI backend + Vite React frontend + SQLite database) is using Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/organization/careerpath-intelligence.git
cd careerpath-intelligence

# 2. Copy the environment template
cp .env.example .env

# 3. Build and launch containers
docker-compose up -d --build

# 4. Verify running health
docker-compose ps
```

The application will be accessible at:
- **Frontend Dashboard:** `http://localhost:5173`
- **FastAPI REST API Docs:** `http://localhost:8000/docs`
- **Health Check Endpoint:** `http://localhost:8000/health`

---

## 2. Manual Local Development Setup

### Backend (Python 3.10+):
```bash
# Create virtual environment
python -m venv venv
# Activate on Windows:
venv\Scripts\activate
# Activate on macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed default tenants & users
python backend/app/database/init_db.py

# Launch FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend (Node.js 18+):
```bash
cd frontend

# Install packages
npm install

# Run Vite dev server
npm run dev
```

---

## 3. Environment Variables Reference (`.env`)

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./backend/careerpath.db` | SQLite or PostgreSQL connection string |
| `SECRET_KEY` | `cp-super-secret-production-signing-key` | Secret key for signing session tokens and webhooks |
| `DEFAULT_WORKSPACE` | `panw-cyber` | Initial tenant identifier |
| `PORT` | `8000` | Backend API listen port |
| `VITE_API_BASE` | `/api` | Frontend proxy target for API requests |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed CORS origins |

---

## 4. Production Hardening Checklist

- [x] PBKDF2-HMAC-SHA256 password hashing (100,000 iterations).
- [x] Scoped RBAC permissions for all API routers.
- [x] Multi-tenant partition separation on all database entities.
- [x] Cryptographic HMAC-SHA256 signatures on outgoing webhooks.
- [x] SQLite append-only audit trail logging.
- [x] GDPR Article 15 automated Data Subject Access Request export.
- [x] Bias-resistant presentation mode with pseudonymization.
