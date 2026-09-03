"""DB session helper."""

from database.db import get_connection


def session():
    return get_connection()
