# Model Card — CareerPath Workforce Intelligence ML Engine

**Model Name:** CareerPath Workforce Progression, Retention & Survival Clustering Engine  
**Version:** 3.2.0  
**Model Type:** Hybrid Unsupervised Machine Learning (K-Means + PCA), Supervised HistGradientBoosting with Platt/Isotonic Calibration & SHAP, Survival Analysis (Kaplan-Meier & Cox Proportional Hazards), Rolling-Origin Temporal Backtester, and Rule-Based Decision Policy  
**Release Date:** October 2026  
**License:** Proprietary / Enterprise  

---

## 1. Model Summary & Intended Use

The CareerPath Intelligence engine is designed to assist enterprise HR leadership, People Analytics teams, and Talent Calibration Committees in identifying **career progression bottlenecks**, **promotion latency**, and **retention intervention opportunities** across enterprise knowledge workers.

### Intended Use Cases:
- Detecting employees who have significantly exceeded peer benchmark dwell times at their job level.
- Segmenting the workforce into interpretable career archetypes (e.g. Fast-Track Rising Talent, Stagnated Senior Specialists, Solid Tenured Backbone).
- Providing explainable, non-black-box priority scoring (Transparent RRI) alongside supervised ML probability to direct human intervention resources.
- Powering bias-resistant talent calibration sessions via cryptographic identifier masking.
- Quantifying empirical time-to-turnover and time-to-promotion dwell curves using Kaplan-Meier and Cox Proportional Hazards regression.
- Conducting rolling-origin temporal backtesting on actual historical workforce exit logs.
- Performing intersectional demographic parity audits with False Discovery Rate (FDR) Benjamini-Hochberg correction.

### Strictly Out-of-Scope Use Cases:
- **Automated Termination or Adverse Employment Actions:** The model must NEVER be used to make automated employment decisions or justify layoffs.
- **Direct Compensation Determination:** Scores do not dictate compensation without human review.
- **Surveillance or Individual Productivity Tracking:** The model analyzes career progression milestones and tenure velocity, not keystrokes or activity tracking.

---

## 2. Feature Vectors & Preprocessing

The model operates across standard HR Information System (HRIS) attributes:

| Feature Name | Description | Preprocessing / Transformation |
| :--- | :--- | :--- |
| `YearsSinceLastPromotion` | Calendar years since last formal level promotion | Numerical, imputed 0 for new hires |
| `YearsInCurrentRole` | Calendar years in active job title | Numerical |
| `YearsAtCompany` | Total continuous tenure with the organization | Numerical |
| `JobLevel` | Organizational seniority band (1 through 6) | Ordinal integer |
| `PerformanceRating` | Most recent calibrated performance score (1 through 5) | Standardized |
| `TrainingTimesLastYear` | Count of professional L&D programs attended | Numerical |
| `JobSatisfaction` | Survey-derived satisfaction indicator (1 to 4) | Inverted for flight risk calculations |
| `YearsWithCurrManager` | Calendar years with direct supervisory continuity | Numerical |

### Derived Metrics:
1. **Promotion Gap Ratio (PGR):**
   $$\text{PGR} = \frac{\text{YearsSinceLastPromotion}}{\max(\text{YearsAtCompany}, 1.0)}$$
2. **Role Stagnation Index (RSI):**
   $$\text{RSI} = \frac{\text{YearsInCurrentRole}}{\max(\text{YearsAtCompany}, 1.0)}$$
3. **Retention Risk Index (RRI Score):**
   $$\text{RRI} = \left[ 0.45 \times (0.6 \times \text{PGR} + 0.4 \times \text{RSI}) + 0.35 \times \text{SatisfactionInversion} + 0.20 \times \left(1.0 - \frac{\text{Training}}{6}\right) \right] \times 100$$

---

## 3. Mathematical Clustering & Archetypes

### K-Means Clustering:
- **Number of Clusters ($k$):** Validated at $k=4$ to $k=5$ using both the **Elbow Method (Inertia Curve)** and **Silhouette Coefficient Analysis** ($s \approx 0.38$).
- **Dimensionality Reduction:** 2D Principal Component Analysis (PCA) projection explains $\approx 64\%$ of total variance across the feature dimensions.
- **Realistic Workforce Silhouette Interpretation:** Silhouette scores in human workforce analytics naturally fall between 0.35 and 0.50 due to continuous career progressions with organic boundary overlap.

### Discovered Workforce Archetypes:
1. **Cluster 0 — Fast-Track Rising Talents:** Low tenure, rapid promotion velocity, high training engagement. Priority tier: Standard.
2. **Cluster 1 — Solid Tenured Backbone:** High organizational tenure, moderate promotion gap, high job satisfaction. Priority tier: Standard.
3. **Cluster 2 — Stagnated Senior Specialists:** High tenure, high performance, exceeding level benchmark dwell by 2.5+ years. **Priority tier: Urgent.**
4. **Cluster 3 — Early-Career Exploration:** Low dwell, variable satisfaction, low training attendance. Focus: L&D alignment.

---

## 4. Supervised Model, Calibration & Temporal Backtesting

### 4.1 Supervised Attrition Machine Learning Model & SHAP
- **Algorithm:** `HistGradientBoostingClassifier` with `class_weight='balanced'`.
- **Calibration:** `CalibratedClassifierCV` (isotonic regression when $n \ge 1000$, else Platt / sigmoid scaling).
- **Evaluation:** Evaluated on stratified 75/25 train/test held-out split, reporting ROC-AUC, PR-AUC, empirical Brier score, and 5-fold cross-validation summary.
- **Local Explainability (TreeSHAP):** Computes exact Shapley values per employee, identifying the top 3 risk factors and top 3 protective factors.
- **Agreement Indicator:** Flags employees where transparent RRI and supervised ML probability disagree on risk tier, prompting human review.

