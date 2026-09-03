"""Environment helpers."""

ENVIRONMENTS = ("dev", "uat", "prod")


def is_valid_environment(name: str) -> bool:
    return name.lower() in ENVIRONMENTS
