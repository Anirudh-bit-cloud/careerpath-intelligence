"""
Enhanced Security & Authentication Utilities for CareerPath Intelligence.
- PBKDF2-HMAC-SHA256 password hashing with 600,000 iterations and per-hash iteration tracking.
- Transparent re-hashing support for legacy hashes on authentication.
- Standard JWT (access token + refresh token) with role, workspace_id claims, and key rotation support (kid header).
- TOTP-based Multi-Factor Authentication (pyotp) with backup recovery codes.
- Cryptographic HMAC-SHA256 webhook signatures.
- Comprehensive RBAC permission matrix.
"""

import hashlib
import hmac
import os
import secrets
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
import jwt
import pyotp

# Salt length and PBKDF2 iteration configurations
SALT_BYTES = 16
DEFAULT_PBKDF2_ITERATIONS = 600_000
LEGACY_PBKDF2_ITERATIONS = 100_000

# Key management and rotation support
# Keys can be specified as a dict or primary key with key-id
PRIMARY_KEY_ID = os.environ.get("CP_KEY_ID", "k2026-01")
JWT_SECRETS: Dict[str, str] = {
    PRIMARY_KEY_ID: os.environ.get("CP_SECRET_KEY", "careerpath-intel-enterprise-secret-key-64bytes-min-prod"),
    "k2025-legacy": "careerpath-intel-dev-secret-key-32bytes-min"
}
PRIMARY_SECRET = JWT_SECRETS[PRIMARY_KEY_ID]

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


# ─────────────────────────────────────────────────────────────────────────────
# 1. PBKDF2-HMAC-SHA256 WITH PER-HASH STORED ITERATIONS
# ─────────────────────────────────────────────────────────────────────────────

def hash_password(password: str, iterations: int = DEFAULT_PBKDF2_ITERATIONS) -> str:
    """
    Hashes password using PBKDF2-HMAC-SHA256 with stored iterations.
    Format: iterations$salt_hex$key_hex
    Example: 600000$a1b2c3...$d4e5f6...
    """
    salt = secrets.token_bytes(SALT_BYTES)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"{iterations}${salt.hex()}${key.hex()}"


def verify_password_and_check_rehash(plain_password: str, stored_hash: str) -> Tuple[bool, bool, Optional[str]]:
    """
    Verifies a plain password against stored hash.
    Supports both new format (iterations$salt$key) and legacy format (salt$key).
    Returns: (is_valid, needs_rehash, optional_new_hash_if_rehash_needed)
    """
    try:
        parts = stored_hash.split('$')
        if len(parts) == 3:
            # Modern format: iterations$salt$key
            iterations = int(parts[0])
            salt = bytes.fromhex(parts[1])
            expected_key = bytes.fromhex(parts[2])
            actual_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
            is_valid = hmac.compare_digest(actual_key, expected_key)
            if not is_valid:
                return False, False, None
            # Needs rehash if iterations are less than current target
            if iterations < DEFAULT_PBKDF2_ITERATIONS:
                new_hash = hash_password(plain_password, DEFAULT_PBKDF2_ITERATIONS)
                return True, True, new_hash
            return True, False, None

        elif len(parts) == 2:
            # Legacy format: salt$key (100,000 iterations)
            salt = bytes.fromhex(parts[0])
            expected_key = bytes.fromhex(parts[1])
            actual_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, LEGACY_PBKDF2_ITERATIONS)
            is_valid = hmac.compare_digest(actual_key, expected_key)
            if not is_valid:
                return False, False, None
            # Always rehash legacy passwords to 600,000 iterations
            new_hash = hash_password(plain_password, DEFAULT_PBKDF2_ITERATIONS)
            return True, True, new_hash

        return False, False, None
    except Exception:
        return False, False, None


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Simple backward-compatible verify wrapper."""
    valid, _, _ = verify_password_and_check_rehash(plain_password, stored_hash)
    return valid


# ─────────────────────────────────────────────────────────────────────────────
# 2. STANDARD JWT ACCESS & REFRESH TOKENS (WITH KEY ROTATION SUPPORT)
# ─────────────────────────────────────────────────────────────────────────────

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    key_id: str = PRIMARY_KEY_ID
) -> str:
    """Creates a short-lived standard JWT access token with kid header."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "token_type": "access",
        "iss": "careerpath-intelligence"
    })
    secret = JWT_SECRETS.get(key_id, PRIMARY_SECRET)
    headers = {"kid": key_id}
    return jwt.encode(to_encode, secret, algorithm="HS256", headers=headers)


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    key_id: str = PRIMARY_KEY_ID
) -> str:
    """Creates a longer-lived standard JWT refresh token with kid header."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "token_type": "refresh",
        "iss": "careerpath-intelligence"
    })
    secret = JWT_SECRETS.get(key_id, PRIMARY_SECRET)
    headers = {"kid": key_id}
    return jwt.encode(to_encode, secret, algorithm="HS256", headers=headers)


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes a JWT token using the matching key specified in the kid header."""
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid", PRIMARY_KEY_ID)
        secret = JWT_SECRETS.get(kid, PRIMARY_SECRET)
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            issuer="careerpath-intelligence"
        )
        return payload
    except Exception:
        # Fallback support for legacy custom session token during transition
        return _verify_legacy_session_token(token)


