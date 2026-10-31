"""
CareerPath Intelligence - Main FastAPI Application
"""

import os
import sys
import uuid
import time
import json
import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.database.init_db import init_and_migrate_db
from backend.app.models.entities import InterventionRecord
from backend.app.api.endpoints import router
from backend.app.api.auth import router as auth_router
from backend.app.api.workspaces import router as workspaces_router
from backend.app.api.policy import router as policy_router
from backend.app.api.committee import router as committee_router
from backend.app.api.pilot import router as pilot_router
from backend.app.api.connectors import router as connectors_router
from backend.app.api.v1_public import router as public_router
from backend.app.api.governance import router as governance_router
from backend.app.api.fairness import router as fairness_router
from backend.app.api.validation import router as validation_router
from backend.app.api.succession import router as succession_router
from backend.app.api.notifications import router as notifications_router
from backend.app.api.snapshots import router as snapshots_router
from backend.app.api.manager import router as manager_router
from backend.app.api.models import router as models_router
from backend.app.api.compliance import router as compliance_router
from backend.app.services.scheduler_service import start_scheduler, stop_scheduler

# Initialize Database Schema & Run Migrations
init_and_migrate_db()

# Seed realistic demo interventions if database is brand new
def seed_initial_demo_interventions():
    db = SessionLocal()
    try:
        count = db.query(InterventionRecord).count()
        if count == 0:
            demo_items = [
                InterventionRecord(
                    workspace_id="default",
                    employee_id="PANW-1042",
                    department="Research & Development",
                    job_role="Research Scientist",
                    category="Promotion Readiness Review",
                    status="Under Review",
                    priority="Urgent",
                    action_plan="Schedule senior technical promotion panel with VP of Threat Intelligence.",
                    owner="Sarah Jenkins (Talent Partner)",
                    target_date="2026-11-15",
                    notes="Employee has 6.2 years tenure, outstanding peer feedback, but 4.8 years promotion gap."
                ),
                InterventionRecord(
                    workspace_id="default",
                    employee_id="PANW-1088",
                    department="Sales",
                    job_role="Sales Executive",
                    category="Internal Mobility Review",
                    status="Planned",
                    priority="Urgent",
                    action_plan="Discuss lateral rotation into Prisma Cloud Enterprise Accounts.",
                    owner="Marcus Vance (Sales Director)",
                    target_date="2026-11-30",
                    notes="Top quota performer for 3 consecutive years; feeling capped in current territory."
                ),
                InterventionRecord(
                    workspace_id="default",
                    employee_id="PANW-1120",
                    department="Research & Development",
                    job_role="Laboratory Technician",
                    category="Learning and Development",
                    status="New",
                    priority="Moderate",
                    action_plan="Enroll in Cloud Security Architect certification cohort and allocate 4 hrs/week study time.",
                    owner="Elena Rostova (Engineering Mgr)",
                    target_date="2026-12-01",
                    notes="Zero training sessions attended last year; highly motivated for technical upskilling."
                )
            ]
            db.add_all(demo_items)
            db.commit()
    finally:
        db.close()

seed_initial_demo_interventions()

app = FastAPI(
    title="CareerPath Intelligence API",
    description="Enterprise Career Progression, Promotion Gap & Retention Opportunity Analytics",
    version="2.0.0"
)

@app.on_event("startup")
def on_app_startup():
    start_scheduler()

@app.on_event("shutdown")
def on_app_shutdown():
    stop_scheduler()

# Readiness & Version Telemetry Endpoints
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "careerpath-api"}

@app.get("/ready")
def readiness_check():
    return {"status": "ready", "database": "connected", "engine": "SQLite 3"}

@app.get("/version")
def version_telemetry():
    return {
        "app": "CareerPath Intelligence",
        "version": "3.0.0",
        "build": "enterprise-pitch-release",
        "supported_workspaces": ["panw-cyber", "fintech-apex", "health-clinical"]
    }

# Prometheus Metrics Endpoint
_request_counter = {"GET": 0, "POST": 0, "PUT": 0, "DELETE": 0}

@app.get("/metrics")
def prometheus_metrics():
    from backend.app.services.analytics_service import analytics_service
    df = analytics_service.df_enriched
    total_records = len(df) if df is not None else 0
    urgent_records = int((df['RetentionPriority'] == 'Urgent').sum()) if df is not None and 'RetentionPriority' in df.columns else 0

    metrics_text = (
        "# HELP careerpath_http_requests_total Total HTTP requests handled by method.\n"
        "# TYPE careerpath_http_requests_total counter\n"
        f'careerpath_http_requests_total{{method="GET"}} {_request_counter.get("GET", 0)}\n'
        f'careerpath_http_requests_total{{method="POST"}} {_request_counter.get("POST", 0)}\n'
        f'careerpath_http_requests_total{{method="PUT"}} {_request_counter.get("PUT", 0)}\n'
        f'careerpath_http_requests_total{{method="DELETE"}} {_request_counter.get("DELETE", 0)}\n\n'
        "# HELP careerpath_active_workforce_records Total active workforce records loaded.\n"
        "# TYPE careerpath_active_workforce_records gauge\n"
        f"careerpath_active_workforce_records {total_records}\n\n"
        "# HELP careerpath_retention_urgent_total Total employees in urgent flight risk tier.\n"
        "# TYPE careerpath_retention_urgent_total gauge\n"
        f"careerpath_retention_urgent_total {urgent_records}\n"
    )
    return Response(content=metrics_text, media_type="text/plain; version=0.0.4; charset=utf-8")

# ── STRUCTURED JSON LOGGING & REQUEST ID MIDDLEWARE ──────────────────────────
logger = logging.getLogger("careerpath.access")

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = req_id
        start_time = time.time()

        # Update counter
        method = request.method.upper()
        if method in _request_counter:
            _request_counter[method] += 1

        response = await call_next(request)
        latency_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id

        log_payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "request_id": req_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "client_ip": request.client.host if request.client else "unknown"
        }
        # Avoid logging noisy health checks in normal logs
        if request.url.path not in ["/health", "/ready", "/metrics"]:
            logger.info(json.dumps(log_payload))

        return response

app.add_middleware(StructuredLoggingMiddleware)

# ── SECURITY HEADERS MIDDLEWARE ──────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https:;"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Strict CORS configuration via environment variables
cors_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(router)
app.include_router(auth_router)
app.include_router(workspaces_router)
app.include_router(policy_router)
app.include_router(committee_router)
app.include_router(pilot_router)
app.include_router(connectors_router)
app.include_router(public_router)
app.include_router(governance_router)
app.include_router(fairness_router)
app.include_router(validation_router)
app.include_router(succession_router)
app.include_router(notifications_router)
app.include_router(snapshots_router)
app.include_router(manager_router)
app.include_router(models_router)
app.include_router(compliance_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
