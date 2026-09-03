"""Approval policies — which actions require engineers."""

ALWAYS_REQUIRE = {"prod_deploy", "merge_main", "rollback_prod"}
HIGH_RISK_REQUIRE = {"uat_deploy", "review_fix"}


def requires_human(action: str, severity: str = "Medium") -> bool:
    if action in ALWAYS_REQUIRE:
        return True
    if action in HIGH_RISK_REQUIRE and severity in {"Critical", "High"}:
        return True
    return False
