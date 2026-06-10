#!/usr/bin/env python3
"""Parse corporate markdown into a structured slide outline (JSON).

Heading hierarchy:
  # Title      → deck title (cover slide)
  ## Section   → section divider slide
  ### Slide    → content slide
  Bullets      → body placeholder bullets
  > blockquote → callout/quote slide type
  ![alt](path) → image slide type
  | table |    → signals two-column data layout

Usage:
  python scripts/md_to_outline.py doc.md
  python scripts/md_to_outline.py doc.md --pretty
"""
import json
import re
import sys
from pathlib import Path


def _strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        _, sep, rest = text[3:].partition("\n---")
        if sep:
            return rest.lstrip("\n")
    return text


def parse_markdown(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    text = _strip_frontmatter(text)

    outline: dict = {"title": "", "subtitle": "", "sections": []}
    current_section: dict | None = None
    current_slide: dict | None = None
    current_bullets: list[str] = []
    in_table = False

    def flush_slide():
        nonlocal current_slide, current_bullets
        if current_section is not None and current_slide is not None:
            current_slide["bullets"] = current_bullets[:]
            current_section["slides"].append(current_slide)
        current_slide = None
        current_bullets = []

    def flush_section():
        flush_slide()

    for line in text.splitlines():
        stripped = line.strip()

        # H1 → deck title
        if re.match(r"^# (?!#)", stripped):
            outline["title"] = stripped[2:].strip()
            continue

        # H2 → section divider
        if re.match(r"^## (?!#)", stripped):
            flush_section()
            current_section = {"title": stripped[3:].strip(), "slides": []}
            outline["sections"].append(current_section)
            in_table = False
            continue

        # H3 → content slide
        if re.match(r"^### (?!#)", stripped):
            flush_slide()
            if current_section is None:
                current_section = {"title": "", "slides": []}
                outline["sections"].append(current_section)
            current_slide = {
                "title": stripped[4:].strip(),
                "type": "content",
                "bullets": [],
                "image": None,
                "table": False,
            }
            in_table = False
            continue

        # Image → mark slide as image type
        img_match = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)", stripped)
        if img_match and current_slide is not None:
            current_slide["type"] = "image"
            current_slide["image"] = {
                "alt": img_match.group(1),
                "path": img_match.group(2),
            }
            continue

        # Blockquote → callout
        if stripped.startswith("> ") and current_slide is not None:
            current_slide["type"] = "callout"
            current_bullets.append(stripped[2:].strip())
            continue

        # Table row → flag as data layout
        if stripped.startswith("|") and current_slide is not None:
            if not in_table:
                current_slide["type"] = "data"
                current_slide["table"] = True
                in_table = True
            continue

        # Separator row (---|---) — skip
        if re.match(r"^\|?[\s\-|:]+\|?$", stripped) and in_table:
            continue

        in_table = False

        # Bullets (-, *, +, or 1.)
        bullet_match = re.match(r"^[-*+]\s+(.+)$", stripped) or re.match(
            r"^\d+\.\s+(.+)$", stripped
        )
        if bullet_match and current_slide is not None:
            current_bullets.append(bullet_match.group(1).strip())
            continue

        # H4+ as sub-bullets
        if re.match(r"^#{4,}\s", stripped) and current_slide is not None:
            sub = re.sub(r"^#{4,}\s+", "", stripped)
            current_bullets.append(f"  {sub}")
            continue

    # Flush final slide
    flush_section()

    return outline


def main():
    if len(sys.argv) < 2:
        print("Usage: md_to_outline.py <input.md> [--pretty]", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    pretty = "--pretty" in sys.argv

    outline = parse_markdown(path)

    if pretty:
        # Human-readable summary
        print(f"DECK: {outline['title']}")
        for sec in outline["sections"]:
            label = sec["title"] or "(no section)"
            print(f"\n  SECTION: {label}")
            for slide in sec["slides"]:
                print(f"    [{slide['type']:8}] {slide['title']}")
                for b in slide["bullets"]:
                    print(f"               • {b}")
    else:
        print(json.dumps(outline, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
