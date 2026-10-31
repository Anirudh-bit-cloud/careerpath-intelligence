# CareerPath Intelligence v3.2.0
### Enterprise Workforce Progression, Promotion Gap & Retention Opportunity Intelligence

> **Tagline:** Understand career stagnation. Unlock employee potential. Make retention proactive.  
> **Release:** v3.2.0 Final Enterprise Release  
> **Project Context:** Unified Mentor Data Science Capstone Project  
> **Illustrative Enterprise Context:** Palo Alto Networks  

---

## 🌟 Executive Overview

**CareerPath Intelligence** is a full-stack, enterprise-grade people analytics web application designed to help organizations transition from **reactive attrition prediction** to **proactive career development intelligence**.

Rather than waiting for employees to become disengaged, CareerPath Intelligence analyzes structural workforce progression mechanics—including promotion latency, horizontal role inertia, managerial continuity, and capability training deficits—identifying retention opportunities 12 to 18 months before flight decisions occur.

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.10+** (tested on Python 3.12)
- **Node.js 18+** & **npm**

### 1. Start the FastAPI Backend
```powershell
cd careerpath-intelligence
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
*API Swagger Documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 2. Start the React + TypeScript Frontend
```powershell
cd careerpath-intelligence\frontend
npm run dev
```
*The interactive dashboard will open at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).*

### 3. Run Automated Tests
```powershell
# Run backend pytest suite (130 tests across all services, APIs, and tenant isolation)
python -m pytest backend/tests/ -q

# Run end-to-end 53-check API comprehensive test
python comprehensive_test.py

# Run Playwright E2E tests (12 tests across critical journeys, CSV ingestion, and v3.2.0 features)
npx playwright test --config=e2e/playwright.config.ts --workers=1

