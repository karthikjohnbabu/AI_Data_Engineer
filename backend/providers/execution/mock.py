class MockExecutionProvider:
    def run(self, job: dict) -> dict:
        if "tenant_id" not in job:
            raise ValueError("tenant_id required on execution jobs")
        return {"status": "completed", "job": job}
