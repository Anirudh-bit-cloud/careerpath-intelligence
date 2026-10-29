"""
Security & Authentication Utilities for CareerPath Intelligence.
Implements PBKDF2-HMAC-SHA256 password hashing, token generation, and RBAC permissions.
"""

import hashlib
import hmac
import os
import secrets
import json
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

# Salt length and iterations
SALT_BYTES = 16
PBKDF2_ITERATIONS = 100_000

SECRET_KEY = os.environ.get("CP_SECRET_KEY", "careerpath-intel-dev-secret-key-32bytes-min")


def hash_password(password: str) -> str:
    """Hashes a password with a fresh random salt using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_bytes(SALT_BYTES)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ITERATIONS)
    # Store as salt_hex$key_hex
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verifies a plain password against stored salt$key hash."""
    try:
        parts = stored_hash.split('$')
        if len(parts) != 2:
            return False
        salt = bytes.fromhex(parts[0])
        expected_key = bytes.fromhex(parts[1])
        actual_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, PBKDF2_ITERATIONS)
        return hmac.compare_digest(actual_key, expected_key)
    except Exception:
        return False


def create_session_token(data: Dict[str, Any], expires_hours: int = 24) -> str:
    """Creates a signed session token containing payload data."""
    payload = data.copy()
    payload["exp"] = (datetime.utcnow() + timedelta(hours=expires_hours)).isoformat()
    raw_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    b64_payload = base64.urlsafe_b64encode(raw_json).decode('utf-8')
    sig = hmac.new(SECRET_KEY.encode('utf-8'), b64_payload.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"


def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies and decodes a signed session token. Returns payload or None."""
    try:
        if not token or '.' not in token:
            return None
        b64_payload, sig = token.split('.', 1)
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), b64_payload.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        raw_json = base64.urlsafe_b64decode(b64_payload.encode('utf-8')).decode('utf-8')
        payload = json.loads(raw_json)
        exp = datetime.fromisoformat(payload["exp"])
        if datetime.utcnow() > exp:
            return None
        return payload
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# RBAC PERMISSION MATRIX
# ─────────────────────────────────────────────────────────────────────────────
# Roles:
# - admin: Full control over org settings, policy, users, data import, webhooks, audit logs
# - hr_analyst: Dataset analytics, ML re-clustering, exports, reports, review read
# - hrbp: Candidate reviews, initiating and updating action plans, comments
# - talent_committee: Committee session viewing, decision recording, minutes generation

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": [
        "view:analytics", "export:data", "manage:plans", "manage:policy",
        "manage:users", "manage:org", "manage:connectors", "manage:webhooks",
        "view:audit", "participate:committee"
    ],
    "hr_analyst": [
        "view:analytics", "export:data", "manage:plans", "run:clustering",
        "view:reports", "participate:committee"
    ],
    "hrbp": [
        "view:analytics", "export:data", "manage:plans", "request:review",
        "participate:committee"
    ],
    "talent_committee": [
        "view:analytics", "participate:committee", "record:decisions", "view:reports"
    ]
}


def has_permission(user_role: str, permission: str) -> bool:
    """Checks if a user role has a specific permission."""
    perms = ROLE_PERMISSIONS.get(user_role, [])
    return permission in perms


def compute_hmac_signature(payload_str: str, secret: str) -> str:
    """Computes HMAC-SHA256 signature for outgoing webhook dispatch."""
    return hmac.new(secret.encode('utf-8'), payload_str.encode('utf-8'), hashlib.sha256).hexdigest()
