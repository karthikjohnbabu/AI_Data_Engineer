"""Git integration — mock PR client (swap for GitHub/Bitbucket later)."""

from models.agent_run import utc_now


class MockGitClient:
  """Simulates PR creation. Replace with GitHubClient or BitbucketClient."""

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

  settings = get_settings()
  if settings.git_provider == "github":
    raise NotImplementedError("GitHub client not configured. Set GIT_PROVIDER=mock or provide GITHUB_TOKEN.")
  return MockGitClient()
