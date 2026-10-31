# Model Card — CareerPath Workforce Intelligence ML Engine

**Model Name:** CareerPath Workforce Progression, Retention & Survival Clustering Engine  
**Version:** 3.1.0  
**Model Type:** Hybrid Unsupervised Machine Learning (K-Means + PCA), Survival Analysis (Kaplan-Meier & Cox Proportional Hazards), and Rule-Based Decision Policy  
**Release Date:** October 2026  
**License:** Proprietary / Enterprise  

---

## 1. Model Summary & Intended Use

The CareerPath Intelligence engine is designed to assist enterprise HR leadership, People Analytics teams, and Talent Calibration Committees in identifying **career progression bottlenecks**, **promotion latency**, and **flight risk opportunities** across enterprise knowledge workers.

### Intended Use Cases:
- Detecting employees who have significantly exceeded peer benchmark dwell times at their job level.
- Segmenting the workforce into interpretable career archetypes (e.g. Fast-Track Escalation, Stagnating Senior, Stable Contributor).
- Providing explainable, non-black-box priority scoring to direct human intervention resources.
- Powering bias-resistant talent calibration sessions via cryptographic identifier masking.
- Quantifying empirical time-to-turnover and time-to-promotion dwell curves using Kaplan-Meier and Cox Proportional Hazards regression.

### Strictly Out-of-Scope Use Cases:
- **Automated Termination or Adverse Employment Actions:** The model must NEVER be used to make automated employment decisions or justify layoffs.
- **Direct Compensation Determination:** Scores do not dictate compensation without human review.
- **Surveillance or Individual Productivity Tracking:** The model analyzes career progression milestones and tenure velocity, not keystrokes or activity tracking.

---

## 2. Feature Vectors & Data Preprocessing

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

### Derived Metrics:
1. **Promotion Gap Ratio (PGR):**
   $$\text{PGR} = \frac{\text{YearsSinceLastPromotion}}{\max(\text{YearsAtCompany}, 1.0)}$$
2. **Role Stagnation Index (RSI):**
   $$\text{RSI} = \frac{\text{YearsInCurrentRole}}{\max(\text{YearsAtCompany}, 1.0)}$$
3. **Retention Risk Index (RRI Score):**
   $$\text{RRI} = \left[ 0.45 \times (0.6 \times \text{PGR} + 0.4 \times \text{RSI}) + 0.35 \times \text{SatisfactionInversion} + 0.20 \times \left(1.0 - \frac{\text{Training}}{6}\right) \right] \times 100$$

*(Note: Renamed from "Retention Opportunity Index" in version 3.0.0 to prevent confusion with financial ROI).*

---

## 3. Mathematical Clustering & Evaluation

### K-Means Clustering:
- **Number of Clusters ($k$):** Validated at $k=4$ using both the **Elbow Method (Inertia Curve)** and **Silhouette Coefficient Analysis** ($s \approx 0.38$).
- **Dimensionality Reduction:** 2D Principal Component Analysis (PCA) projection explains $\approx 64\%$ of total variance across the 7 feature dimensions.
- **Realistic Workforce Silhouette Interpretation:** Silhouette scores in human workforce analytics naturally fall between 0.35 and 0.50. Human career paths are inherently continuous; distinct archetypes exhibit organic overlap rather than artificial geometric isolation.

### Discovered Workforce Archetypes:
1. **Cluster 0 — Fast-Track Rising Talents:** Low tenure, rapid promotion velocity, high training engagement. Flight risk: Low to Moderate.
2. **Cluster 1 — Solid Tenured Backbone:** High organizational tenure, moderate promotion gap, high job satisfaction. Flight risk: Low.
3. **Cluster 2 — Stagnated Senior Specialists:** High tenure, high performance, exceeding level benchmark dwell by 2.5+ years. **Flight risk: Urgent.**
4. **Cluster 3 — Early-Career Exploration:** Low dwell, variable satisfaction, low training attendance. Primary need: L&D alignment.

---

