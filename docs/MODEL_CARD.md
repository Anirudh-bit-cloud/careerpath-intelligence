# Model Card — CareerPath Workforce Intelligence ML Engine

**Model Name:** CareerPath Workforce Progression & Retention Clustering Engine  
**Version:** 2.1.0  
**Model Type:** Hybrid Unsupervised Machine Learning (K-Means + PCA) & Rule-Based Decision Policy  
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
1. **Promotion Gap (Years):**
   $$\text{Promotion Gap} = \max(0, \text{YearsSincePromotion} - \text{BenchmarkDwell}(\text{JobLevel}))$$
2. **Career Velocity:**
   $$\text{Velocity} = \frac{\text{JobLevel}}{\max(1.0, \text{YearsAtCompany})}$$
3. **Retention Opportunity Index (ROI Score):**
   $$\text{ROI} = w_1 \cdot \text{Norm}(\text{PromotionGap}) + w_2 \cdot \text{ClusterRisk} + w_3 \cdot \text{SatisfactionInversion} + w_4 \cdot \text{TenureWeight}$$

---

## 3. Mathematical Clustering & Evaluation

### K-Means Clustering:
- **Number of Clusters ($k$):** Validated at $k=4$ using both the **Elbow Method (Inertia Curve)** and **Silhouette Coefficient Analysis** ($s \approx 0.38$).
- **Dimensionality Reduction:** 2D Principal Component Analysis (PCA) projection explains $\approx 64\%$ of total variance across the 7 feature dimensions.

### Discovered Workforce Archetypes:
1. **Cluster 0 — Fast-Track Rising Talents:** Low tenure, rapid promotion velocity, high training engagement. Flight risk: Low to Moderate.
2. **Cluster 1 — Solid Tenured Backbone:** High organizational tenure, moderate promotion gap, high job satisfaction. Flight risk: Low.
3. **Cluster 2 — Stagnated Senior Specialists:** High tenure, high performance, exceeding level benchmark dwell by 2.5+ years. **Flight risk: Urgent.**
4. **Cluster 3 — Early-Career Exploration:** Low dwell, variable satisfaction, low training attendance. Primary need: L&D alignment.

---

## 4. Ethical Guardrails & Algorithmic Fairness

1. **Zero Protected Attributes in Scoring:**
   The training pipeline and scoring formula strictly exclude demographic attributes (age, gender, ethnicity, marital status, disability).
2. **Deterministic Recommendation Rules:**
   Recommendations are rule-based and derived from observable career progression signals rather than stochastic generative outputs.
3. **Presentation Mode Pseudonymization:**
   During live committee reviews, candidate names and IDs are replaced with SHA-256 derived aliases (`CANDIDATE-9A4B`) to eliminate halo effects and unconscious bias.
4. **Human-in-the-Loop Governance:**
   All suggested interventions must be approved, modified, or rejected by human committee members with formal written justifications.

---

## 5. Auditability & Explainability

Every scoring calculation can be inspected at the individual record level. When viewing an employee profile, the system displays the exact percentage contribution of each feature to their Retention Opportunity Index.
