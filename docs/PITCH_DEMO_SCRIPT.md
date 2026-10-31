# CareerPath Intelligence — Enterprise Pitch & Demonstration Script

> **Target Audience:** VP of Talent Management, Chief People Officer, Head of People Analytics, Enterprise Tech & Compliance Lead  
> **Demonstrator Role:** Senior Full-Stack Engineer / Lead Data Scientist  
> **Theme Recommendation:** Arctic Clarity (Light) or Midnight Executive (Dark) (WCAG 2.2 AA Compliant)  
> **Version:** 3.2.0 Final Enterprise Release  
> **Curated Demo Path:** 7-View Pitch Mode Toggle (Active in Sidebar Footer)

---

## 1. Executive Hook & Pitch Mode Activation (Minute 0:00 – 1:00)

**Speaker:**
> *"Thank you for your time today. Every year, enterprise organizations lose 12% to 18% of their high-performing knowledge workers. But these departures are almost never sudden surprises. High performers do not quit impulsively—they leave because of **quiet career stagnation**. They hit an invisible promotion ceiling, spend 3 to 4 years exceeding benchmark dwell times without progression calibration, and eventually take recruiter calls.
>
> Today, HR teams rely on annual lagging surveys or reactive exit interviews. **CareerPath Intelligence** transforms talent management from reactive crisis triage to **proactive, explainable intelligence**."*

**Action:**
- Display **Executive Overview** (`/overview`).
- Point to the **Pitch Mode** toggle in the sidebar footer:
  - Click **Pitch Mode** (badge turns from `Off` to `Active (7 Views)`).
  - Note how the navigation immediately streamlines to the 7 core executive review workspaces.
- Point out the active KPI telemetry: **1,470 Active Profiles Indexed**, **Median Role Tenure**, and **Calculated Analytical Insight Feed**.

---

## 2. Unsupervised Machine Learning & Career Archetypes (Minute 1:00 – 2:15)

**Speaker:**
> *"Let's look at how our ML engine discovers career progression patterns without black-box biases."*

**Action:**
- Navigate to **Career Clusters & Archetypes** (`/clusters`).
- Show the interactive PCA 2D scatter plot and the cluster centroid table.
- Open the **Silhouette & Inertia Curve** panel.

**Speaker:**
> *"We do not use generic opaque neural nets. We train a multi-dimensional K-Means clustering model across 7 operational feature vectors: total tenure, years in role, years since last promotion, training frequency, and performance ratings. Mathematical clustering is evaluated at **k=4 to k=5 optimal clusters** with realistic workforce silhouette separation ($s \approx 0.38$). Human career paths naturally have organic overlap rather than artificial geometric isolation.
>
> Cluster 2 highlights 'Stagnating Senior Specialists'—employees with high tenure and sustained performance who have hit promotion bottlenecks."*

---

## 3. Promotion Gap Monitor & Retention Risk Index (Minute 2:15 – 3:15)

**Speaker:**
> *"Next, let's examine the **Promotion Gap Monitor** and **Retention Risk Index (RRI)**."*

**Action:**
- Navigate to **Promotion Gap Monitor** (`/promotion-gap`).
- Filter by department: `Research & Development`.
- Sort by `Promotion Gap (Years)`.

**Speaker:**
> *"Notice how the system computes an empirical benchmark dwell time for each job level. In Engineering, Level 3 employees have an expected median dwell time of 2.8 years. An employee who has spent 5.1 years at Level 3 without calibration has an elevated promotion latency gap.
>
> We don't just alert; we calculate the **Retention Risk Index (RRI)**—a transparent 0 to 100 score combining promotion latency, cluster risk, and satisfaction signals, categorized into standardized tiers: **Urgent**, **Moderate**, and **Standard**."*

---

## 4. Algorithmic Fairness, Intersectional Slices & Bias Sign-Off (Minute 3:15 – 4:30)

**Speaker:**
> *"Enterprise talent tools often face legitimate skepticism: how do you ensure the algorithm isn't amplifying demographic bias? We built automated algorithmic ethics and compliance directly into the platform."*

**Action:**
- Navigate to **Fairness & Bias Audit** (`/fairness-audit`).
- Show the **Marginal Demographics** tab with the **EEOC Four-Fifths Rule (80% Disparate Impact Ratio)** summary.
- Switch to the **Intersectional Slices** tab: show Gender × AgeBand and Gender × Department breakdowns with Benjamini-Hochberg FDR $q$-values.
- Switch to **Longitudinal Fairness Drift**: show monthly DIR tracking.
- Open **Governance & Bias Sign-Offs**: show the formal audit trail required before model promotion.

**Speaker:**
> *"First, protected demographic attributes (Age, Gender, Marital Status) are strictly prohibited from entering any feature vector or scoring formula.
>
> Second, our audit evaluates both marginal demographics and intersectional cohorts. Using Benjamini-Hochberg false discovery rate correction, we identify statistically reliable disparities while suppressing cohorts with $n < 10$ to prevent small-sample distortion.
>
> Finally, before any new model is promoted or policy weight modified, an administrator must record a formal **Bias Review Sign-Off** with documented justification."*

---

## 5. Rolling-Origin Temporal Backtesting (Minute 4:30 – 5:30)

**Speaker:**
> *"Let's examine how we validate our models on actual historical workforce outcomes."*

**Action:**
- Navigate to **Themes & Settings** (`/settings`) -> Sub-tab: **Backtest (Rolling-Origin)**.
- Show the **3-Way Benchmark Comparison**: Transparent RRI vs. Supervised HistGBDT vs. Naive Baseline.
- Point to the Lift Chart and precision@top-10% metrics.

