"""Git integration — mock or real PR client."""

from models.agent_run import utc_now


class MockGitClient:
    def create_pull_request(
        self,
        ticket_id: str,
        title: str,
        branch: str,
        files_changed: list[str],
    ) -> dict:
        pr_number = hash(ticket_id) % 900 + 100
        return {
            "number": pr_number,
            "url": f"https://github.com/org/uk-data-platform/pull/{pr_number}",
            "title": title,
            "branch": branch,
            "status": "open",
            "createdAt": utc_now(),
            "filesChanged": files_changed,
        }


def get_git_client():
    from config.settings import get_settings
    from integrations.bitbucket.client import build_bitbucket_client
    from integrations.credentials_resolver import credentials_configured
    from integrations.github.github_client import build_github_client

    settings = get_settings()

    if settings.git_provider == "bitbucket" or credentials_configured("bitbucket"):
        try:
            return build_bitbucket_client()
        except ValueError:
            if settings.git_provider == "bitbucket":
                raise

    if settings.git_provider == "github" or credentials_configured("github"):
        try:
            return build_github_client()
        except ValueError:
            if settings.git_provider == "github":
                raise

    return MockGitClient()
