"""Microsoft Teams integration — webhook relay (no direct monitoring)."""

from database.platform_repository import create_pending_action
from models.agent_run import utc_now


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
        return {
            "sent": True,
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


def get_teams_notifier() -> TeamsNotifier:
    return TeamsNotifier()
