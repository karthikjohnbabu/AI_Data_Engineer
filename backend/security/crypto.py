"""Encrypt sensitive credential fields at rest."""

import base64
import hashlib
import json
import logging
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = frozenset({
    "secretAccessKey",
    "apiToken",
    "appPassword",
    "botToken",
    "webhookUrl",
    "powerAutomateUrl",
    "password",
    "githubToken",
})


@lru_cache
def _get_fernet() -> Fernet | None:
    from config.settings import get_settings

    secret = get_settings().credentials_secret_key
    if not secret:
        return None
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
    return Fernet(key)


def _encrypt_value(value: str) -> str:
    fernet = _get_fernet()
    if not fernet or not value:
        return value
    token = fernet.encrypt(value.encode()).decode()
    return f"enc:{token}"


def _decrypt_value(value: str) -> str:
    if not value or not value.startswith("enc:"):
        return value
    fernet = _get_fernet()
    if not fernet:
        logger.warning("Encrypted credential found but CREDENTIALS_SECRET_KEY is not set")
        return value
    try:
        return fernet.decrypt(value[4:].encode()).decode()
    except InvalidToken:
        logger.error("Failed to decrypt credential field")
        return value


def encrypt_credential_data(data: dict) -> dict:
    encrypted = {}
    for key, value in data.items():
        if key in SENSITIVE_KEYS and isinstance(value, str) and value and not value.startswith("enc:"):
            encrypted[key] = _encrypt_value(value)
        else:
            encrypted[key] = value
    return encrypted


def decrypt_credential_data(data: dict) -> dict:
    return {key: _decrypt_value(value) if isinstance(value, str) else value for key, value in data.items()}


def credentials_encrypted_at_rest() -> bool:
    return _get_fernet() is not None
