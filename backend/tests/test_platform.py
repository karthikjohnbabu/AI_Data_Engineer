"""Tests for credential encryption."""

import os

from security.crypto import decrypt_credential_data, encrypt_credential_data


def test_encrypt_decrypt_roundtrip(monkeypatch):
    monkeypatch.setenv("CREDENTIALS_SECRET_KEY", "test-secret-key-for-encryption")
    from config.settings import get_settings

    get_settings.cache_clear()

    data = {"apiToken": "super-secret-token", "email": "user@example.com"}
    encrypted = encrypt_credential_data(data)
    assert encrypted["apiToken"].startswith("enc:")
    assert encrypted["email"] == "user@example.com"

    decrypted = decrypt_credential_data(encrypted)
    assert decrypted["apiToken"] == "super-secret-token"


def test_nl_phase_parser():
    from database.platform_repository import _parse_nl_phases

    text = """Phase 1: Triage
- Classify ticket
- Check memory

Phase 2: Fix
- Generate code"""
    phases = _parse_nl_phases(text)
    assert len(phases) == 2
    assert phases[0]["name"] == "Phase 1: Triage"
    assert "Classify ticket" in phases[0]["tasks"]