**Speaker:**
> *"Rather than relying on random train/test splits that leak future tenure information into past predictions, version 3.2.0 implements **rolling-origin temporal backtesting**. We train models on historical snapshots up to month N, and predict exits occurring in months N+1 through N+6 across multiple temporal origins.
>
> In our 3-way evaluation on benchmark data, our calibrated HistGBDT achieves a ROC-AUC of 0.77 and a 2.3x lift over base rate, while our transparent RRI rules achieve a 2.0x lift—both substantially outperforming naive tenure baselines.
>
> Organizations can also use our **Bring-Your-Own (BYO) Historical Exits** flow in Data Management to evaluate backtests on their own historical turnover data."*

---

## 6. Executive Succession & 9-Box Calibration (Minute 5:30 – 6:30)

**Speaker:**
> *"Beyond individual flight risk, talent leaders must protect critical organizational continuity."*

**Action:**
- Navigate to **Succession & Bench** (`/succession`).
- Interact with the **9-Box Talent Calibration Matrix** (click 'Future Star / Key Talent').
- Highlight the **Single Points of Failure (SPOF)** alert banner in critical leadership positions.

**Speaker:**
> *"Our 9-box matrix maps calibrated performance against an objective potential proxy derived from career velocity and L&D participation.
>
> In the critical roles table, the system instantly flags **Single Points of Failure (SPOFs)**—positions with high flight-risk incumbents and zero 'Ready Now' successors. This provides talent committees with the exact blueprint needed for targeted succession mentoring."*

---

## 7. Longitudinal Trends & Migration Matrices (Minute 6:30 – 7:30)

**Speaker:**
> *"How do we verify whether interventions are actually making an impact over time?"*

**Action:**
- Navigate to **Workforce Trends** (`/trends`).
- Show the longitudinal 12-month RRI trajectory curves.
- Interact with the **Priority Tier Migration Matrix** showing employee movement between Urgent, Moderate, and Standard tiers.

**Speaker:**
> *"Longitudinal workforce snapshots track cohort movement month-over-month. In this matrix, we can see how many employees transitioned out of the Urgent tier following active career interventions, proving the cooling of flight risk across consecutive quarters."*

---

## 8. Trust Center, Regulatory Compliance & Executive Briefings (Minute 7:30 – 8:30)

**Speaker:**
> *"Finally, let's explore our enterprise governance, regulatory compliance, and automated reporting."*

**Action:**
- Navigate to **Trust Center & Governance** (`/trust-center`):
  - Click the **Compliance** tab.
  - Show the live **NYC Local Law 144 AEDT Bias Audit Summary** and click to download the compliance CSV.
  - Highlight the one-click download buttons for `COMPLIANCE_MAPPING.md`, `DPIA_TEMPLATE.md`, and `MODEL_CARD.md`.
- Navigate to **Reports & Briefings** (`/reports`):
  - Show the live **Executive Workforce Briefing Memo** with Matched Observational Cohort analysis (and transparent selection bias caveat).
  - Demonstrate one-click Markdown memo download and email alert dispatch.
- Navigate to **Connectors & Public API** (`/connectors`):
  - Show the **BambooHR Connector** with live sync simulation and AES-256-GCM encrypted credentials.

**Speaker:**
> *"Every regulatory requirement—from NYC Local Law 144 to the EU AI Act High-Risk rules and GDPR Article 15 DSARs—is pre-mapped and verifiable in-app.
>
> With enterprise OIDC SSO, SCIM 2.0 provisioning, and hardened PBKDF2/AES-256 cryptography, CareerPath Intelligence delivers consumer-grade agility with defense-grade security.
>
> We are actively onboarding enterprise partners for structured 6-week pilot deployments on your workforce dataset. Thank you, and I look forward to your questions."*

---

## 9. Objection Handling & FAQ Matrix

| Question / Objection | Defensible Response |
| :--- | :--- |
| **"Is this an AI black-box making employment decisions?"** | *"Strictly no. The platform operates exclusively as advisory decision support. Scoring weights and logic are fully transparent and auditable, and final calibration remains entirely human-driven in the Talent Committee."* |
| **"How do you satisfy NYC Local Law 144 and EU AI Act requirements?"** | *"We provide pre-mapped compliance documentation (`COMPLIANCE_MAPPING.md`), automated independent bias audit tables formatted per NYC LL144 specifications, pre-filled GDPR Art. 35 DPIA templates, and Mitchell et al. Model Cards in compliance with EU AI Act Art. 11."* |
| **"How do you prove predictive validity without random leakage?"** | *"We evaluate models using rolling-origin temporal backtesting across historical workforce snapshots and actual exit logs, benchmarking our transparent RRI and supervised HistGBDT models against naive baselines with measured lift curves."* |
| **"How do you ensure data isolation in multi-tenant deployments?"** | *"Every database table and query is partitioned by `workspace_id`. Cross-tenant data access is strictly prevented at the ORM and database layers, verified by automated multi-tenant isolation tests."* |
| **"Can frontline managers access other departments' employee records?"** | *"No. The manager role is strictly scoped to direct reports (`ManagerID == current_user.employee_id`). Any request outside the manager's hierarchy returns `HTTP 403 Forbidden`."* |
| **"Can we connect our existing HRIS?"** | *"Yes. We provide native adapters for BambooHR with dry-run previews, standard CSV ingestion with BYO exits, RFC 7644 SCIM 2.0 user provisioning, and HMAC-SHA256 signed webhooks for downstream integration."* |
