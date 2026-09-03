"""Notification service facade."""

from notifications.routing import route
from notifications.service import notify


def send(event: str, message: str, payload: dict | None = None) -> list[dict]:
    return [notify(channel, message, payload) for channel in route(event)]
