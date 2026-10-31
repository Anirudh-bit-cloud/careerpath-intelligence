# Data Protection Impact Assessment (DPIA) Template

> **Instructions:** This template is pre-filled with the data flows and processing activities of CareerPath Intelligence. The deploying organization's Data Protection Officer (DPO) must review, complete highlighted sections, and sign off before going live with real employee data. This is a template, not a completed DPIA. This document does not constitute legal advice.

**Organization:** [CUSTOMER ORGANIZATION NAME]  
**System:** CareerPath Intelligence v3.2.0  
**DPIA Reference:** [CUSTOMER-DPIA-REF]  
**DPO:** [DPO NAME AND CONTACT]  
**Date initiated:** [DATE]  
**Review date:** [DATE + 12 MONTHS]  
**Status:** DRAFT — For DPO completion

---

## Section 1: Description of Processing

### 1.1 Nature of the Processing

CareerPath Intelligence is a workforce analytics application that processes structured HR data to identify employees at elevated risk of voluntary attrition. It applies statistical models (Cox proportional hazards survival model; gradient-boosted decision trees) to compute per-employee risk scores and retention priority tiers.

The system:
- Ingests HR data via CSV upload, HRIS connector, or SFTP/CSV scheduled ingest
- Computes retention risk scores, promotion gap metrics, and cluster archetypes
- Presents results to authorized HR personnel (admin, hrbp, analyst, manager roles)
- Logs all sensitive queries and decisions in an immutable audit trail
- Supports GDPR Article 15 data subject access request (DSAR) export

### 1.2 Purpose and Legal Basis

| Purpose | Legal Basis (Art. 6 GDPR) | Legitimate Interest Assessment |
|---|---|---|
| Identify employees at retention risk for proactive HR interventions | Art. 6(1)(f) — Legitimate interests | [CUSTOMER TO COMPLETE: LIA required] |
| Succession planning and talent bench analysis | Art. 6(1)(f) — Legitimate interests | [CUSTOMER TO COMPLETE: LIA required] |
| Fairness audit and bias monitoring | Art. 6(1)(c) — Legal obligation (if subject to LL144 or similar) / Art. 6(1)(f) | [CUSTOMER TO COMPLETE] |
| Compliance record-keeping and audit logging | Art. 6(1)(c) — Legal obligation | GDPR Art. 5(2), Art. 30 |

> ⚠️ **DPO action required:** Confirm legal basis for each processing purpose. If using legitimate interests, complete a full Legitimate Interest Assessment (LIA).

### 1.3 Data Categories Processed

| Category | Description | Special Category? |
|---|---|---|
| Employee identifier | Employee ID, name (if present in CSV) | No |
| Demographic attributes | Age band, gender, marital status, department | Gender and marital status are **special category data under Art. 9** — explicit consent or Art. 9(2)(b) employment law basis required |
| Employment data | Tenure, job level, job role, manager ID | No |
| Performance data | Training hours, satisfaction score | No |
| Attrition risk scores | ML-computed RRI score and tier (Urgent/Moderate/Standard) | No (derived, but linked to special-category inferences) |
| Audit log | User email, action, timestamp, IP address | No |

> ⚠️ **DPO action required:** Confirm the legal basis for processing gender and marital status under Art. 9. Assess whether explicit consent or a collective agreement under Art. 9(2)(b) is in place.

### 1.4 Data Retention

| Data | Default Retention | Configurable | Notes |
|---|---|---|---|
| Employee workforce records | 24 months rolling | Yes — admin can configure via Governance panel | Records older than retention threshold are flagged for purge |
| AuditLog entries | 24 months | Yes | Configurable in retention policy |
| Intervention records | 24 months from creation or completion | Yes | |
| Model artifacts | Indefinite (versioned registry) | No — manual deletion | Artifacts contain no personal data |
| Historical exits | 24 months | Yes | Uploaded exit CSVs |

### 1.5 Recipients

