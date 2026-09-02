"""Slack integration — human-in-the-loop notifications."""

import logging

import httpx

from database.platform_repository import create_pending_action
from integrations.credentials_resolver import get_service_credentials
from models.agent_run import utc_now

logger = logging.getLogger(__name__)


class SlackNotifier:
    """Slack bot integration. Reads tagged messages and requests permission before acting."""

    def notify_task(self, ticket_id: str, message: str, action: str = "run_agent") -> dict:
        pending = create_pending_action(
            source="slack",
            action=action,
            message=f"[Slack] {message}",
            ticket_id=ticket_id,
        )
        delivered = self._post_message(f"*{ticket_id}*: {message}\n_Awaiting approval in dashboard._")
        return {
            "sent": True,
            "delivered": delivered,
            "mode": "human_in_the_loop",
            "pendingActionId": pending["id"],
            "message": "Notification queued. Awaiting user approval before executing.",
            "timestamp": utc_now(),
        }

    def handle_tag(self, user: str, message: str, ticket_id: str | None = None) -> dict:
        return self.notify_task(
            ticket_id or "unknown",
            f"@{user} tagged you: {message}",
            action="execute_tagged_task",
        )

    def _post_message(self, text: str) -> bool:
        creds = get_service_credentials("slack")
        webhook = creds.get("webhookUrl")
        if not webhook:
            return False
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(webhook, json={"text": text})
                return response.is_success
        except Exception as exc:
            logger.warning("Slack webhook failed: %s", exc)
            return False


def get_slack_notifier() -> SlackNotifier:
    return SlackNotifier()

