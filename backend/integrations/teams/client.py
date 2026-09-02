"""Microsoft Teams integration — webhook relay (no direct monitoring)."""

import logging

import httpx

from database.platform_repository import create_pending_action
from integrations.credentials_resolver import get_service_credentials
from models.agent_run import utc_now

logger = logging.getLogger(__name__)


class TeamsNotifier:
    """
    Teams integration via incoming webhook / Power Automate relay.
    Avoids direct manager-monitoring APIs — posts to a channel webhook only.
    """

    def send_adaptive_card(self, title: str, message: str, ticket_id: str | None = None) -> dict:
        pending = create_pending_action(
            source="teams",
            action="approve_action",
            message=f"[Teams] {title}: {message}",
            ticket_id=ticket_id,
        )
        delivered = self._post_card(title, message, pending["id"])
        return {
            "sent": True,
            "delivered": delivered,
            "mode": "webhook_relay",
            "integration": "power_automate_or_incoming_webhook",
            "pendingActionId": pending["id"],
            "message": "Adaptive card queued via webhook relay. User must approve before execution.",
            "timestamp": utc_now(),
            "note": "Direct Teams bot API avoided due to manager monitoring restrictions.",
        }

    def request_approval(self, ticket_id: str, action: str) -> dict:
        return self.send_adaptive_card(
            "Approval Required",
            f"Agent wants to '{action}' on ticket {ticket_id}. Approve?",
            ticket_id,
        )

    def _post_card(self, title: str, message: str, action_id: str) -> bool:
        creds = get_service_credentials("teams")
        url = creds.get("powerAutomateUrl") or creds.get("webhookUrl")
        if not url:
            return False
        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": title,
            "themeColor": "0076D7",
            "title": title,
            "text": message,
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "Review in Dashboard",
                    "targets": [{"os": "default", "uri": f"http://localhost:3000/?action={action_id}"}],
                }
            ],
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(url, json=payload)
                return response.is_success
        except Exception as exc:
            logger.warning("Teams webhook failed: %s", exc)
            return False


def get_teams_notifier() -> TeamsNotifier:
    return TeamsNotifier()

