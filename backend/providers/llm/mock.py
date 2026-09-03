class MockLLMProvider:
    def complete(self, prompt: str, **kwargs) -> str:
        return f"[mock-llm] {prompt[:200]}"
