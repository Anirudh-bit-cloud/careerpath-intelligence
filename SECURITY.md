# CareerPath Intelligence — Security Policy & Trust Governance

See full documentation in [docs/SECURITY.md](file:///careerpath-intelligence/docs/SECURITY.md).

### Key Security Safeguards
1. **PBKDF2-HMAC-SHA256 (600,000 iterations):** Passwords securely hashed with per-hash iterations and transparent upgrades.
2. **Standard JWT Tokens & Key Rotation:** Short-lived access tokens, refresh tokens, and kid key rings.
3. **Multi-Tenant Isolation:** Guaranteed `workspace_id` partitioning across every database table and query.
4. **Manager Scoping:** Strict direct-report bounding (`ManagerID == current_user.employee_id`) with 403 Forbidden barriers on non-team profiles.
5. **Score View Audit Trail:** Purpose-logged audit records on all individual score views (`manager_direct_report_review`).
6. **Safe Model Artifact Loading:** Path validation (`os.path.realpath`) and SHA-256 hash checks before unpickling/deserializing joblib/pickle artifacts. Untrusted external deserialization is strictly prohibited.
