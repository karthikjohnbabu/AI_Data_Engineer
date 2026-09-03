"""Anthropic Claude provider stub."""


def complete(prompt: str, **kwargs) -> str:
    return f"[anthropic-stub] {prompt[:120]}"