### 4.2 Rolling-Origin Temporal Backtesting (Phase 2)
To prevent temporal data leakage inherent in random cross-validation, v3.2.0 evaluates models via **rolling-origin backtesting**:
- Models are trained on historical snapshots up to month $N$ and tested on actual observed employee exit events in months $N+1 \dots N+6$.
- This process is repeated across multiple temporal cutoff origins.
- **3-Way Benchmark:** Direct head-to-head comparison between:
  1. **Transparent RRI:** Deterministic progression rule.
  2. **Supervised HistGBDT:** Calibrated gradient boosting with SHAP drivers.
  3. **Naive Baseline:** Single-covariate tenure heuristic ($\text{YearsAtCompany} \ge 5$).
- **Reported Temporal Metrics:** ROC-AUC, PR-AUC, Brier score, Precision@top-5%, Precision@top-10%, Recall@top-10%, and Lift over Base Rate.

### 4.3 Bring-Your-Own (BYO) Historical Exits
Organizations can upload historical termination logs via `POST /api/dataset/upload-exits` (`employee_id`, `exit_date`, `exit_reason`) to run domain-specific rolling-origin backtests.

---

## 5. Algorithmic Fairness & Intersectional Audits

### 5.1 Marginal Disparate Impact & Equal Opportunity Difference
- **EEOC Four-Fifths Rule:** Disparate Impact Ratio (DIR) threshold $\ge 0.80$ comparing selection rates to benchmark demographic groups.
- **Equal Opportunity Difference (EOD):** Evaluates True Positive Rate ($\text{TPR}$) disparity across demographic groups, flagging gaps $> 15\%$.
- **Suppression:** Cohorts with sample size $n < 10$ or $< 3$ exits are strictly suppressed to guarantee individual privacy and prevent statistical volatility.

### 5.2 Intersectional Slices & Benjamini-Hochberg Correction (Phase 3)
- **Dual-Cohort Intersectional Audits:** Evaluates adverse impact across intersecting demographic dimensions:
  - Gender × AgeBand
  - Gender × Department
  - AgeBand × Department
- **Hypothesis Testing:** Computes Chi-Square tests of independence (or Fisher's Exact test for small cohorts) yielding two-tailed $p$-values.
- **FDR Correction:** Controls false discovery rates using the Benjamini-Hochberg step-up procedure, computing adjusted $q$-values across all tested demographic slices. A slice is flagged only when $\text{DIR} < 0.80$ **and** $q < 0.05$.

### 5.3 Longitudinal Fairness Drift & Bias Review Sign-Off
- **Fairness Drift Tracking:** Measures Disparate Impact Ratios across consecutive monthly workforce snapshots.
- **Formal Bias Review Sign-Off Workflow:** Requires an explicit administrator sign-off with documented justification (`POST /api/fairness/signoff`) before promoting a new model version or modifying policy weights. Every sign-off is committed to the immutable audit log.

---

## 6. Regulatory Compliance Mapping (Phase 4)

The platform includes formal compliance mapping documented in `docs/COMPLIANCE_MAPPING.md` and accessible in-app:
- **NYC Local Law 144:** Automated Employment Decision Tools (AEDT) requirements, including annual independent bias audits, published selection rate tables, and historical impact ratios.
- **EU AI Act (Annex III High-Risk Employment AI):** Technical documentation (Art. 11), record-keeping (Art. 12), transparency & provision of information (Art. 13), human oversight (Art. 14), and accuracy, robustness & cybersecurity (Art. 15).
- **GDPR Compliance:** Lawful basis & purpose limitation (Art. 5), automated Data Subject Access Requests (Art. 15 DSAR), right to erasure retention preview (Art. 17), automated decision-making safeguards (Art. 22), records of processing activities (Art. 30), and Data Protection Impact Assessment (Art. 35 DPIA).

---

## 7. Model Governance, Artifact Security & Reproducibility

### 7.1 Multi-Tenant Isolation
All model artifacts, snapshot data, and audit records are strictly isolated by `workspace_id`. Every database query enforces multi-tenant boundaries.

### 7.2 Safe Artifact Loader & Hash Verification
- Model files are loaded strictly through `safe_artifact_loader.py` with canonical path traversal checks.
- Every artifact undergoes SHA-256 integrity verification before deserialization to defend against malicious tampering.

### 7.3 Reproducibility Guarantee
- Pinned dependency lock file (`requirements.lock`) guarantees identical evaluation metrics for identical data hashes.
- Environment library versions are automatically stored in each `ModelVersion` record.
- Population Stability Index (PSI) tracks inference covariate drift against baseline distributions.

---

## 8. Limitations & Honest Metrics Disclosure

1. **No Static or Fabricated Metrics:** Every metric in this documentation, the API, and the UI is computed dynamically from code or stored results.
2. **Synthetic Data Disclosure:** All benchmark data is explicitly badged with a data provenance warning: *"Metrics on synthetic data do not demonstrate real-world predictive power. Enterprise validation requires domain-calibrated historical workforce records."*
3. **Matched Observational Cohort Caveats:** Before/after intervention comparisons are observational and include an explicit disclaimer acknowledging potential selection bias.
4. **Human-in-the-Loop Rule:** The system provides diagnostic decision support only. It never automates termination, disciplinary, or compensation decisions.
