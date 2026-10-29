# CareerPath Intelligence — Comprehensive Project Implementation Report

**Project Title:** CareerPath Intelligence — Enterprise Workforce Progression & Proactive Retention Platform  
**Architecture:** Full-Stack Enterprise SaaS (React 18 + TypeScript + Vite / FastAPI + SQLAlchemy + SQLite / Scikit-Learn)  
**Version:** 2.2.0 Enterprise Release  
**Report Generated:** October 2026  

---

## 1. Executive Summary & Vision

**CareerPath Intelligence** is an enterprise-grade workforce analytics, career progression intelligence, and proactive retention platform. Built for HR leaders, People Analytics teams, and Talent Calibration Committees, it transforms workforce retention from **reactive exit surveys** to **proactive, explainable intelligence**.

The platform is designed to eliminate two major enterprise failure modes:
1. **Silent Stagnation:** High-performing employees spending 3–5 years at the same job level without promotion calibration, leading to avoidable turnover ("quiet quitting").
2. **Black-Box AI:** Unexplainable machine learning scores or fabricated financial ROI figures that fail regulatory audits, EEOC compliance, and employee trust.

The application couples **mathematical clustering**, **empirical level-dwell benchmarks**, **100% explainable scoring formulas**, **bias-resistant talent committee calibration**, and **enterprise-grade data security** (PBKDF2 hashing, signed session tokens, HMAC-SHA256 webhooks, and GDPR Article 15 compliance).

---

## 2. Complete Architecture & System Topography

```mermaid
flowchart TD
    subgraph Client Application [Frontend: React 18 + TypeScript + Vite]
        UI["Navigation & App Shell<br/>(Sidebar, TopNav, Command Palette)"]
        THEME["Multi-Theme Engine<br/>(5 Themes, Swatches, Dot Matrix)"]
        ROUTER["Dynamic Workspaces<br/>(15 Views / Workspaces)"]
        UI --> ROUTER
        THEME --> UI
    end

    subgraph API Layer [Backend: FastAPI Python 3.12]
        EP["Endpoints Router<br/>(/api/overview, /clusters, /promotion-gap)"]
        AUTH["Auth & RBAC Router<br/>(/api/auth/login, /me, /users)"]
        COMM["Committee Router<br/>(/api/committee/sessions, /decisions)"]
        POL["Policy Engine<br/>(/api/policy, /preview)"]
        CONN["Connectors Router<br/>(/api/connectors/test-hris)"]
        PUB["Public V1 API & Webhooks<br/>(/api/v1/roster, /keys, /webhooks)"]
        GOV["Governance Router<br/>(/api/governance/audit-logs, /dsar)"]
    end

    subgraph Analytical Core [ML & Analytics Engine]
        KM["K-Means Clustering Engine<br/>(k=4 Validated via Silhouette & Elbow)"]
        PCA["2D PCA Dimensionality Reduction"]
        BENCH["Empirical Level Dwell Curves"]
        ROI["Retention Opportunity Index<br/>(100% Explainable Weighted Formula)"]
        REC["Deterministic Recommendations Engine"]
    end

    subgraph Persistence & Storage [Multi-Tenant Database]
        DB[(SQLite / PostgreSQL<br/>workspace_id Partitioned)]
        SEEDS["Industry Presets<br/>(Cyber: 1,470 | Health: 1,200 | Finance: 1,350)"]
    end

    ROUTER -->|Async Fetch Client| EP & AUTH & COMM & POL & CONN & PUB & GOV
    EP & POL --> Analytical Core
    Analytical Core --> Persistence & Storage
    AUTH & COMM & CONN & PUB & GOV --> Persistence & Storage
```

---

## 3. Frontend Implementation Details

The frontend is a single-page application built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**. It adheres to a razor-sharp enterprise design system inspired by Linear, Vercel, and modern financial terminals.

