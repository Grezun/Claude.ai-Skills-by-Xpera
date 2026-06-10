#!/usr/bin/env python3
"""Validate MJML email templates for structure and cross-client compatibility."""

import sys
import subprocess
from pathlib import Path
from xml.etree import ElementTree as ET

# Tags that require specific attributes for cross-client safety
REQUIRED_ATTRS = [
    ("mj-image", "alt", "Missing alt= on <mj-image> — Outlook shows broken image icon without it"),
    ("mj-image", "width", "Missing width= on <mj-image> — causes layout collapse in some clients"),
    ("mj-button", "href", "Missing href= on <mj-button> — renders as dead element in Outlook"),
]

# Raw HTML patterns that indicate someone bypassed MJML
RAW_HTML_PATTERNS = ["<table", "<td", "<tr", "<div style=", "<font "]


def validate_structure(tree: ET.ElementTree) -> list[str]:
    errors = []
    root = tree.getroot()

    if root.tag != "mjml":
        errors.append("ERROR: Root element must be <mjml>")
        return errors

    child_tags = {child.tag for child in root}
    for required in ("mj-head", "mj-body"):
        if required not in child_tags:
            errors.append(f"ERROR: Missing required <{required}> inside <mjml>")

    return errors


def check_cross_client(tree: ET.ElementTree) -> list[str]:
    warnings = []
    for tag, attr, message in REQUIRED_ATTRS:
        for el in tree.iter(tag):
            if not el.get(attr):
                warnings.append(f"WARN: {message}")
    return warnings


def check_raw_html(path: Path) -> list[str]:
    warnings = []
    source = path.read_text()
    for pattern in RAW_HTML_PATTERNS:
        if pattern in source:
            warnings.append(f"WARN: Raw HTML pattern '{pattern}' found — use MJML components instead")
    return warnings


def compile_mjml(path: Path) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            ["npx", "--yes", "mjml", str(path), "--output", "/dev/null",
             "--config.validationLevel", "strict"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return result.returncode == 0, (result.stdout + result.stderr).strip()
    except FileNotFoundError:
        return None, "mjml CLI not found — install with: npm install -g mjml"
    except subprocess.TimeoutExpired:
        return None, "mjml CLI timed out"


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: validate.py <file.mjml>")
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"ERROR: File not found: {path}")
        sys.exit(1)

    print(f"Validating {path.name}...\n")
    all_issues: list[str] = []

    # XML parse
    try:
        tree = ET.parse(path)
    except ET.ParseError as e:
        print(f"ERROR: Invalid XML — {e}")
        sys.exit(1)

    # Checks
    all_issues += validate_structure(tree)
    all_issues += check_cross_client(tree)
    all_issues += check_raw_html(path)

    for issue in all_issues:
        print(issue)

    # Compile
    print("\nCompiling with mjml CLI...")
    success, output = compile_mjml(path)
    if success is None:
        print(f"SKIP: {output}")
    elif success:
        print("✓ Compiles successfully")
    else:
        print("✗ Compilation failed:")
        print(output)
        all_issues.append("ERROR: mjml compilation failed")

    # Summary
    errors = [i for i in all_issues if i.startswith("ERROR")]
    warnings = [i for i in all_issues if i.startswith("WARN")]
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
