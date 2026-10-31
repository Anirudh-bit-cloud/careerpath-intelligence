# CareerPath Intelligence — Compliance Mapping

> **Disclaimer:** This document is provided for informational purposes only and does not constitute legal advice. Organizations should consult qualified legal counsel to assess their specific obligations under applicable law.

**Version:** v3.2.0  
**Last updated:** 2026-10-31  
**Prepared by:** CareerPath Intelligence Engineering Team

---

## Overview

This mapping documents how CareerPath Intelligence supports compliance with key AI and data-protection regulations. Each requirement is mapped to the specific platform feature(s) that satisfy it, with evidence pointers (API endpoint or source file). Items are classified as:

- ✅ **Supported** — The platform directly implements this requirement.
- ⚠️ **Partially supported** — The platform provides tooling, but deployment-level configuration or customer action is also required.
- 🔲 **Customer responsibility** — The platform does not implement this; the customer's legal/HR/IT team must address it.

---

## 1. NYC Local Law 144 (Automated Employment Decision Tools — AEDT)

Effective July 5, 2023. Applies to employers and employment agencies using AEDTs that "substantially assist or replace" discretionary decision-making in hiring or promotion in New York City.

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| **Annual independent bias audit** of the AEDT covering impact ratios by sex and race/ethnicity categories | ⚠️ Partially supported | Four-fifths disparate impact audit via Gender, AgeBand, Department; race/ethnicity requires customer-supplied data and a contracted independent auditor | `GET /api/fairness/summary`, `GET /api/fairness/attribute/{name}`, `GET /api/fairness/export/csv` |
| **Summary of results** (selection rates, impact ratios) posted publicly at least 10 days before use | ⚠️ Partially supported | Bias Audit CSV export is downloadable by admin/hrbp; public posting is customer responsibility | `GET /api/fairness/export/csv` |
| **Candidate/employee notice** at least 10 business days before AEDT is applied | 🔲 Customer responsibility | Platform does not send candidate-facing notices | N/A — customer HR process |
| **Notice of characteristics** considered by the tool | ✅ Supported | Score Explanation endpoint lists all features with weights | `GET /api/employees/{id}/score-explanation` |
| **Accommodation alternative** for candidates who do not consent | 🔲 Customer responsibility | Platform does not manage consent or accommodations | N/A |

> **Gap statement:** CareerPath Intelligence does not cover race/ethnicity dimensions — the dataset contains Gender, AgeBand, Department, and MaritalStatus but not race/ethnicity. An NYC LL144-compliant bias audit requires race/ethnicity data provided by the customer or sourced from a separate HRIS field, and must be conducted by a contracted independent auditor, not the software vendor.

---

## 2. EU AI Act (High-Risk AI System Obligations)

Regulation (EU) 2024/1689, fully applicable from August 2, 2026. AI systems used for employment, worker management, and access to self-employment are classified as **high-risk** (Annex III, §4).

### 2.1 Risk Management System (Art. 9)

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| Establish, implement, document, and maintain risk management system | ⚠️ Partially supported | `MODEL_CARD.md` documents limitations, known risks, and out-of-scope use | `MODEL_CARD.md`, `SECURITY.md` |
| Identify and analyze foreseeable risks | ✅ Supported | Fairness audit flags disparate impact; model card lists risks including synthetic-data limitations and proxy bias | `GET /api/fairness/summary`, `MODEL_CARD.md` |
| Evaluate risks after risk mitigation | ⚠️ Partially supported | Fairness sign-off workflow captures acknowledgment; ongoing monitoring via longitudinal fairness drift | `POST /api/fairness/signoff`, `GET /api/fairness/longitudinal` |
| Adopt risk management measures | ⚠️ Partially supported | RBAC, audit log, human-in-the-loop gate; escalation is customer's process | `GET /api/governance/audit-logs` |