### 3.1 Brand Identity & Design System
- **Brand Logo (`BrandLogo.tsx`):** A custom vector glyph composed of an upward progression chevron, forward velocity arrow, and stabilization anchor. Scalable from 16px to 48px with dynamic accent color fills and white-label organization title support.
- **Hairline Hardware Aesthetics (`index.css`):** 1px borders (`border-cp-border`), subtle elevations, rounded-xl containers, and an optional toggleable dot-matrix telemetry canvas grid.
- **Tabular Numerical Precision:** Enforces tabular numbers (`font-mono`, `font-feature-settings: 'tnum'`) across all data grids, dwell years, percentages, and financial metrics to prevent layout shifts.

### 3.2 Live 5-Theme Engine (`ThemeContext.tsx`)
Users can switch visual themes instantaneously without reloading the application:
1. **Midnight Executive (Linear Navy):** Deep space navy background (`#090B10`), razor-hairline borders (`#20293D`), electric cobalt accent (`#4F75FF`), and cyan telemetry.
2. **Vercel Monolith (Obsidian):** Pitch black OLED canvas (`#000000`), subtle silver borders, and high-contrast monochrome highlights.
3. **Stripe Precision (Arctic Light):** Editorial white surfaces (`#FFFFFF`), cool slate hairline borders (`#E2E8F0`), and deep indigo typography.
4. **Bloomberg Terminal (Emerald):** Dark pine canvas (`#07130E`) with high-visibility financial emerald highlights (`#10B981`).
5. **Raycast Cyber (Neon Violet):** Deep carbon surfaces (`#0D0B14`) with electric violet accents (`#8B5CF6`).
- **Accent Color Overrides:** Cobalt, Cyan, Emerald, Amber, Rose, and Violet.
- **Density Modes:** Switchable between `Compact` (high-density data tables) and `Comfortable` (spacious presentation layouts).

### 3.3 Navigation Shell & Global Controls
- **Sidebar (`Sidebar.tsx`):** Grouped into *Analytics & Models*, *Decision & Strategy*, and *System & Governance*. Features status badges (`ML`, `Urgent`, `New`, `ROI`, `API`), dataset provenance indicator, user profile avatar, and collapse/expand controls.
- **Top Navigation (`TopNav.tsx`):**
  - **Global Employee Search:** Live debounced auto-complete searching by ID, job role, or department with instant modal preview.
  - **Industry Preset Switcher:** Dropdown switching active dataset cohorts between *Cybersecurity & Cloud*, *Healthcare Clinical Ops*, and *Financial Services & Quant*.
  - **Guided Tour Trigger:** Direct launcher for the 7-step spotlight walkthrough.
  - **Urgent Retention Action Center:** Notification popover displaying flagged flight-risk employees.
  - **Theme Studio Dropdown:** Quick-access color swatches and theme picker.
- **Command Palette (`CommandPalette.tsx`):** `Ctrl+K` modal enabling keyboard-first workspace navigation and instant employee lookups.
- **Keyboard Shortcuts (`ShortcutsModal.tsx`):** `?` modal listing quick keys (`Alt+1` to `Alt+9`, `Ctrl+K`, `ESC`).
- **Guided Spotlight Tour (`GuidedTourModal.tsx`):** 7-step modal walking pitch evaluators through executive telemetry, ML clustering, promotion gap curves, ROI index, committee mode, connectors, and security governance.

---

## 4. Frontend Workspaces & Views

