"""Background scheduler for daily adaptive learning."""

import asyncio
import logging
from datetime import datetime, time, timezone

from database.platform_repository import generate_daily_recommendations
from services.skill_updater import update_skills_from_patterns

logger = logging.getLogger(__name__)

_scheduler_task: asyncio.Task | None = None


async def _daily_learning_loop() -> None:
    """Run skill updates and recommendations once per day at 23:00 UTC."""
    while True:
        now = datetime.now(timezone.utc)
        target = datetime.combine(now.date(), time(23, 0), tzinfo=timezone.utc)
        if now >= target:
            from datetime import timedelta

            target += timedelta(days=1)
        wait_seconds = (target - now).total_seconds()
        logger.info("Next daily learning run in %.0f seconds", wait_seconds)
        await asyncio.sleep(wait_seconds)
        try:
            skills = update_skills_from_patterns()
            recs = generate_daily_recommendations()
            logger.info("Daily learning complete: %d skills, %d recommendations", len(skills), len(recs))
        except Exception as exc:
            logger.error("Daily learning failed: %s", exc)


def start_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task is None:
        _scheduler_task = asyncio.create_task(_daily_learning_loop())


def stop_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task:
        _scheduler_task.cancel()
        _scheduler_task = None