## 4. Survival Analysis, Calibration & Honest Validation

### 4.1 Kaplan-Meier Survival Modeling
Using `lifelines`, non-parametric survival curves estimate:
- **Time-to-Attrition:** Stepwise retention probability over tenure years across the entire workforce and segmented by department and career cluster.
- **Time-to-Promotion Dwell:** Quantifies promotion latency distribution, identifying the median tenure interval prior to vertical progression.

### 4.2 Cox Proportional Hazards Regression
Fits a semi-parametric regression model assessing the hazard ratio ($	ext{HR} = \exp(eta)$) of key career covariates:
- `YearsSinceLastPromotion`: Elevates turnover hazard per unpromoted year beyond level dwell benchmark.
- `JobSatisfaction`: Protective retention factor, reducing departure hazard per survey point.
- `TrainingTimesLastYear`: Capability development acts as a significant retention anchor.
- **Concordance Index (C-Index):** Evaluated via 5-fold cross-validation and 200-sample bootstrap 95% confidence interval ($	ext{CI}_{95\%}$), confirming statistically significant rank discrimination relative to random guessing ($0.50$).
- **Proportional Hazards Assumption:** Verified continuously using Schoenfeld residual tests (`p >= 0.05`).

### 4.3 Stratified Backtesting & Calibration
Evaluated via stratified held-out split (75% train / 25% test cohort preserving class balance):
- **Precision & Recall:** Evaluates true positive vs false positive rates on Urgent-tier flight risk flags.
- **Empirical Brier Score:** Quantifies mean squared error between predicted probabilities and observed binary outcomes ($0.0$ indicates perfect calibration; $0.25$ indicates an uninformative guess).
- **Decile Calibration Curve:** Predicted probability deciles are compared directly against empirical event rates to monitor over-confidence and under-confidence.

### 4.4 Limitations & Validation Status
- **Dynamic Dataset Evaluation:** All validation metrics shown in the application, APIs, and reports are computed dynamically from the active loaded dataset; no static or hardcoded placeholder metrics are used.
- **Data Provenance Disclosure:** Every validation telemetry view displays an active Data Provenance badge (`Synthetic`, `Uploaded`, or `Connected`).
- **Synthetic Data Warning:** When operating on synthetic benchmark datasets, a mandatory disclosure banner is presented: *"Metrics on synthetic data do not demonstrate real-world predictive power. Enterprise validation requires domain-calibrated historical workforce tenure records."*

---

## 5. Ethical Guardrails & Algorithmic Fairness

1. **Zero Protected Attributes in Scoring:**
   The training pipeline and scoring formula strictly exclude demographic attributes (age, gender, ethnicity, marital status, disability).
2. **Automated Fairness Audit:**
   The platform integrates a continuous Four-Fifths Rule ($80\%$ rule) disparate impact auditing module that detects selection rate disparities across protected demographic groups and suppresses cohorts with $n < 10$.
3. **Deterministic Recommendation Rules:**
   Recommendations are rule-based and derived from observable career progression signals rather than stochastic generative outputs.
4. **Presentation Mode Pseudonymization:**
   During live committee reviews, candidate names and IDs are replaced with SHA-256 derived aliases (`CANDIDATE-9A4B`) to eliminate halo effects and unconscious bias.
5. **Human-in-the-Loop Governance:**
   All suggested interventions must be approved, modified, or rejected by human committee members with formal written justifications.

---

## 6. Honest Limitations & Operational Scope

1. **Synthetic Benchmark Calibration:** Models in this demonstration are calibrated on public benchmark distributions. Enterprise deployment requires recalibrating baseline hazard curves to company-specific level dwell times.
2. **Unobserved External Factors:** Career progression models evaluate structural dwell and engagement; they do not observe macroeconomic shocks, competing private equity hiring surges, or personal relocations.
3. **Decision Support Exclusivity:** The system provides diagnostic guidance for HR business partners and talent calibration committees. It never initiates terminations, compensation adjustments, or reassignments autonomously.