| Workspace / View | Route / ID | Primary Function & Features |
| :--- | :--- | :--- |
| **Public Landing Page** | `welcome` | Enterprise SaaS pitch page with hero section, live metrics strip, architectural pillars, and an interactive "Request an Enterprise Pilot" modal saving to `/api/pilot/leads`. |
| **Executive Overview** | `overview` | High-level workforce health dashboard with dynamic KPIs (Active Profiles, Stagnation Rate, Urgent Retention Opportunities, Average Promotion Dwell), department distribution charts, and flight risk breakdown. |
| **Career Clusters & Archetypes** | `clusters` | Interactive 2D PCA scatter plot of workforce archetypes, cluster centroid metrics table, Elbow Curve & Silhouette validation drawer, and live reclustering parameter simulator. |
| **Promotion Gap Monitor** | `promotion-gap` | Level dwell benchmark curves, promotion latency distribution, role/department filters, sortable data table, and direct employee drawer inspection. |
| **Retention Opportunities** | `retention-opportunities` | Explainable Retention Opportunity Index table, priority tier filters (Urgent, Moderate, Standard), deterministic rule-based recommendations, and one-click intervention creation modal. |
| **Talent Committee Review** | `committee` | Multi-session talent calibration review hub with **Presentation Mode** (candidate pseudonymization `CANDIDATE-9A4B`), formal decision terminal (Approve, Defer, Reject), and executive meeting minutes editor. |
| **Impact & ROI Estimator** | `impact-estimator` | 100% assumption-driven business case calculator based on user-entered headcount, turnover rate, and replacement costs (zero pre-filled or fabricated savings), with scenario modeling and text briefing export. |
| **Employee Explorer** | `employees` | Deep individual employee dossier featuring tenure telemetry, career velocity, radar factor breakdown, and an interactive "What-If" career scenario simulator (promotion, lateral transfer, training hours). |
| **Manager Insights** | `manager-insights` | Team continuity metrics, manager span of control, team flight-risk aggregations, and tenure curves. |
| **Reports & Briefings** | `reports` | Pre-formatted analytical reports, executive summary generator, and one-click CSV / JSON export pipelines. |
| **Connectors & Developer Hub** | `connectors` | Reference HRIS integration status (Workday, BambooHR, SAP SuccessFactors), live mock sync test runner, scoped public REST API key generator with instant revocation, and HMAC-SHA256 outgoing webhook tester. |
| **Trust Center & Governance** | `trust-center` | Security posture overview (PBKDF2, session RBAC, tenant isolation, HMAC), live immutable SQLite audit trail with search, automated GDPR Article 15 Data Subject Access Request (DSAR) export, and retention policy preview. |
| **Design System & Tokens** | `design-system` | Interactive living styleguide showcasing color tokens, typography scales, buttons, status pills, metric cards, and density settings across all 5 themes. |
| **Data Management** | `data-management` | Custom dataset CSV uploader with automated schema validation, missing-value imputation, data quality health check, and one-click reset to benchmark presets. |
| **Themes & Settings** | `settings` | Complete theme configuration studio, scoring policy weight sliders with live tier-movement simulation, and transparent methodology documentation. |

---

## 5. Backend Implementation Details

The backend is built with **FastAPI**, **SQLAlchemy ORM**, **SQLite**, and **Pydantic v2**. It runs asynchronously and is fully covered by automated unit and integration tests.

### 5.1 Database Models & Multi-Tenant Entities (`entities.py`)
All entities enforce multi-tenant isolation via `workspace_id`:
- `Workspace`: Tenant configuration, custom organization name, primary brand accent color, SVG logo URL, custom domain, and fiscal calendar settings.
- `User`: RBAC user accounts with email, hashed passwords (PBKDF2-SHA256), assigned roles (`admin`, `hrbp`, `hr_analyst`, `talent_committee`), and last login timestamps.
- `ScoringPolicy`: Versioned scoring configurations (`v1.0.0`) defining weights (`gap_weight`, `cluster_risk_weight`, `satisfaction_inv_weight`, `tenure_weight`, `training_deficit_weight`) and priority tier cutoffs.
- `InterventionRecord`: Formally assigned retention action plans with category, priority, status (Proposed, In Review, Active, Completed), owner, target completion date, and committee review notes.
- `PlanComment`: Collaborative commentary thread on active retention plans.
- `CommitteeSession`: Talent calibration meeting records with scheduled dates, status (scheduled, in_progress, completed), and executive meeting minutes.
- `CommitteeDecision`: Auditable log of candidate evaluations (`approved`, `rejected`, `deferred`) with recorded justifications and deciding user.
- `PilotLead`: Persisted corporate pilot inquiries submitted via the public landing page.
- `ApiKey`: Cryptographically hashed public REST API access keys with role scopes and active status flags.
- `WebhookEndpoint`: Registered outgoing webhook URLs with HMAC secret tokens and event subscriptions.
- `WebhookDelivery`: Immutable delivery log of webhook dispatches, payloads, and computed HMAC signatures.
- `AuditLog`: Immutable append-only audit trail capturing all system events, actor identities, action verbs, resource types, and client IP addresses.

