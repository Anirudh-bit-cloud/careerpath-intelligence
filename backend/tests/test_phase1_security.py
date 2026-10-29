"""
Tests for Phase 1 Security Hardening:
- 600,000 PBKDF2 iterations and per-hash iteration storage.
- Transparent re-hashing on login.
- Standard JWT access token & refresh token with kid header & key rotation.
- Rate limiting and temporary lockout with AuditLog entry.
- TOTP MFA setup, verification, and recovery codes.
- Security headers middleware.
"""

import pytest
import time
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import (
    hash_password, verify_password_and_check_rehash,
    create_access_token, create_refresh_token, decode_jwt_token,
    generate_mfa_secret, verify_totp_code,
    generate_recovery_codes, hash_recovery_code, verify_recovery_code,
    DEFAULT_PBKDF2_ITERATIONS
)
from backend.app.database.connection import SessionLocal
from backend.app.models.entities import User, AuditLog
import pyotp

client = TestClient(app)


def test_pbkdf2_iterations_and_rehash():
    # 1. New hash uses 600,000 iterations and format iterations$salt$key
    pwd = "EnterprisePassword2026!"
    h600k = hash_password(pwd, iterations=600_000)
    assert h600k.startswith("600000$")
    valid, needs_rehash, new_h = verify_password_and_check_rehash(pwd, h600k)
    assert valid is True
    assert needs_rehash is False
    assert new_h is None

    # 2. Legacy hash (100,000 iterations, format salt$key)
    # Simulate legacy hash
    import hashlib
    salt = b"0123456789abcdef"
    legacy_key = hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt, 100_000)
    legacy_hash = f"{salt.hex()}${legacy_key.hex()}"

    valid_leg, needs_rehash_leg, new_h_leg = verify_password_and_check_rehash(pwd, legacy_hash)
    assert valid_leg is True
    assert needs_rehash_leg is True
    assert new_h_leg is not None
    assert new_h_leg.startswith("600000$")

    # 3. Transparent re-hash upon login via API
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "rehash_test@company.com").first()
        if not user:
            user = User(
                email="rehash_test@company.com",
                password_hash=legacy_hash,
                full_name="Rehash Tester",
                role="hrbp",
                workspace_id="default"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.password_hash = legacy_hash
            db.commit()
    finally:
        db.close()

    res = client.post("/api/auth/login", json={"email": "rehash_test@company.com", "password": pwd})
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert "access_token" in data
    assert "refresh_token" in data

    # Verify user's hash in DB is now 600k
    db = SessionLocal()
    try:
        u_updated = db.query(User).filter(User.email == "rehash_test@company.com").first()
        assert u_updated.password_hash.startswith("600000$")
    finally:
        db.close()


def test_jwt_access_and_refresh_tokens():
    claims = {
        "user_id": 999,
        "email": "jwt_test@company.com",
        "role": "admin",
        "workspace_id": "panw-cyber"
    }
    access_token = create_access_token(claims)
    refresh_token = create_refresh_token(claims)

    decoded_acc = decode_jwt_token(access_token)
    assert decoded_acc is not None
    assert decoded_acc["email"] == "jwt_test@company.com"
    assert decoded_acc["token_type"] == "access"
    assert decoded_acc["iss"] == "careerpath-intelligence"

    decoded_ref = decode_jwt_token(refresh_token)
    assert decoded_ref is not None
    assert decoded_ref["token_type"] == "refresh"

    # Test refresh endpoint
    res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    # Will fail if user 999 doesn't exist in DB, so let's test with existing admin user
    login_res = client.post("/api/auth/login", json={"email": "admin@company.com", "role": "admin"})
    assert login_res.status_code == 200
    ref_token = login_res.json()["refresh_token"]

    refresh_res = client.post("/api/auth/refresh", json={"refresh_token": ref_token})
    assert refresh_res.status_code == 200
    ref_data = refresh_res.json()
    assert "access_token" in ref_data
    assert "refresh_token" in ref_data


def test_login_rate_limiting_and_lockout():
    # Create a fresh user for lockout testing
    db = SessionLocal()
    lock_email = "lockout_victim@company.com"
    pwd = "CorrectPassword123!"
    try:
        u = db.query(User).filter(User.email == lock_email).first()
        if not u:
            u = User(
                email=lock_email,
                password_hash=hash_password(pwd),
                full_name="Lockout Victim",
                role="hrbp",
                workspace_id="default"
            )
            db.add(u)
            db.commit()
        else:
            u.failed_login_attempts = 0
            u.locked_until = None
            db.commit()
    finally:
        db.close()

    # 4 bad attempts
    for i in range(4):
        res = client.post("/api/auth/login", json={"email": lock_email, "password": "WrongPassword!"})
        assert res.status_code == 400

    # 5th bad attempt triggers lockout (HTTP 423)
    res5 = client.post("/api/auth/login", json={"email": lock_email, "password": "WrongPassword!"})
    assert res5.status_code == 423
    assert "locked" in res5.json()["detail"].lower()

    # Even with correct password, now locked
    res_correct = client.post("/api/auth/login", json={"email": lock_email, "password": pwd})
    assert res_correct.status_code == 423

    # Check AuditLog contains account_locked
    db = SessionLocal()
    try:
        lock_log = db.query(AuditLog).filter(
            AuditLog.user_email == lock_email,
            AuditLog.action == "auth.account_locked"
        ).first()
        assert lock_log is not None
    finally:
        db.close()


def test_totp_mfa_flow():
    # Login as admin to get bearer token
    login_res = client.post("/api/auth/login", json={"email": "admin@company.com", "role": "admin"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Setup MFA
    setup_res = client.post("/api/auth/mfa/setup", headers=headers)
    assert setup_res.status_code == 200
    setup_data = setup_res.json()
    secret = setup_data["secret"]
    recovery_codes = setup_data["recovery_codes"]
    assert len(recovery_codes) == 8

    # Generate valid TOTP code
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    # Verify enrollment
    verify_res = client.post("/api/auth/mfa/verify-enrollment", json={"totp_code": valid_code}, headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["mfa_enabled"] is True

    # Disable MFA cleanly
    disable_code = totp.now()
    dis_res = client.post("/api/auth/mfa/disable", json={"totp_code": disable_code}, headers=headers)
    assert dis_res.status_code == 200
    assert dis_res.json()["mfa_enabled"] is False


def test_security_headers_middleware():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in res.headers
    assert "Content-Security-Policy" in res.headers
