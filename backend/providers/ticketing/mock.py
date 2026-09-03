class MockTicketProvider:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    def get_ticket(self, ticket_id: str) -> dict:
        return {"tenant_id": self.tenant_id, "id": ticket_id, "summary": "mock"}

    def update_ticket(self, ticket_id: str, fields: dict) -> dict:
        return {"tenant_id": self.tenant_id, "id": ticket_id, "updated": fields}

    def add_comment(self, ticket_id: str, comment: str) -> dict:
        return {"tenant_id": self.tenant_id, "id": ticket_id, "comment": comment}