### 5.2 Enterprise Security Core (`security.py`)
- **Password Hashing:** Implemented with `hashlib.pbkdf2_hmac` using `SHA-256`, 100,000 salt iterations, and a 16-byte cryptographically random salt per user.
- **Signed Session Tokens:** Custom SHA-256 HMAC session tokens containing user ID, role, tenant workspace ID, and ISO 8601 expiration timestamps.
- **HMAC-SHA256 Webhook Signatures:** Outbound webhooks sign the serialized JSON payload with the endpoint's secret token, transmitting an `X-Signature-SHA256` header for destination verification.
- **RBAC Permission Matrix:**
  - `admin`: Full workspace management, user provisioning, custom policy modification, audit trail access, and API key revocation.
  - `hrbp`: Analytics access, intervention creation/updates, committee notes, and full employee dossiers.
  - `hr_analyst`: Analytics, cluster inspection, promotion gap reports, and policy impact simulations.
  - `talent_committee`: Talent Committee Review workspace, presentation mode evaluations, decision recording, and meeting minutes.

### 5.3 Automated Database Migration & Seeding (`init_db.py`)
- Automatic table creation and SQLite `ALTER TABLE` schema migration using `PRAGMA table_info` inspection to ensure zero data loss across updates.
- Automatic seeding of:
  - Default tenant workspace (`panw-cyber`).
  - 4 pre-configured RBAC users (`admin@company.com`, `analyst@company.com`, `hrbp@company.com`, `committee@company.com`).
  - Calibrated default `ScoringPolicy` v1.
  - Default Q4 Talent Committee calibration review session.
  - Sample intervention action plans.

---

## 6. Analytical & Machine Learning Services (`analytics_service.py`)

### 6.1 Feature Engineering Pipeline
The service normalizes and enriches raw HRIS records with derived features:
- **Promotion Gap (Years):**
  $$\text{Promotion Gap} = \max(0, \text{YearsSinceLastPromotion} - \text{BenchmarkDwell}(\text{JobLevel}))$$
- **Benchmark Dwell Times:** Empirical median dwell before expected promotion calibrated across job levels (Level 1: 1.5 yrs, Level 2: 2.0 yrs, Level 3: 2.8 yrs, Level 4: 3.5 yrs, Level 5: 4.5 yrs).
- **Career Velocity:** $\text{JobLevel} / \max(1.0, \text{YearsAtCompany})$.
- **Training Engagement Deficit:** Flagged when training sessions attended $< 2$ per annum.
- **Satisfaction Inversion:** Standardized survey satisfaction inverted to model turnover probability.

### 6.2 Unsupervised K-Means Clustering & Validation
- **Feature Set (7 Dimensions):** `YearsAtCompany`, `YearsInCurrentRole`, `YearsSinceLastPromotion`, `JobLevel`, `PerformanceRating`, `TrainingTimesLastYear`, `JobSatisfaction`.
- **Optimal Cluster Validation:** Verified at $k=4$ using both the **Elbow Method (Inertia Curve)** and **Silhouette Coefficient Analysis** ($s \approx 0.38$).
- **Workforce Archetypes Discovered:**
  - *Cluster 0 — Fast-Track Escalations:* High promotion velocity, rapid advancement.
  - *Cluster 1 — Stable Backbone:* Long tenure, consistent performance, high satisfaction.
  - *Cluster 2 — Stagnated Senior Specialists:* High performance, high tenure, exceeding benchmark dwell by $>2.5$ years. **Primary urgent flight-risk cohort.**
  - *Cluster 3 — Early-Career Exploration:* Low dwell, variable satisfaction, high L&D potential.
