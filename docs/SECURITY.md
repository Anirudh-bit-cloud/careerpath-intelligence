# CareerPath Intelligence — Security Architecture & Trust Governance

This document describes the security controls, cryptography, data isolation, and privacy compliance standards implemented in CareerPath Intelligence.

---

## 1. Authentication & Password Security

### Password Storage
- Passwords are encrypted using **PBKDF2-HMAC-SHA256** with **100,000 hash iterations** and a unique cryptographically random 16-byte salt per user.
- Plaintext passwords are never logged, serialized, or returned in API responses.

### Session Management
- Signed session tokens are issued upon authentication using SHA-256 HMAC tokens containing user ID, role, tenant workspace ID, and ISO 8601 expiration timestamps.
- Tokens are transmitted via standard HTTP `Authorization: Bearer <token>` headers.

---

## 2. Multi-Tenant Isolation & Role-Based Access Control (RBAC)

### Tenant Partitioning
- Every database model (`User`, `ScoringPolicy`, `InterventionRecord`, `CommitteeSession`, `AuditLog`, `WebhookEndpoint`, `ApiKey`) enforces strict partitioning via `workspace_id`.
- Analytical queries and scoring policy modifications are bounded by the requesting tenant's workspace identifier.

### RBAC Permission Matrix

| Role | Scope & Permissions |
| :--- | :--- |
| **`admin`** | Full workspace administration, user provisioning, custom scoring policy updates, audit trail exports, API key revocation, and HRIS connector management. |
| **`hrbp`** | View analytics, create and edit retention interventions, view employee profiles, and submit committee feedback. |
| **`hr_analyst`** | View all executive analytics, clusters, promotion gap reports, and run policy impact simulations (read-only on sensitive employee profiles). |
| **`talent_committee`** | Access **Talent Committee Mode**, view pseudonymized candidate dossiers, record calibration decisions, and review session minutes. |

---

## 3. Cryptographic Webhooks & API Key Security

### Public REST API Keys
- API keys follow the format `cp_live_<hex_token>`.
- Only a cryptographically truncated prefix (`cp_live_...`) is retained in plaintext; the secret key hash is verified via SHA-256.

### Outgoing Webhook Integrity (HMAC-SHA256)
- Every outbound webhook dispatch includes a cryptographic signature header:
  ```http
  X-Signature-SHA256: <hex_hmac_signature>
  X-Timestamp: 2026-10-23T02:00:00Z
  Content-Type: application/json
  ```
- Receiving enterprise endpoints verify payload integrity using their shared secret token.

---

## 4. Immutable Audit Trail & Logging

- All analytical executions, scoring policy modifications, dataset uploads, and committee decisions generate append-only records in the `audit_logs` table.
- Logs capture timestamp, actor email, action verb, resource identifier, and source IP address.
- Audit logs are accessible to administrators via the **Trust Center** (`/trust-center`) or via `GET /api/governance/audit-logs`.

---

## 5. GDPR & Privacy Compliance

### Article 15 — Right of Access (DSAR)
- The platform provides automated machine-readable JSON compilation of an employee's complete analytical footprint (`GET /api/governance/data-subject-export?employee_id=...`).
- Includes tenure metrics, historical level dwells, cluster archetype assignment, priority scores, and active intervention records.

### Bias Mitigation via Pseudonymization
- In **Talent Committee Review Mode**, candidate names and employee IDs are masked using SHA-256 derived tokens (`CANDIDATE-9A4B`) to eliminate demographic and affinity bias during promotion calibration discussions.
