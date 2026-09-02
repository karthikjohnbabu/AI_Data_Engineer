"""Slack integration — human-in-the-loop notifications."""

from database.platform_repository import create_pending_action
from models.agent_run import utc_now


class SlackNotifier:
    """Slack bot integration. Reads tagged messages and requests permission before acting."""

    def notify_task(self, ticket_id: str, message: str, action: str = "run_agent") -> dict:
        pending = create_pending_action(
            source="slack",
            action=action,
            message=f"[Slack] {message}",
            ticket_id=ticket_id,
        )
        return {
            "sent": True,
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


def get_slack_notifier() -> SlackNotifier:
    return SlackNotifier()