- **Dimensionality Reduction:** 2D Principal Component Analysis (PCA) projection capturing $\approx 64\%$ of total multi-dimensional variance for intuitive scatter-plot visualization.

### 6.3 Explainable Retention Opportunity Index (ROI) Formula
To prevent discriminatory black-box outcomes, every employee's flight-risk score is calculated deterministically:
$$\text{ROI} = w_1 \cdot \text{Norm}(\text{PromotionGap}) + w_2 \cdot \text{ClusterRisk} + w_3 \cdot \text{SatisfactionInversion} + w_4 \cdot \text{TenureWeight}$$
- **Urgent Priority:** $\text{Score} \ge 0.70$
- **Moderate Priority:** $0.45 \le \text{Score} < 0.70$
- **Standard Priority:** $\text{Score} < 0.45$

### 6.4 Deterministic Recommendation Engine
Rule-based logic assigns structured action plans based on observed indicators:
- High promotion gap + high performance $\rightarrow$ **Career Progression & Band Calibration Review**
- Long role dwell + moderate satisfaction $\rightarrow$ **Executive Mentorship & Cross-Functional Shadowing**
- Low training frequency $\rightarrow$ **Skill Advancement & L&D Training Allocation**
- Stagnation across role and tenure $\rightarrow$ **Lateral Mobility & Rotational Exploration**

### 6.5 Dynamic Policy Impact Simulator
Evaluates in real-time how proposed adjustments to scoring weights or benchmark dwell thresholds shift employee headcounts between Urgent, Moderate, and Standard tiers (`/api/policy/preview`), allowing HR leaders to forecast operational workloads before updating policies.

### 6.6 Three Synthetic Industry Presets
Generated via deterministic random seeds in `ml/generate_industry_datasets.py`:
1. `data/demo_workforce_data.csv`: **Cybersecurity & Cloud Tech** (1,470 profiles, Palo Alto Networks benchmark).
2. `data/synthetic_healthcare_workforce.csv`: **Healthcare Clinical Ops** (1,200 profiles, clinical research & nursing operations).
3. `data/synthetic_financial_workforce.csv`: **Financial Services & Quant** (1,350 profiles, algorithmic trading & asset management).

---

## 7. Modular API Router Architecture

| Router Path | Prefix | Key Endpoints & Capabilities |
| :--- | :--- | :--- |
| `endpoints.py` | `/api` | `/metadata`, `/overview`, `/clusters`, `/clusters/elbow-curve`, `/rerun-clustering`, `/promotion-gap`, `/retention-opportunities`, `/manager-insights`, `/employees`, `/employees/{id}`, `/interventions` (CRUD), `/dataset/upload`, `/dataset/reset`, `/dataset/data-quality`, `/simulate-career`. |
| `auth.py` | `/api/auth` | `POST /login`, `GET /me`, `GET /users`, `POST /users`, `PATCH /users/{id}` (RBAC role assignments). |
| `workspaces.py` | `/api/workspaces` | `GET /workspaces`, `POST /workspaces`, `PATCH /workspaces/{id}/branding` (custom org name, colors, logos). |
| `policy.py` | `/api/policy` | `GET /policy`, `POST /policy/preview` (live tier-movement simulation), `POST /policy/update`, `GET /policy/history`. |
| `committee.py` | `/api/committee` | `GET /sessions`, `POST /sessions`, `POST /sessions/{id}/decisions`, `PATCH /sessions/{id}/minutes`, `GET /plans/{id}/comments`, `POST /plans/{id}/comments`. |
| `pilot.py` | `/api/pilot` | `POST /leads` (pilot inquiry submission), `GET /leads`, `POST /dataset/preset` (cohort switcher). |
| `connectors.py` | `/api/connectors`| `GET /status`, `POST /test-hris` (simulated directory ingest). |
| `v1_public.py` | `/api/v1` & `/api`| `GET /api/v1/roster` (API key secured), `GET /api/keys`, `POST /api/keys`, `DELETE /api/keys/{id}`, `GET /api/webhooks`, `POST /api/webhooks`, `POST /api/webhooks/test`. |
| `governance.py`| `/api/governance`| `GET /audit-logs`, `GET /retention-preview`, `GET /data-subject-export` (GDPR Article 15 DSAR JSON). |