| Recipient | Role | Location | Basis for Transfer |
|---|---|---|---|
| HR administrators | admin role | [CUSTOMER TO COMPLETE] | Internal authorized users |
| HR business partners | hrbp role | [CUSTOMER TO COMPLETE] | Internal authorized users |
| HR analysts | analyst role | [CUSTOMER TO COMPLETE] | Internal authorized users |
| Line managers | manager role — restricted to direct reports only | [CUSTOMER TO COMPLETE] | Internal authorized users |
| CareerPath Intelligence SaaS vendor | N/A — self-hosted deployment | [CUSTOMER TO COMPLETE — on-premise or cloud?] | [Data processing agreement required if vendor processes data] |

---

## Section 2: Necessity and Proportionality Assessment

### 2.1 Necessity

The processing is necessary to achieve the stated purpose: identifying retention risk before it becomes a flight decision, enabling targeted HR investment. The alternative — no analytics — results in reactive, undifferentiated attrition interventions that are less effective and less fair.

> **[CUSTOMER TO COMPLETE]:** Confirm that less intrusive alternatives were considered and rejected with reasons.

### 2.2 Proportionality

| Safeguard | Implemented |
|---|---|
| Role-based access control — only authorized roles see risk data | ✅ Yes |
| Manager scope enforcement — managers see only direct reports | ✅ Yes |
| Protected attributes excluded from model features | ✅ Yes |
| No automated decisions — all outputs require human review | ✅ Yes |
| Data minimization — only fields in the uploaded CSV are processed | ✅ Yes |
| Retention limits | ✅ Yes — configurable |
| Employee transparency (DSAR available) | ✅ Yes |
| Audit trail for all sensitive access | ✅ Yes |

---

## Section 3: Risk Identification and Mitigation

| Risk | Likelihood | Impact | Severity | Mitigation |
|---|---|---|---|---|
| Discriminatory targeting based on protected attributes | Medium | High | High | Protected attributes excluded from model; fairness audit with DIR threshold and sign-off gate |
| Unauthorized access to risk scores | Low | High | Medium | RBAC; JWT authentication; audit logging |
| Manager sees employees outside their team | Low | High | Medium | Manager-scope enforcement tested; parametrized negative test suite |
| Re-identification from anonymized cohorts | Low | Medium | Low | n<10 suppression in fairness and cluster outputs |
| Model producing biased risk tiers across demographic groups | Medium | High | High | Monthly fairness drift monitoring; bias sign-off gate before model promotion |
| Data breach — personal data exposed | Low | High | High | Encrypted credentials; RBAC; security headers; no credentials in logs |
| Employees unaware of automated profiling | High | Medium | High | [CUSTOMER TO COMPLETE]: employee notice process required |

> ⚠️ **DPO action required:** Complete residual risk ratings after mitigations. If residual risk remains high, the DPIA must be submitted to the supervisory authority before processing begins (Art. 36).

---

## Section 4: Records of Processing Activities (RoPA) — Article 30

| Field | Value |
|---|---|
| Controller name and contact | [CUSTOMER ORGANIZATION] |
| DPO contact | [DPO NAME, EMAIL] |
| Purposes | Retention risk prediction; succession planning; fairness audit; HR decision support |
| Categories of data subjects | Current employees of [CUSTOMER ORGANIZATION] |
| Categories of personal data | See Section 1.3 |
| Recipients | See Section 1.5 |
| Third-country transfers | [CUSTOMER TO COMPLETE] — None if self-hosted in EU; requires SCCs or adequacy decision if cloud-hosted outside EU |
| Retention periods | See Section 1.4 |
| Security measures | PBKDF2-SHA256 password hashing; JWT tokens; RBAC; TLS in transit; immutable audit log; multi-tenant isolation |

---

## Section 5: Consultation

| Step | Status |
|---|---|
| DPO consulted | ☐ Pending |
| Works council / employee representative consulted | ☐ [CUSTOMER TO COMPLETE] |
| Legal review completed | ☐ Pending |
| Supervisory authority consultation required? | ☐ [DPO to assess — required if residual risk is high after Art. 36] |

---

## Section 6: Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| Data Protection Officer | | | |
| CHRO / Head of People | | | |
| Head of IT Security | | | |
| Legal Counsel | | | |

---

*This DPIA template is provided by the CareerPath Intelligence platform to assist the deploying organization's compliance team. It does not replace legal advice and must be reviewed and completed by a qualified DPO before personal data is processed.*
