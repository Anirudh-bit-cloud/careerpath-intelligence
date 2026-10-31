# CareerPath Intelligence v3.1.0
### Enterprise Career Progression, Promotion Gap & Retention Opportunity Analytics

> **Tagline:** Understand career stagnation. Unlock employee potential. Make retention proactive.  
> **Release:** v3.1.0 Enterprise Production Release  
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
cd C:\Users\saini\Downloads\careerpath-intelligence
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
*API Swagger Documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 2. Start the React + TypeScript Frontend
```powershell
cd C:\Users\saini\Downloads\careerpath-intelligence\frontend
npm run dev
```
*The interactive dashboard will open at [http://127.0.0.1:5173/](http://127.0.0.1:5173/).*

### 3. Run Automated Tests
```powershell
cd C:\Users\saini\Downloads\careerpath-intelligence
python -m pytest backend/tests/test_analytics.py -v
```

---

## 🏛️ Architecture & Project Organization

```
careerpath-intelligence/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & SQLite DB setup
│   │   ├── api/
│   │   │   ├── endpoints.py            # Core analytics, RRI, score explanation, counterfactuals
│   │   │   ├── models.py               # Model registry, promote/rollback, PSI drift monitoring
│   │   │   ├── manager.py              # Role-based team scoping, 1-on-1 talking points, follow-ups
│   │   │   ├── snapshots.py            # Workforce monthly snapshots & longitudinal trends
│   │   │   ├── validation.py           # Kaplan-Meier, Cox PH, calibration deciles & provenance
│   │   │   ├── fairness.py             # Four-fifths disparate impact & EOD fairness audits
│   │   │   └── succession.py           # 9-box grid, talent bench, succession planning
│   │   ├── database/connection.py      # SQLAlchemy 2.0 connection factory
│   │   ├── models/entities.py          # Multi-tenant ORM models (snapshots, models, followups)
│   │   ├── schemas/domain.py           # Pydantic v2 schemas and validation models
│   │   └── services/
│   │       ├── analytics_service.py    # Core ML caching, aggregations, and insights engine
│   │       ├── attrition_service.py    # Supervised GBDT, calibration, SHAP explainability
│   │       ├── model_registry_service.py # Artifact serialization, lifecycle, and PSI drift
│   │       ├── snapshot_service.py     # Workforce snapshotting & migration matrices
│   │       └── validation_service.py   # Stratified backtest & bootstrap C-index validation
│   └── tests/                          # 59 automated Pytest unit and integration tests
├── frontend/
│   ├── src/
│   │   ├── components/                 # Design system: Card, MetricCard, DataTable, Drawer, Modal
│   │   ├── views/                      # 16 dedicated analytical workspaces:
│   │   │   ├── OverviewView.tsx        # Executive Command Center & Dynamic Insight Feed
│   │   │   ├── TrendsView.tsx          # Longitudinal workforce trends & tier migration matrix
│   │   │   ├── MyTeamView.tsx          # Manager-scoped team risk, talking points & follow-ups
│   │   │   ├── RetentionOpportunitiesView.tsx # Action-oriented intervention & Time Machine
│   │   │   ├── ClustersView.tsx        # Unsupervised 2D PCA & Archetype Profiles
│   │   │   ├── PromotionGapView.tsx    # Filterable analytical table & Role Latency rankings
│   │   │   ├── FairnessAuditView.tsx   # Disparate impact & Equal Opportunity Difference
│   │   │   ├── SuccessionView.tsx      # 9-Box talent matrix & succession bench strength
│   │   │   ├── ManagerInsightsView.tsx # Supervisory continuity & privacy-guarded metrics
│   │   │   ├── EmployeeExplorerView.tsx # SHAP waterfall, counterfactuals & simulator
│   │   │   ├── ReportsView.tsx         # Formal governance reports & CSV exports
│   │   │   ├── DataManagementView.tsx  # CSV upload, schema validation & quality checks
│   │   │   └── SettingsView.tsx        # Methodology, Model Registry, PSI drift & validation
│   │   ├── services/api.ts             # Typed REST API service client
│   │   ├── types/index.ts              # TypeScript domain interfaces
│   │   └── App.tsx                     # Top-level workspace layout and state routing
├── ml/
│   ├── attrition_model.py              # HistGradientBoostingClassifier, calibration, SHAP
│   ├── feature_engineering.py          # Promotion Gap Ratio, Role Stagnation, RRI formulas
│   ├── clustering.py                   # K-Means, Hierarchical (Ward), Silhouette & PCA
│   └── recommendations.py              # Explainable, non-demographic recommendation engine
├── data/
│   └── demo_workforce_data.csv         # 1,470-employee demonstration benchmark dataset
├── research_paper.md                   # Academic research paper with mathematical derivations
├── executive_summary.md                # High-impact briefing for leadership & governance
└── README.md                           # Comprehensive product & technical documentation
```

---

## 📐 Mathematical Feature Engineering

| Metric | Formula | Interpretation |
| :--- | :--- | :--- |
| **Promotion Gap Ratio (PGR)** | $\frac{\text{YearsSinceLastPromotion}}{\max(\text{YearsAtCompany}, 1.0)}$ | Percentage of company tenure spent unpromoted. Avoids division by zero for new hires. |
| **Role Stagnation Index (RSI)** | $\frac{\text{YearsInCurrentRole}}{\max(\text{YearsAtCompany}, 1.0)}$ | Extent of horizontal immobility in the same designated job description. |
| **Training Intensity Score (TIS)** | $\frac{\text{TrainingTimesLastYear}}{\text{YearsAtCompany} + 1.0}$ | Annualized development participation relative to organizational tenure. |
| **Manager Stability Indicator (MSI)**| $\min\left(1.5, \frac{\text{YearsWithCurrManager}}{\text{YearsInCurrentRole} + 1.0}\right)$ | Supervisory continuity relative to role tenure. |
| **Retention Opportunity Index**| Composite: $45\% \text{Stagnation} + 35\% \text{Engagement} + 20\% \text{Training Deficit}$ | Prioritizes active, performing employees facing career bottlenecks for developmental intervention. *Not an attrition probability or financial ROI.* |

---

## 🎨 Four-Theme Enterprise Design System

The application includes a centralized design token system with zero flash-of-wrong-theme on startup:

1. **Midnight Executive (Default):** Deep navy `#0B1020` surfaces, `#5B8CFF` blue accents, and `#42D6C4` teal highlights.
2. **Arctic Clarity (Light):** Crisp `#F5F7FB` backdrop, pure white `#FFFFFF` cards, high-contrast dark slate text, and `#315EFB` blue accents.
3. **Obsidian Graphite:** Technical charcoal `#111214` aesthetic with `#8BA4FF` accents.
4. **Emerald Intelligence:** Distinctive forest green `#0B1714` palette with `#34D399` emerald accents.

All themes are switchable live via the top navigation switcher, Settings preview cards, or the `Ctrl+K` Command Palette, and persist automatically across browser sessions.

---

## ⚡ Interactive Enterprise Features

- **Command Palette (`Ctrl+K` / `⌘+K`):** Global jump dialog to switch views, trigger themes, or search employee profiles instantly.
- **Keyboard Shortcuts (`?`):** Built-in shortcuts cheat sheet modal with `Alt+1`..`Alt+9` page navigation.
- **Slide-In Intervention Drawer:** Replaces cumbersome center modals with an edge drawer that maintains full visibility of the candidate data table.
- **Status Kanban Board:** Toggle between Table view and a 4-stage Kanban Board (`New`, `Under Review`, `Planned`, `Completed`) with inline status shifts.
- **Multi-Row Comparison Modal:** Select 2-3 talent profiles for side-by-side career progression and latency diagnosis.
- **Dynamic Executive Summary Strip:** 100% computed metrics reflecting active filters, including filtered cohort size, priority distribution, median promotion latency, and average opportunity index.
- **Table Density & Column Visibility:** Switch between compact high-density view and comfortable row spacing, and toggle optional columns on the fly.
- **Saved Views:** Bookmark custom multi-criteria filter configurations in `localStorage`.
- **Global Toast Notification System:** Real-time feedback on saves, updates, deletions, and CSV exports.

---

## 🤖 Unsupervised Machine Learning Framework

* **Primary Algorithm:** Ensemble K-Means ($K=5$) with auto-K selection based on maximum silhouette score.
* **Secondary Verification:** Gaussian Mixture Models (soft probabilistic clustering) and Agglomerative Hierarchical Clustering (Ward's criterion).
* **Anomaly Detection:** Isolation Forest identifying anomalous career stagnation patterns.
* **Feature Importances:** Random Forest regressor extracting feature contributions.
* **Dimensionality Reduction:** 2D PCA for visual mapping of workforce clusters.

### Derived Career Archetypes:
1. **Fast-Track Performers:** Rapid promotion velocity, frequent training, low historical latency.
2. **Early-Career Explorers:** Formative tenure (0–2.5 yrs) building baseline skills.
3. **Stable Long-Term Contributors:** Senior personnel with stable, long-standing progression.
4. **Promotion-Stalled Talent:** Average 6.4 years unpromoted despite high performance ratings.
5. **High-Risk Stagnation Profiles:** Extended vertical and horizontal role lock-in.

---

## 🔒 Ethical Safeguards & Organizational Integrity

1. **Exclusion of Protected Attributes:** Demographic attributes (Age, Gender, Marital Status) are strictly excluded from all scoring, clustering, and recommendation logic.
2. **Decision Support, Not Automated Decisions:** The platform operates exclusively as advisory decision support for HR talent committees and people leaders.
3. **Illustrative Enterprise Context & Synthetic Data Disclosure:** Palo Alto Networks is utilized solely as an illustrative organizational context for this independent academic capstone developed in collaboration with Unified Mentor. The dataset is synthetic demonstration data based on standard benchmark formats and contains no proprietary, confidential, or actual personnel records from Palo Alto Networks.

---

## 🏆 Presentation Walkthrough Workflow

For live stakeholder demonstrations and internship evaluations:
1. **Open Executive Overview:** View headline KPIs and live insights.
2. **Open Command Palette (`Ctrl+K`):** Jump between views, search an employee ID, or change themes instantly.
3. **Inspect Career Clusters:** View 2D PCA clusters, inspect archetype profiles, and check the Elbow/Silhouette curve.
4. **Investigate Promotion Gap Monitor:** Filter by department and review the role promotion latency rankings.
5. **Review Retention Opportunities:** 
   - Observe the live executive summary strip updating dynamically with filter adjustments.
   - Filter by Urgent Priority, select 2 employees and click **Compare Profiles**.
   - Click **Initiate Plan** to open the slide-in right drawer and submit an intervention plan.
6. **Track Action Plans in Kanban View:** Switch to the **Persistent Action Plans** tab and view the Kanban board.
7. **Simulate Career Interventions:** In the **Employee Explorer**, run what-if simulations (e.g. promoting now or lateral move) to see the Retention Opportunity Index drop dynamically.
8. **Export Reports:** Download CSV data exports for offline stakeholder presentations.
