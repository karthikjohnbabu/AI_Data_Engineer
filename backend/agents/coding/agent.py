"""Coding agent facade."""

from agents.coding.code_generator import generate_fix
from agents.coding.code_modifier import apply_code_modifications
from agents.coding.config_modifier import apply_config_changes


def run_coding(classification_id: str, impacted_files: list) -> dict:
    changes = generate_fix(classification_id, impacted_files)
    changes = apply_code_modifications(changes)
    configs = apply_config_changes(classification_id)
    return {"codeChanges": changes, "configChanges": configs}
