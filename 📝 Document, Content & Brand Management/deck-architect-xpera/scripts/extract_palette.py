#!/usr/bin/env python3
"""Extract brand color palette and layout names from a .pptx template.

Reads the slide master's theme XML to pull the 10 standard color slots
(dk1, lt1, dk2, lt2, accent1–6) without opening the file in PowerPoint.

Usage:
  python scripts/extract_palette.py template.pptx
  python scripts/extract_palette.py template.pptx --json
"""
import json
import sys
from pathlib import Path

try:
    from pptx import Presentation
    from pptx.opc.constants import RELATIONSHIP_TYPE as RT
except ImportError:
    print("ERROR: python-pptx not installed. Run: pip install python-pptx", file=sys.stderr)
    sys.exit(1)

# Standard OOXML theme color slot names in display order
COLOR_SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6"]

DML_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"


def _hex_from_element(el) -> str | None:
    """Return 6-char uppercase hex from an <a:srgbClr> or <a:sysClr> child."""
    if el is None:
        return None
    srgb = el.find(f"{{{DML_NS}}}srgbClr")
    if srgb is not None:
        return srgb.get("val", "").upper() or None
    sys_clr = el.find(f"{{{DML_NS}}}sysClr")
    if sys_clr is not None:
        return sys_clr.get("lastClr", "").upper() or None
    return None


def extract_palette(pptx_path: str) -> dict:
    prs = Presentation(pptx_path)
    master = prs.slide_master

    # Resolve the theme relationship from the slide master part
    theme_part = None
    for rel in master.part.rels.values():
        if "theme" in rel.reltype:
            theme_part = rel._target
            break

    colors: dict[str, str | None] = {}
    if theme_part is not None:
        clr_scheme = theme_part._element.find(f".//{{{DML_NS}}}clrScheme")
        if clr_scheme is not None:
            for slot in COLOR_SLOTS:
                el = clr_scheme.find(f"{{{DML_NS}}}{slot}")
                colors[slot] = _hex_from_element(el)

    layouts = [{"index": i, "name": layout.name} for i, layout in enumerate(master.slide_layouts)]

    return {"colors": colors, "layouts": layouts}


def _swatch(hex_val: str | None) -> str:
    """Simple ANSI color block for terminal display (falls back gracefully)."""
    if not hex_val:
        return "  ???  "
    return f"#{hex_val}"


def main():
    if len(sys.argv) < 2:
        print("Usage: extract_palette.py <template.pptx> [--json]", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    as_json = "--json" in sys.argv

    result = extract_palette(path)

    if as_json:
        print(json.dumps(result, indent=2))
        return

    print(f"\nBrand palette from: {Path(path).name}")
    print("─" * 40)
    for slot, hex_val in result["colors"].items():
        display = _swatch(hex_val)
        print(f"  {slot:<8}  {display}")

    print(f"\nSlide layouts ({len(result['layouts'])}):")
    print("─" * 40)
    for layout in result["layouts"]:
        print(f"  [{layout['index']:2}]  {layout['name']}")

    print()


if __name__ == "__main__":
    main()
