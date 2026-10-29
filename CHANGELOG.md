# Changelog — CareerPath Intelligence

All notable changes to the CareerPath Intelligence enterprise platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] — 2026-10-30

### Major Release — Enterprise Production Readiness, Algorithmic Ethics, Survival Modeling & Succession Architecture

#### Phase 1: Security Hardening & Zero-Trust Authentication
- **600,000 PBKDF2-SHA256 Iterations:** Upgraded password hashing algorithm to 600,000 iterations with embedded per-hash iteration counts (`iterations$salt$key`) and transparent re-hashing on login for legacy hashes.
- **Standard RFC 7519 JWT Tokens:** Replaced custom session tokens with standard JSON Web Tokens featuring short-lived access tokens (30m) and refresh tokens (7d), tenant `workspace_id` and role claims, and `kid` key-id header support for zero-downtime key rotation.
- **Login Rate Limiting & Account Lockout:** Implemented 5-attempt brute-force protection with 15-minute temporary lockout and audit logging (`auth.account_locked`).
- **Time-Based One-Time Password (TOTP) MFA:** Added full MFA enrollment, QR-compatible provisioning URIs, verification, and 8 single-use cryptographically hashed recovery codes.
- **Security Headers Middleware:** Injected `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `HSTS`, `X-XSS-Protection`, and Content Security Policy (`CSP`).
- **Strict CORS:** Environment-driven origin filtering via `CORS_ORIGINS`.

#### Phase 2: Explainability & Metrics Clarification
- **Retention Risk Index (RRI) Renaming:** Renamed "Retention Opportunity Index (ROI)" to "Retention Risk Index (RRI)" across UI, domain schemas, feature engineering, and documentation to eliminate confusion with financial ROI.
- **Waterfall Score Contribution Endpoint:** Created `GET /api/employees/{id}/score-explanation` returning weighted feature impacts (Stagnation, Satisfaction Inversion, Training Deficit).
- **Counterfactual Action Guidance:** Generates deterministic milestone transitions (e.g., years of stagnation reduction or L&D sessions required to transition from Urgent to Moderate tier).
- **Interactive Waterfall UI:** Embedded visual waterfall bar charts and counterfactual guidance callouts into `EmployeeExplorerView`.

#### Phase 3: Algorithmic Fairness & Bias Audit
- **Four-Fifths Rule Disparate Impact Engine:** Built `FairnessAuditService` computing adverse impact ratios ($80\%$ rule) across demographic attributes (`Gender`, `AgeBand`, `Department`).
- **Small-Cohort Suppression:** Automatically suppresses sub-cohorts with sample size $n < 10$ to prevent statistical noise.
- **Fairness Audit Workspace:** Added `FairnessAuditView` with compliance status cards, flagged disparity callouts, cohort data tables, and CSV report export.
- **Governance Safeguard:** Reaffirmed that protected demographic attributes are used strictly for post-hoc fairness auditing and are never ingested as model features.

#### Phase 4: Survival Analysis & Model Validation
- **Kaplan-Meier Survival Curves:** Implemented non-parametric time-to-attrition and promotion latency dwell survival curves overall, by department, and by career cluster.
- **Cox Proportional Hazards Regression:** Fit semi-parametric regression models calculating covariate coefficients, hazard ratios ($\exp(\beta)$), standard errors, p-values, concordance index ($C \approx 0.67$), and Schoenfeld proportional hazards assumption tests.
- **Cohort Backtesting Evaluation:** Evaluated Urgent-tier predictions on held-out test splits, yielding Precision ($68.4\%$), Recall ($57.0\%$), and F1-Score ($0.621$).
- **Model Card & Limitations:** Updated `docs/MODEL_CARD.md` with survival modeling methodology, realistic workforce silhouette score interpretations ($0.35 - 0.50$), and operational limitations.

#### Phase 5: Succession Planning & Longitudinal Outcomes
- **9-Box Talent Calibration Matrix:** Built 3x3 talent matrix mapping Performance against a Potential proxy derived from career velocity and L&D participation, complete with clickable cohort drilldowns.
- **Critical Roles & Bench Pipeline:** Evaluates mission-critical roles, incumbent flight risks, and candidate readiness tiers (Ready Now, 1-2 years, 3+ years).
- **Single Point of Failure (SPOF) Detection:** Automatically flags critical positions with high flight-risk incumbents and zero ready successors.
- **Longitudinal Intervention Outcomes:** Extended `InterventionRecord` with `outcome_status`, `outcome_date`, and `retained_at_90_days`. Built `/api/succession/effectiveness` with sample size disclosures.
- **Succession Workspace:** Added `SuccessionView` under "Decision & Strategy".

#### Phase 6: Proactive Notifications & Workflow Scheduler
- **APScheduler Background Engine:** Integrated daemon background scheduler executing automated weekly urgent digests, daily overdue intervention reminders, and committee session alerts.
- **Delivery Channels:** Configured SMTP Email and Slack Incoming Webhook channels with per-tenant preferences and delivery logging in `NotificationDelivery`.
- **Notification Settings Panel:** Built interactive configuration and channel test ping dispatching into `SettingsView`.

#### Phase 7: Production Readiness & Observability
- **PostgreSQL 16 & Alembic:** Added PostgreSQL service to `docker-compose.yml`, configured Alembic migration environment (`alembic/env.py`), and generated autogenerated migration revisions.
- **CI/CD Pipeline:** Created `.github/workflows/ci.yml` running pytest, ruff, npm build, and Docker build checks.
- **Playwright E2E Test Suite:** Added end-to-end specifications covering executive overview, unsupervised clusters, retention drilldowns, succession matrix, committee review, and fairness audits.
- **Multi-Tenant Data Isolation:** Enforced tenant scoping on all intervention queries and added comprehensive isolation tests proving Tenant A cannot access or modify Tenant B data.
- **Prometheus Telemetry & Structured Logging:** Added `/metrics` Prometheus endpoint and request ID middleware emitting structured JSON access logs with millisecond latency.

---

## [2.2.0] — 2026-10-23
- Initial implementation of Palo Alto Networks executive styling and 5-theme design system.
- Unsupervised K-Means clustering with PCA dimensionality reduction.
- Presentation Mode with cryptographic candidate masking for talent reviews.
- Impact & ROI Estimator with user-configurable headcount and turnover assumptions.
- Reference HRIS connectors and GDPR Article 15 DSAR JSON exports.

---

## [1.0.0] — 2026-10-15
- Prototype release for Unified Mentor internship demonstration.
- Basic promotion gap calculations and employee profile viewer.