def _verify_legacy_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Legacy session token verifier fallback."""
    try:
        if not token or '.' not in token:
            return None
        b64_payload, sig = token.split('.', 1)
        expected_sig = hmac.new(PRIMARY_SECRET.encode('utf-8'), b64_payload.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            # Try legacy secret
            legacy_sig = hmac.new(JWT_SECRETS["k2025-legacy"].encode('utf-8'), b64_payload.encode('utf-8'), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig, legacy_sig):
                return None
        raw_json = base64.urlsafe_b64decode(b64_payload.encode('utf-8')).decode('utf-8')
        payload = json.loads(raw_json)
        exp = datetime.fromisoformat(payload["exp"])
        if datetime.now(timezone.utc) > exp.replace(tzinfo=timezone.utc if exp.tzinfo is None else exp.tzinfo):
            return None
        return payload
    except Exception:
        return None


# Backward-compatible aliases
def create_session_token(data: Dict[str, Any], expires_hours: int = 24) -> str:
    return create_access_token(data, expires_delta=timedelta(hours=expires_hours))

def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    return decode_jwt_token(token)


# ─────────────────────────────────────────────────────────────────────────────
# 3. TOTP MULTI-FACTOR AUTHENTICATION (MFA)
# ─────────────────────────────────────────────────────────────────────────────

def generate_mfa_secret() -> str:
    """Generates a random base32 TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer_name: str = "CareerPath Intelligence") -> str:
    """Generates an otpauth:// provisioning URI for QR codes."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer_name)


def verify_totp_code(secret: str, code: str) -> bool:
    """Verifies a 6-digit TOTP token allowing 1 window (30s drift)."""
    if not secret or not code:
        return False
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(code.strip(), valid_window=1)
    except Exception:
        return False


def generate_recovery_codes(count: int = 8) -> List[str]:
    """Generates a list of single-use backup recovery codes formatted as XXXX-XXXX."""
    codes = []
    for _ in range(count):
        raw = secrets.token_hex(4).upper()
        codes.append(f"{raw[:4]}-{raw[4:]}")
    return codes


def hash_recovery_code(code: str) -> str:
    """Hashes a recovery code with SHA-256 for safe storage."""
    clean = code.strip().replace("-", "").upper()
    return hashlib.sha256(clean.encode('utf-8')).hexdigest()


def verify_recovery_code(code: str, hashed_codes: List[str]) -> Tuple[bool, Optional[str]]:
    """Checks if recovery code matches any hashed recovery code."""
    target_hash = hash_recovery_code(code)
    for h in hashed_codes:
        if hmac.compare_digest(target_hash, h):
            return True, h
    return False, None


# ─────────────────────────────────────────────────────────────────────────────
# 4. RBAC PERMISSION MATRIX
# ─────────────────────────────────────────────────────────────────────────────

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": [
        "view:analytics", "export:data", "manage:plans", "manage:policy",
        "manage:users", "manage:org", "manage:connectors", "manage:webhooks",
        "view:audit", "participate:committee", "audit:fairness", "view:validation"
    ],
    "hr_analyst": [
        "view:analytics", "export:data", "manage:plans", "run:clustering",
        "view:reports", "participate:committee", "view:validation"
    ],
    "hrbp": [
        "view:analytics", "export:data", "manage:plans", "request:review",
        "participate:committee", "audit:fairness"
    ],
    "talent_committee": [
        "view:analytics", "participate:committee", "record:decisions", "view:reports"
    ]
}


def has_permission(role: str, permission: str) -> bool:
    """Validates if a given role possesses the specified permission."""
    return permission in ROLE_PERMISSIONS.get(role, [])


# ─────────────────────────────────────────────────────────────────────────────
# 5. CRYPTOGRAPHIC WEBHOOK SIGNATURES
# ─────────────────────────────────────────────────────────────────────────────

def compute_webhook_signature(payload_bytes: bytes, secret: str) -> str:
    """Generates an HMAC-SHA256 signature for outgoing webhook delivery."""
    return hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()

# Backward-compatible alias
compute_hmac_signature = compute_webhook_signature


def verify_webhook_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    """Verifies that an incoming webhook payload matches the provided signature."""
    expected_sig = compute_webhook_signature(payload_bytes, secret)
    return hmac.compare_digest(signature, expected_sig)