---

## 8. Verification, Testing & Quality Assurance

### 8.1 Automated Pytest Suite (`backend/tests/test_analytics.py`)
All **11 of 11 tests pass with 100% success rate**:
- `test_feature_engineering_zero_tenure`: Validates boundary handling on new hires with zero dwell time.
- `test_feature_engineering_stagnation_logic`: Verifies promotion gap calculations against job-level benchmarks.
- `test_clustering_execution`: Verifies K-Means fit, centroid generation, and 2D PCA variance preservation.
- `test_api_health_and_metadata`: Verifies API responses and column schema verification.
- `test_api_overview`: Confirms dynamic calculation of executive overview KPIs from active records.
- `test_intervention_crud_lifecycle`: Tests end-to-end SQLite persistence of intervention records.
- `test_retention_opportunities_filtering_and_summary`: Verifies priority tier filtering and department aggregation.
- `test_enterprise_auth_and_rbac`: Verifies PBKDF2 password hashing, token validation, and RBAC permission checks.
- `test_workspaces_and_policy_preview`: Verifies tenant partition isolation and dynamic scoring policy tier simulation.
- `test_committee_and_pilot_lead_flows`: Validates committee session creation, formal decision logging, and pilot inquiry persistence.
- `test_connectors_and_industry_preset`: Validates the HRIS reference adapter execution and industry dataset preset switching.

### 8.2 Frontend Production Build
- `npm run build` completed cleanly with code 0 (`tsc -b && vite build`).
- 1,962 modules transformed, producing optimized minified static assets (`index.html`, `index.css`, `index.js`).

### 8.3 Live Service Verification
- **FastAPI Backend Server:** Running on port 8000 (`http://127.0.0.1:8000`).
  - Health check endpoint `GET /health` returns `{"status": "healthy", "service": "careerpath-api"}` (HTTP 200).
  - Telemetry endpoint `GET /version` returns `{"app": "CareerPath Intelligence", "version": "2.2.0"}`.
- **Vite Frontend Server:** Running on port 5173 (`http://127.0.0.1:5173`) with Hot Module Reloading (HMR) active.

---

## 9. Comprehensive Documentation & DevOps Suite

All enterprise documentation has been created in the `docs/` repository directory:

1. **[PITCH_DEMO_SCRIPT.md](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/PITCH_DEMO_SCRIPT.md):**
   - Minute-by-minute 7-minute presentation walkthrough designed for corporate leadership.
   - Live click-through sequence: Hook $\rightarrow$ ML Clusters $\rightarrow$ Promotion Gaps $\rightarrow$ Committee Mode $\rightarrow$ Developer Hub $\rightarrow$ Pilot Proposal.
   - Comprehensive objection handling matrix covering AI explainability, GDPR, custom level dwell benchmarks, and Workday integrations.
2. **[PILOT_PLAN.md](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/PILOT_PLAN.md):**
   - 4-to-6 week enterprise pilot rollout framework.
   - Structured milestone breakdown: Scoping $\rightarrow$ Ingestion $\rightarrow$ ML Calibration $\rightarrow$ HRBP Training $\rightarrow$ Live Committee $\rightarrow$ Post-Pilot ROI Evaluation.
   - Data privacy and zero-leakage commitments.
3. **[MODEL_CARD.md](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/MODEL_CARD.md):**
   - Complete technical model card following IEEE / ACM standards.
   - Detailed breakdown of 7 feature vectors, level dwell curves, and mathematical clustering metrics.
   - Explicit ethical guardrails and strictly out-of-scope use cases (zero automated termination decisions, zero compensation dictation).
