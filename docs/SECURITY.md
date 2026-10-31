# CareerPath Intelligence — Security Architecture & Trust Governance

This document describes the security controls, cryptography, data isolation, and privacy compliance standards implemented in CareerPath Intelligence.

---

## 1. Authentication & Password Security

### Hardened PBKDF2-HMAC-SHA256 (600,000 Iterations)
- Passwords are encrypted using **PBKDF2-HMAC-SHA256** with **600,000 hash iterations** (meeting and exceeding OWASP 2024–2026 security benchmarks).
- Hashes are stored with explicit per-hash iteration counts in the format:
  ```text
  <iterations>$<salt_hex>$<key_hex>
  e.g., 600000$a1b2c3d4...$e5f6a7b8...
  ```
- **Transparent Re-Hashing:** Legacy hashes (e.g. from earlier 100,000 iteration baselines) are automatically verified and transparently re-hashed to 600,000 iterations upon successful user login without user disruption.
- Plaintext passwords are never logged, serialized, or returned in API responses.

### Rate Limiting & Account Lockout
- **Threshold:** Maximum 5 consecutive failed login attempts.
- **Lockout Window:** 15 minutes temporary lockout after repeated failures (`HTTP 423 Locked`).
- **Audit Logging:** Every failed attempt, account lockout, and password re-hash event is recorded in the immutable `AuditLog` table with IP address tracking.

---

## 2. Token Architecture & Key Rotation

### Standard JWT Tokens
- **Access Tokens:** Short-lived JWT access tokens (`exp: 30 minutes`, algorithm `HS256`) carrying user claims:
  - `user_id`, `email`, `role`, `workspace_id`, and explicit `permissions`.
  - Cryptographic standard issuer (`iss: careerpath-intelligence`) and issued-at timestamps (`iat`).
- **Refresh Tokens:** Long-lived JWT refresh tokens (`exp: 7 days`) exchanged via `POST /api/auth/refresh`.
- **Key Rotation Support:** Tokens include a Key ID header (`kid: k2026-01`). The backend maintains a key ring mapping `kid` to active and sunsetting secret keys, enabling zero-downtime key rotation.

---

## 3. Multi-Factor Authentication (MFA / 2FA)

- **Standard:** Time-based One-Time Passwords (TOTP, RFC 6238) via `pyotp`.
- **Target Roles:** Supported for all users, strongly recommended and enforced for `admin` and `hrbp` roles.
- **Enrollment Flow:**
  1. `POST /api/auth/mfa/setup`: Generates a cryptographically random Base32 secret, an `otpauth://` provisioning URI, and 8 single-use recovery codes (`XXXX-XXXX`).
  2. `POST /api/auth/mfa/verify-enrollment`: Verifies initial TOTP code to activate MFA on the account.
- **Backup Recovery Codes:** Stored as SHA-256 hashes in `mfa_recovery_codes_json`. Used codes are immediately consumed and revoked.

---

## 4. Multi-Tenant Isolation & Role-Based Access Control (RBAC)

### Tenant Partitioning
- Every database model (`User`, `ScoringPolicy`, `InterventionRecord`, `CommitteeSession`, `AuditLog`, `WebhookEndpoint`, `ApiKey`) enforces strict partitioning via `workspace_id`.
- Analytical queries and scoring policy modifications are bounded by the requesting tenant's workspace identifier.

### RBAC Permission Matrix

| Role | Scope & Permissions |
| :--- | :--- |
| **`admin`** | Full workspace administration, user provisioning, custom scoring policy updates, audit trail exports, API key revocation, HRIS connector management, model registry lifecycle, and fairness audits. |
| **`hrbp`** | View analytics, create and edit retention interventions, view employee profiles, submit committee feedback, and access fairness audits. |
| **`hr_analyst`** | View all executive analytics, clusters, promotion gap reports, run policy impact simulations, inspect model registry artifacts, and view model validation panels. |
| **`manager`** | Scoped strictly to direct reports (`ManagerID == current_user.employee_id`). Access to non-team records returns `HTTP 403 Forbidden`. Can prepare 1-on-1 agendas, inspect top 3 drivers, schedule follow-ups, and review supportive talking points. |
| **`talent_committee`** | Access **Talent Committee Mode**, view pseudonymized candidate dossiers, record calibration decisions, and review session minutes. |

### Score View Audit Logging
To prevent unmonitored surveillance or improper access, every individual employee profile, score explanation, and counterfactual accessed by any role (including managers reviewing direct reports) is automatically recorded in `AuditLog` with:
- `action = "view_score_explanation"` or `"view_employee_profile"`
- `purpose = "manager_direct_report_review"` or `"hrbp_calibration"`
- Target `employee_id`, `workspace_id`, authenticated `user_id`, and `ip_address`.

---

## 5. Security Middleware & Defense in Depth

### Strict Security Headers Middleware
Every HTTP response includes hardened security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'; ...`

### Strict CORS Configuration
- CORS allowed origins are explicitly managed via the `CORS_ORIGINS` environment variable (e.g. `http://localhost:5173,http://127.0.0.1:5173`). Wildcard `*` is disabled in production.

---

## 6. Cryptographic Webhooks & API Key Security

### Public REST API Keys
- API keys follow the format `cp_live_<hex_token>`.
- Only a cryptographically truncated prefix (`cp_live_...`) is retained in plaintext; the secret key hash is verified via SHA-256.

### Outgoing Webhook Integrity (HMAC-SHA256)
- Outbound webhooks include a cryptographic signature header:
  ```http
  X-Signature-SHA256: <hex_hmac_signature>
  X-Timestamp: 2026-10-30T03:00:00Z
  Content-Type: application/json
  ```
- Receiving endpoints verify payload integrity using their shared secret token.

---

## 7. GDPR & Privacy Compliance

- **Article 15 (Right of Access / DSAR):** Automated machine-readable JSON export of complete analytical footprints (`GET /api/governance/data-subject-export?employee_id=...`).
- **Talent Committee Pseudonymization:** Live Presentation Mode masks identifiers (`CANDIDATE-9A4B`) to eliminate demographic and affinity bias during talent reviews.
