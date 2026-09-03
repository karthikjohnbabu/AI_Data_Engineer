"""Notification service — Slack / Teams / in-app."""


def notify(channel: str, message: str, payload: dict | None = None) -> dict:
    return {"channel": channel, "message": message, "payload": payload or {}, "status": "queued"}