4. **[SECURITY.md](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/SECURITY.md):**
   - Security controls overview: PBKDF2-HMAC-SHA256 password hashing (100,000 iterations).
   - Multi-tenant data partitioning rules (`workspace_id`).
   - HMAC-SHA256 cryptographic webhook dispatching.
   - GDPR Article 15 automated Data Subject Access Request (DSAR) export specification.
5. **[DEPLOYMENT.md](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/DEPLOYMENT.md):**
   - Complete deployment and environment setup instructions for Docker, Docker Compose, and bare-metal environments.
6. **Containerization Files:**
   - Multi-stage production [Dockerfile](file:///C:/Users/saini/Downloads/careerpath-intelligence/Dockerfile) (Node.js 20 build stage + Python 3.12 runtime).
   - Production [docker-compose.yml](file:///C:/Users/saini/Downloads/careerpath-intelligence/docker-compose.yml) with automatic health probes.
   - Production [.env.example](file:///C:/Users/saini/Downloads/careerpath-intelligence/.env.example) configuration template.

---

## 10. Summary of Key Files & Links

| Module | Primary Files |
| :--- | :--- |
| **Frontend Shell & Nav** | [`App.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/App.tsx), [`Sidebar.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/components/Sidebar.tsx), [`TopNav.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/components/TopNav.tsx) |
| **Brand & Design Tokens** | [`BrandLogo.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/components/brand/BrandLogo.tsx), [`ThemeContext.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/context/ThemeContext.tsx), [`index.css`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/index.css) |
| **Interactive Modals** | [`GuidedTourModal.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/components/GuidedTourModal.tsx), [`CommandPalette.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/components/CommandPalette.tsx), [`ThemeSwitcher.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/components/ThemeSwitcher.tsx) |
| **New Enterprise Views** | [`LandingView.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/views/LandingView.tsx), [`CommitteeView.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/views/CommitteeView.tsx), [`ImpactEstimatorView.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/views/ImpactEstimatorView.tsx), [`ConnectorsView.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/views/ConnectorsView.tsx), [`TrustCenterView.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/views/TrustCenterView.tsx), [`DesignSystemView.tsx`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/views/DesignSystemView.tsx) |
| **Frontend API Client** | [`api.ts`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/services/api.ts), [`format.ts`](file:///C:/Users/saini/Downloads/careerpath-intelligence/frontend/src/utils/format.ts) |
| **Backend Main & Security**| [`main.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/main.py), [`security.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/core/security.py) |
| **Database & Entities** | [`entities.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/models/entities.py), [`init_db.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/database/init_db.py), [`connection.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/database/connection.py) |
| **Analytics & ML Core** | [`analytics_service.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/services/analytics_service.py), [`generate_industry_datasets.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/ml/generate_industry_datasets.py) |
| **Backend API Routers** | [`endpoints.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/endpoints.py), [`auth.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/auth.py), [`workspaces.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/workspaces.py), [`policy.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/policy.py), [`committee.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/committee.py), [`pilot.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/pilot.py), [`connectors.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/connectors.py), [`v1_public.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/v1_public.py), [`governance.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/app/api/governance.py) |
| **Test Suite** | [`test_analytics.py`](file:///C:/Users/saini/Downloads/careerpath-intelligence/backend/tests/test_analytics.py) |
| **Documentation & Ops** | [`PITCH_DEMO_SCRIPT.md`](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/PITCH_DEMO_SCRIPT.md), [`PILOT_PLAN.md`](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/PILOT_PLAN.md), [`MODEL_CARD.md`](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/MODEL_CARD.md), [`SECURITY.md`](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/SECURITY.md), [`DEPLOYMENT.md`](file:///C:/Users/saini/Downloads/careerpath-intelligence/docs/DEPLOYMENT.md), [`Dockerfile`](file:///C:/Users/saini/Downloads/careerpath-intelligence/Dockerfile), [`docker-compose.yml`](file:///C:/Users/saini/Downloads/careerpath-intelligence/docker-compose.yml) |
