"""Mock Git provider for local/dev."""


class MockGitProvider:
    def __init__(self, tenant_id: str, repository: str = ""):
        self.tenant_id = tenant_id
        self.repository = repository

    def create_branch(self, name: str, from_ref: str = "main") -> dict:
        return {"tenant_id": self.tenant_id, "branch": name, "from": from_ref, "status": "created"}

    def create_pull_request(self, title: str, source: str, target: str, body: str = "") -> dict:
        return {
            "tenant_id": self.tenant_id,
            "id": f"pr-{source}",
            "title": title,
            "source": source,
            "target": target,
            "status": "open",
        }

    def merge_pull_request(self, pr_id: str) -> dict:
        return {"tenant_id": self.tenant_id, "id": pr_id, "status": "merged"}

    def get_status(self, pr_id: str) -> dict:
        return {"tenant_id": self.tenant_id, "id": pr_id, "status": "open"}