# Run frontend production build
cd frontend && npm run build
```

---

## 🏛️ Architecture & Project Organization

```
careerpath-intelligence/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint, lifecycle, and middleware
│   │   ├── api/
│   │   │   ├── endpoints.py            # Core analytics, RRI scoring, counterfactual simulations
│   │   │   ├── models.py               # Model registry, promote/rollback, PSI drift monitoring
│   │   │   ├── manager.py              # Role-based team scoping, 1-on-1 talking points, follow-ups
│   │   │   ├── snapshots.py            # Workforce monthly snapshots & longitudinal trends
│   │   │   ├── validation.py           # Rolling-origin temporal backtesting & survival curves
│   │   │   ├── fairness.py             # Intersectional fairness, FDR q-values & bias review sign-offs
│   │   │   ├── succession.py           # 9-box talent matrix, succession bench & SPOF detection
│   │   │   ├── compliance.py           # NYC LL144, EU AI Act, GDPR compliance mapping & downloads
│   │   │   ├── sso.py                  # Enterprise OIDC PKCE code flow & mock IdP provider
│   │   │   ├── scim.py                 # RFC 7644 SCIM 2.0 user provisioning & de-provisioning
│   │   │   ├── connectors.py           # BambooHR adapter, sync runner & encrypted credential store
│   │   │   └── briefings.py            # Executive briefing memos & matched observational cohorts
│   │   ├── database/connection.py      # SQLAlchemy 2.0 connection factory
│   │   ├── models/entities.py          # Multi-tenant ORM models (snapshots, models, SSO, HRIS configs)
│   │   ├── schemas/domain.py           # Pydantic v2 schemas and validation models
│   │   └── services/
│   │       ├── analytics_service.py    # Core ML caching, aggregations, and insights engine
│   │       ├── attrition_service.py    # Supervised HistGBDT, calibration, SHAP explainability
│   │       ├── bamboohr_service.py     # BambooHR sync adapter with offline fixtures & live replay
│   │       ├── briefing_service.py     # Live briefing generator & matched cohort delta analysis
│   │       ├── compliance_service.py   # Regulatory requirement matrices & NYC LL144 bias audit
│   │       ├── encryption_service.py   # AES-256-GCM credential encryption with key rotation
│   │       ├── fairness_service.py     # Marginal/intersectional adverse impact & significance tests
│   │       ├── model_registry_service.py # Artifact serialization, hash verification & PSI drift
│   │       ├── notification_service.py # Email alerts, digests & delivery logging
│   │       ├── snapshot_service.py     # Workforce monthly snapshots & migration matrices
│   │       └── validation_service.py   # Temporal rolling-origin backtesting & C-index bootstrap
│   └── tests/                          # 130 automated Pytest unit, integration, and isolation tests
├── frontend/
│   ├── src/
│   │   ├── components/                 # Design system: Card, MetricCard, DataTable, Drawer, Modal, Sidebar
│   │   ├── views/                      # 17 dedicated analytical workspaces:
│   │   │   ├── OverviewView.tsx        # Executive Command Center & Dynamic Insight Feed
│   │   │   ├── TrendsView.tsx          # Longitudinal workforce trends & tier migration matrix
│   │   │   ├── MyTeamView.tsx          # Manager-scoped team risk, talking points & follow-ups
│   │   │   ├── RetentionOpportunitiesView.tsx # Action-oriented intervention & Time Machine
│   │   │   ├── ClustersView.tsx        # Unsupervised 2D PCA & Archetype Profiles
│   │   │   ├── PromotionGapView.tsx    # Filterable analytical table & Role Latency rankings
│   │   │   ├── FairnessAuditView.tsx   # Intersectional slices, longitudinal drift & bias sign-offs
│   │   │   ├── SuccessionView.tsx      # 9-Box talent matrix & succession bench strength
│   │   │   ├── ManagerInsightsView.tsx # Supervisory continuity & privacy-guarded metrics
│   │   │   ├── EmployeeExplorerView.tsx # Dual RRI + ML probability, SHAP waterfall & simulator
│   │   │   ├── ReportsView.tsx         # Formal governance reports & CSV exports
│   │   │   ├── DataManagementView.tsx  # Ingestion, schema validation & BYO historical exits
│   │   │   ├── TrustCenterView.tsx     # Security controls, compliance mapping, LL144 & DSAR
│   │   │   ├── ConnectorsView.tsx      # BambooHR adapter, sync runner & public REST API keys
│   │   │   ├── DesignSystemView.tsx    # Design tokens, accessibility benchmarks & palettes
│   │   │   ├── CommitteeView.tsx       # Talent calibration committee decision workflows
│   │   │   └── SettingsView.tsx        # Temporal backtesting, model registry & PSI drift
│   │   ├── services/api.ts             # Typed REST API service client
│   │   ├── types/index.ts              # TypeScript domain interfaces
│   │   └── App.tsx                     # Top-level workspace layout, keyboard shortcuts & hash routing
├── docs/
│   ├── COMPLIANCE_MAPPING.md           # NYC LL144, EU AI Act, and GDPR requirement matrix
│   ├── DPIA_TEMPLATE.md                # GDPR Art. 35 Data Protection Impact Assessment template
│   ├── MODEL_CARD.md                   # Formal Model Card per Mitchell et al. & EU AI Act Art. 11
│   ├── SECURITY.md                     # Security architecture, PBKDF2, AES-256-GCM & safe artifact loader
│   ├── PILOT_PLAN.md                   # 60-day enterprise HR pilot rollout plan
│   └── PITCH_DEMO_SCRIPT.md            # Curated 7-view executive demonstration narrative
├── requirements.lock                   # Pinned deterministic dependencies
├── requirements.txt                    # Python package manifests
└── comprehensive_test.py               # 53-check end-to-end API verification suite
```

---

## 🚀 What's New in v3.2.0

### Phase 1 — Report & Consistency Corrections
- **Standardized Risk Tiers:** Standardized to `Urgent`, `Moderate`, and `Standard` across backend schemas, ML classifiers, API endpoints, UI badges, and documents.
- **Manager-Scope Hardening:** Rigorous team scoping ensuring manager role permissions are strictly isolated to direct reports with negative authorization tests.
- **Safe Artifact Loader:** Added SHA-256 integrity verification, safe path sandboxing, and explicit warnings against untrusted pickle/joblib files in `SECURITY.md`.
- **Reproducibility Locking:** Pinned `requirements.lock` and automated library version capture in `ModelVersion` records.

### Phase 2 — Temporal Backtesting on Historical Exits
- **Rolling-Origin Backtest:** Evaluates predictions across temporal cutoffs without random test leaks.
- **3-Way Benchmark:** Direct comparison between Transparent RRI, Supervised HistGBDT, and Naive Baseline (tenure-only).
- **BYO Historical Exits Ingestion:** Ingestion endpoint (`POST /api/dataset/upload-exits`) and interactive Data Management upload card.
- **Honest Provenance:** Mandatory badges distinguishing synthetic benchmarks from connected enterprise data.

### Phase 3 — Intersectional & Longitudinal Fairness
- **Intersectional Slices:** Dual-cohort audits (Gender × AgeBand, Gender × Department, AgeBand × Department) with sample size $n < 10$ suppression.
- **FDR Correction:** Benjamini-Hochberg false discovery rate $q$-values and Chi-Square / Fisher's Exact hypothesis tests.
- **Longitudinal Fairness Drift:** Monthly Disparate Impact Ratio tracking across workforce snapshots.
- **Formal Bias Review Sign-Off:** Explicit admin sign-off workflow (`POST /api/fairness/signoff`) required before model promotion or policy modification.

### Phase 4 — Compliance Mapping & Trust Center
- **Regulatory Matrix (`docs/COMPLIANCE_MAPPING.md`):** Complete mapping for NYC Local Law 144, EU AI Act High-Risk Annex III, and GDPR Articles 5, 15, 17, 22, 30, and 35.
- **Pre-filled DPIA Template (`docs/DPIA_TEMPLATE.md`):** Enterprise data protection impact assessment.
- **NYC LL144 Bias Audit Summary:** Live-calculated adverse impact ratios and CSV downloads.
- **In-App Compliance View:** Dedicated tab inside Trust Center with instant document exports and regulatory filtering.

### Phase 5 — Enterprise SSO, SCIM 2.0 & BambooHR Connector
- **OIDC PKCE Code Flow:** RFC 7636 Proof Key for Code Exchange flow with Just-In-Time (JIT) user provisioning and offline mock IdP.
- **SCIM 2.0 API:** RFC 7644 user provisioning and automated de-provisioning at `/scim/v2/Users`.
- **Field-Level AES-256-GCM Encryption:** Secure credential storage with key rotation CLI.
- **BambooHR Adapter:** Production adapter with schema mapping, dry-run previews, live sync execution, and offline recorded fixtures.

### Phase 6 — Executive Briefings & Pitch Mode
- **Live Executive Workforce Briefings:** Instant briefing memos with key metrics, critical departments, and talent interventions.
- **Matched Observational Cohort Analysis:** Before/after RRI trajectory tracking compared against matched controls with explicit selection bias caveats.
- **Multi-Channel Delivery:** Instant email dispatch and Markdown briefing memo download.
- **Curated Pitch Mode:** Sidebar toggle filtering to a streamlined 7-view executive demonstration path.

### Phase 7 — Comprehensive QA & Production Release
- **130 Automated Pytest Tests:** 100% passing across all endpoints, ML pipelines, and tenant boundaries.
- **53 Comprehensive Endpoints Tested:** Clean 100% pass in `comprehensive_test.py`.
- **12 Playwright E2E Tests:** Complete automated browser coverage across critical journeys, CSV ingestion, and v3.2.0 capabilities.
- **Zero npm Vulnerabilities:** Clean security audit in frontend dependencies.
- **Clean TypeScript Build:** Vite compilation passing with zero type errors.

---

## 📐 Mathematical Feature Engineering

| Metric | Formula | Interpretation |
| :--- | :--- | :--- |
| **Promotion Gap Ratio (PGR)** | $\frac{\text{YearsSinceLastPromotion}}{\max(\text{YearsAtCompany}, 1.0)}$ | Percentage of company tenure spent unpromoted. Avoids division by zero for new hires. |
| **Role Stagnation Index (RSI)** | $\frac{\text{YearsInCurrentRole}}{\max(\text{YearsAtCompany}, 1.0)}$ | Extent of horizontal immobility in the same designated job description. |
| **Training Intensity Score (TIS)** | $\frac{\text{TrainingTimesLastYear}}{\text{YearsAtCompany} + 1.0}$ | Annualized development participation relative to organizational tenure. |
| **Manager Stability Indicator (MSI)**| $\min\left(1.5, \frac{\text{YearsWithCurrManager}}{\text{YearsInCurrentRole} + 1.0}\right)$ | Supervisory continuity relative to role tenure. |
| **Retention Risk Index (RRI)**| Composite: $45\% \text{Stagnation} + 35\% \text{Engagement} + 20\% \text{Training Deficit}$ | Transparent heuristic identifying active talent encountering progression ceilings. *Not an attrition probability or financial ROI.* |

---

## 🎨 Enterprise Design System

The application features a centralized token system with full support for light, dark, and high-contrast modes:

1. **Midnight Executive (Default Dark):** Deep navy `#0B1020` surfaces, `#5B8CFF` blue accents, and `#42D6C4` teal highlights.
2. **Arctic Clarity (Light):** Crisp `#F5F7FB` backdrop, pure white `#FFFFFF` cards, high-contrast dark slate text, and `#315EFB` blue accents.
3. **High Contrast (WCAG 2.2 AAA):** High-legibility monochrome borders and high-visibility indicators for full accessibility.