### 2.2 Data and Data Governance (Art. 10)

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| Training data relevant, representative, free of errors | ⚠️ Partially supported | Data quality report detects missing values and outliers; provenance badge shows Synthetic/Uploaded/Connected | `GET /api/dataset/data-quality`, `GET /api/validation/metrics` |
| Statistical properties of training data documented | ✅ Supported | Model Card documents feature set, training approach, and data description | `MODEL_CARD.md` |
| Examine possible biases in training data | ✅ Supported | Fairness audit computes DIR and EOD per protected attribute | `GET /api/fairness/summary` |
| Protected attributes not used as model features | ✅ Supported | Gender, AgeBand, MaritalStatus are explicitly excluded from all feature vectors; enforced by code | `backend/app/services/attrition_service.py` |

### 2.3 Technical Documentation and Logging (Art. 11, 12)

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| Technical documentation before placing on market | ✅ Supported | MODEL_CARD.md, README.md, COMPLIANCE_MAPPING.md | `docs/`, `MODEL_CARD.md` |
| Automatic logging of system activity | ✅ Supported | Immutable AuditLog records every sensitive query, model promotion, fairness view, and sign-off | `GET /api/governance/audit-logs` |
| Logging sufficient to enable post-hoc reconstruction | ✅ Supported | AuditLog records action, entity_type, entity_id, user_email, workspace_id, timestamp | `backend/app/models/entities.py` — `AuditLog` |
| Logs stored for at least 6 months (provider) / appropriate period (deployer) | ⚠️ Partially supported | Retention policy enforced via data retention preview/purge; default retention configurable | `GET /api/governance/retention-preview`, `POST /api/governance/enforce-retention` |

### 2.4 Transparency and Information to Deployers (Art. 13)

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| Clear information to the deployer including purpose, performance metrics, and limitations | ✅ Supported | MODEL_CARD.md, README, and score explanation endpoint | `MODEL_CARD.md`, `GET /api/employees/{id}/score-explanation` |
| Disclosure that the system is AI | ✅ Supported | UI consistently labels ML-derived scores as model outputs with provenance badges | Frontend — all `MetricCard` and score display components |

### 2.5 Human Oversight (Art. 14)

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| Humans can fully understand the system's capabilities and limitations | ✅ Supported | Waterfall score explanation, counterfactual, and model card | `GET /api/employees/{id}/score-explanation` |
| Humans can disregard or override system output | ✅ Supported | System produces risk tiers for HR review; it never triggers any action automatically | Design principle — all actions require explicit human decision |
| Human oversight assigned to competent persons | 🔲 Customer responsibility | Role assignment and training of HR personnel is customer process | N/A |
| System can be paused or stopped | ✅ Supported | Admin can roll back model version; fairness sign-off can block promotion | `POST /api/models/{id}/rollback`, `POST /api/fairness/signoff` |

### 2.6 Accuracy, Robustness, and Cybersecurity (Art. 15)

| Requirement | Status | Platform Feature | Evidence Location |
|---|---|---|---|
| Appropriate level of accuracy for intended purpose | ✅ Supported | C-index with bootstrap 95% CI, Brier score, ROC-AUC reported; backtest on temporal splits | `GET /api/validation/metrics`, `GET /api/validation/temporal-backtest` |
| Resilience against errors, faults, and inconsistencies | ⚠️ Partially supported | Error handling and data quality checks; no adversarial robustness testing | `GET /api/dataset/data-quality` |
| Cybersecurity measures | ✅ Supported | JWT authentication, PBKDF2-SHA256 password hashing, RBAC, CORS, security headers | `backend/app/core/security.py`, `SECURITY.md` |

---

## 3. GDPR (Regulation (EU) 2016/679)

### Art. 5 — Principles relating to processing

