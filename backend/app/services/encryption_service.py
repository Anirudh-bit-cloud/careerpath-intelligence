"""
Field-Level Encryption Service for sensitive configuration values.

Uses AES-256-GCM symmetric encryption with a key derived from an environment variable.
All secrets (OIDC client secrets, HRIS API keys) are encrypted before database storage.

Key rotation: set ENCRYPTION_KEY_NEW=<new_key> alongside ENCRYPTION_KEY=<old_key>,
then run: python -m backend.app.services.encryption_service rotate
which re-encrypts all encrypted columns and promotes the new key.

Environment variables:
  ENCRYPTION_KEY: base64-encoded 32-byte AES key (required in production)
  ENCRYPTION_KEY_NEW: set during rotation (optional)
"""

import os
import base64
import hashlib
import json
import secrets
from typing import Optional

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False


_SENTINEL = "ENC:"  # prefix to identify encrypted values in DB


def _get_key(env_var: str = "ENCRYPTION_KEY") -> bytes:
    """
    Derives a 32-byte AES key from the ENCRYPTION_KEY env var.
    Falls back to a deterministic dev key if not set (logged as a warning).
    """
    raw = os.environ.get(env_var, "")
    if raw:
        try:
            key_bytes = base64.b64decode(raw)
            if len(key_bytes) == 32:
                return key_bytes
        except Exception:
            pass
        # If not valid base64 32-byte key, derive from it
        return hashlib.sha256(raw.encode()).digest()
    else:
        # Dev fallback — NOT secure for production
        import warnings
        warnings.warn(
            "ENCRYPTION_KEY not set; using insecure dev key. "
            "Set ENCRYPTION_KEY=<base64-32-bytes> in production.",
            RuntimeWarning
        )
        return hashlib.sha256(b"careerpath_dev_encryption_key_v3").digest()


def encrypt(plaintext: str) -> str:
    """
    Encrypts a plaintext string using AES-256-GCM.
    Returns a string in the format: ENC:<base64(nonce + ciphertext_with_tag)>
    """
    if not plaintext:
        return plaintext
    if not _HAS_CRYPTO:
        # Fallback: base64 obfuscation (not encryption) — clearly marked
        encoded = base64.b64encode(plaintext.encode()).decode()
        return f"ENC_B64:{encoded}"

    key = _get_key()
    nonce = secrets.token_bytes(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    payload = base64.b64encode(nonce + ct).decode()
    return f"{_SENTINEL}{payload}"


def decrypt(ciphertext: str) -> str:
    """
    Decrypts an AES-256-GCM encrypted string produced by encrypt().
    Returns the original plaintext. Raises ValueError on tamper/key mismatch.
    """
    if not ciphertext:
        return ciphertext

    # Handle base64 obfuscation fallback (no crypto library)
    if ciphertext.startswith("ENC_B64:"):
        encoded = ciphertext[len("ENC_B64:"):]
        return base64.b64decode(encoded).decode()

    if not ciphertext.startswith(_SENTINEL):
        # Not encrypted — return as-is (handles unencrypted legacy values)
        return ciphertext

    if not _HAS_CRYPTO:
        raise ValueError("cryptography library not installed; cannot decrypt.")

    payload = base64.b64decode(ciphertext[len(_SENTINEL):])
    nonce = payload[:12]
    ct = payload[12:]
    key = _get_key()
    aesgcm = AESGCM(key)
    try:
        plaintext = aesgcm.decrypt(nonce, ct, None)
        return plaintext.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Decryption failed — key mismatch or tampered ciphertext: {e}") from e


def encrypt_json(data: dict) -> str:
    """Serializes dict to JSON and encrypts it."""
    return encrypt(json.dumps(data))


def decrypt_json(ciphertext: str) -> dict:
    """Decrypts and deserializes a JSON-encrypted dict."""
    if not ciphertext:
        return {}
    return json.loads(decrypt(ciphertext))


def generate_new_key() -> str:
    """Generates a new cryptographically secure 32-byte AES key, base64-encoded."""
    return base64.b64encode(secrets.token_bytes(32)).decode()


def hash_token(token: str) -> str:
    """SHA-256 hash of a bearer token for SCIM token storage."""
    return hashlib.sha256(token.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Key Rotation CLI
# ---------------------------------------------------------------------------

def rotate_encryption_key():
    """
    Re-encrypts all encrypted database columns using ENCRYPTION_KEY_NEW.
    Promotes ENCRYPTION_KEY_NEW to ENCRYPTION_KEY after re-encryption.

    Usage:
      ENCRYPTION_KEY=<old> ENCRYPTION_KEY_NEW=<new> python -m backend.app.services.encryption_service rotate
    """
    new_key_raw = os.environ.get("ENCRYPTION_KEY_NEW", "")
    if not new_key_raw:
        print("ERROR: ENCRYPTION_KEY_NEW must be set to perform key rotation.")
        return

    from backend.app.database.connection import SessionLocal
    from backend.app.models.entities import OIDCConfig, HRISConnectorConfig

    db = SessionLocal()
    try:
        rotated = 0

        # Rotate OIDC client secrets
        for config in db.query(OIDCConfig).all():
            if config.client_secret_enc:
                try:
                    plaintext = decrypt(config.client_secret_enc)
                    # Re-encrypt with new key
                    old_key_env = os.environ.get("ENCRYPTION_KEY", "")
                    os.environ["ENCRYPTION_KEY"] = new_key_raw
                    config.client_secret_enc = encrypt(plaintext)
                    os.environ["ENCRYPTION_KEY"] = old_key_env
                    rotated += 1
                except Exception as e:
                    print(f"  WARNING: Failed to rotate OIDCConfig id={config.id}: {e}")

        # Rotate HRIS connector secrets
        for config in db.query(HRISConnectorConfig).all():
            if config.config_enc:
                try:
                    plaintext = decrypt(config.config_enc)
                    old_key_env = os.environ.get("ENCRYPTION_KEY", "")
                    os.environ["ENCRYPTION_KEY"] = new_key_raw
                    config.config_enc = encrypt(plaintext)
                    os.environ["ENCRYPTION_KEY"] = old_key_env
                    rotated += 1
                except Exception as e:
                    print(f"  WARNING: Failed to rotate HRISConnectorConfig id={config.id}: {e}")

        db.commit()
        print(f"Key rotation complete: {rotated} secrets re-encrypted.")
        print(f"Now set ENCRYPTION_KEY={new_key_raw} and remove ENCRYPTION_KEY_NEW.")
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "rotate":
        rotate_encryption_key()
    elif len(sys.argv) > 1 and sys.argv[1] == "generate":
        key = generate_new_key()
        print(f"New encryption key (base64-encoded 32 bytes):\n{key}")
        print("\nSet this as: ENCRYPTION_KEY=" + key)
    else:
        print("Usage: python -m backend.app.services.encryption_service [rotate|generate]")