---

## 🔒 Ethical Safeguards & Organizational Integrity

1. **Strict Exclusion of Protected Attributes:** Demographic attributes (Age, Gender, Marital Status) are strictly forbidden from entering any feature vector or scoring model. They are evaluated exclusively within post-hoc fairness audits.
2. **Human-in-the-Loop Decision Support:** The system never automates termination, disciplinary, or compensation decisions.
3. **Illustrative Enterprise Context & Synthetic Data Disclosure:** Palo Alto Networks is utilized solely as an illustrative organizational context for this independent academic capstone developed in collaboration with Unified Mentor. The dataset is synthetic demonstration data based on standard benchmark formats and contains no proprietary or actual personnel records.

---

## 🏆 Presentation Walkthrough Workflow

For live stakeholder demonstrations and internship evaluations:
1. **Activate Pitch Mode:** Toggle **Pitch Mode** in the sidebar footer to focus on the 7 core executive views.
2. **Executive Command Center:** View headline KPIs and live calculated analytical observations.
3. **Career Clusters:** Explore 2D PCA clusters, inspect archetype profiles, and check the Silhouette/Elbow curves.
4. **Promotion Gap Monitor:** Review department progression latencies and peer benchmarks.
5. **Fairness & Bias Audit:** Check the Four-Fifths compliance summary, inspect intersectional cohorts with FDR $q$-values, and review the bias review sign-off trail.
6. **Themes & Model Validation:** Review the rolling-origin temporal backtest table and lift curves.
7. **Succession Planning:** Calibrate talent across the 9-Box matrix and identify single points of failure (SPOFs).
8. **Workforce Trends:** Inspect longitudinal tier migration matrices and historical workforce health.
9. **Trust Center & Compliance:** Export NYC LL144 bias audit CSVs, review the regulatory matrix, and download the pre-filled DPIA template.