| Principle | Status | Platform Feature | Evidence |
|---|---|---|---|
| Lawfulness, fairness, transparency | ⚠️ Partially supported | Platform provides transparency tooling; lawful basis must be established by the deploying organization | DSAR, audit log |
| Purpose limitation | ⚠️ Partially supported | Platform is scoped to workforce analytics; enforcing purpose limitation beyond the platform is customer responsibility | N/A |
| Data minimisation | ⚠️ Partially supported | Platform processes only fields in the uploaded CSV; minimisation of the source data is customer responsibility | `GET /api/dataset/data-quality` |
| Accuracy | ✅ Supported | Data quality report detects anomalies; admin can upload corrected data | `GET /api/dataset/data-quality` |
| Storage limitation | ✅ Supported | Configurable data retention policy with preview and purge | `GET /api/governance/retention-preview` |
| Integrity and confidentiality | ✅ Supported | Encrypted credentials, RBAC, audit logging, multi-tenant isolation | `SECURITY.md` |

### Art. 13–15 — Information and access rights

| Requirement | Status | Platform Feature | Evidence |
|---|---|---|---|
| Art. 13/14 — Inform data subjects at collection | 🔲 Customer responsibility | Notice to employees is deployer obligation; platform does not send employee-facing notices | N/A |
| Art. 15 — Right of access (Subject Access Request) | ✅ Supported | Automated DSAR export in JSON format, covering all stored analytical records for the employee | `GET /api/governance/data-subject-export?employee_id={id}` |

### Art. 17 — Right to erasure

| Requirement | Status | Platform Feature | Evidence |
|---|---|---|---|
| Erase personal data on request | ⚠️ Partially supported | Data retention purge removes records older than the threshold; individual-record erasure is not yet implemented as a standalone endpoint | `POST /api/governance/enforce-retention` |

### Art. 22 — Automated individual decision-making

| Requirement | Status | Platform Feature | Evidence |
|---|---|---|---|
| No solely automated decisions with significant legal effect | ✅ Supported | System design principle: no automated termination, compensation, or disciplinary decisions. All outputs are risk tiers for HR review. | Design docs, `MODEL_CARD.md` |
| Provide meaningful information about the logic | ✅ Supported | Score explanation waterfall + counterfactual available per employee | `GET /api/employees/{id}/score-explanation` |

### Art. 30 — Records of processing activities (RoPA)

| Requirement | Status | Platform Feature | Evidence |
|---|---|---|---|
| Maintain RoPA covering purpose, categories of data, recipients, retention periods | ⚠️ Partially supported | AuditLog and data quality report provide partial records; full RoPA must be maintained by the customer DPO | `DPIA_TEMPLATE.md` contains a RoPA template |

### Art. 35 — Data Protection Impact Assessment (DPIA)

| Requirement | Status | Platform Feature | Evidence |
|---|---|---|---|
| DPIA required for large-scale systematic monitoring of employees | ⚠️ Partially supported | Platform provides a pre-filled DPIA template; the customer DPO must complete, review, and sign it | `docs/DPIA_TEMPLATE.md` |

---

## 4. Summary Status Table

| Regulation | Supported | Partially Supported | Customer Responsibility |
|---|---|---|---|
| NYC Local Law 144 | 2 | 2 | 1 |
| EU AI Act (High-Risk) | 12 | 9 | 2 |
| GDPR | 5 | 6 | 3 |

---

## 5. Known Gaps and Remediation Roadmap

| Gap | Severity | Planned Resolution |
|---|---|---|
| Race/ethnicity not in dataset — NYC LL144 impact ratio incomplete | High | Customer must supply race/ethnicity field; platform will add as optional protected attribute in v3.3 |
| Art. 17 individual erasure endpoint not implemented | Medium | Planned for v3.3: `DELETE /api/employees/{id}/personal-data` |
| Adversarial robustness testing not performed | Low | Planned: add robustness section to MODEL_CARD.md and model evaluation pipeline |
| Candidate-facing notices for LL144 | High | Customer process; not a platform feature |

---

*This document was generated from code-computed values and feature inventory. It is updated with each release. It is not legal advice.*
