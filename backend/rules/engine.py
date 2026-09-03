"""Evaluate Newton rules against an action context."""

from rules.models import Rule, RuleAction


def evaluate_rules(rules: list[Rule], context: dict) -> RuleAction:
    """Return the strongest matching action (approval/block)."""
    matched = RuleAction()
    env = str(context.get("environment", "")).lower()
    operations = {str(o).lower() for o in context.get("operations", [])}

    for rule in rules:
        scope_env = str(rule.scope.get("environment", "")).lower()
        if scope_env and scope_env != env:
            continue
        needed = {str(o).lower() for o in rule.conditions.get("operations", [])}
        if needed and not (needed & operations):
            continue
        if rule.action.block:
            matched.block = True
        if rule.action.require_human_approval:
            matched.require_human_approval = True
        if rule.action.message:
            matched.message = rule.action.message
    return matched
