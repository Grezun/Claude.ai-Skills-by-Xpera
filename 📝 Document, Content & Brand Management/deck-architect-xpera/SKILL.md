---
name: deck-architect
description: Use when asked to make a presentation outline, create slides from documentation, convert a corporate doc into a deck, or produce a branded .pptx from markdown. Triggers on "make slides from this," "create a presentation," "turn this into a deck," or when markdown source + a brand template are both present.
---

# Deck Architect

Convert corporate markdown documentation into genuine branded `.pptx` slide bundles via a Python pipeline that preserves master slide layouts and brand color palettes.

**REQUIRED:** Also load `document-skills:pptx` — this skill adds the markdown-to-deck layer on top of that toolkit.

## Quick Reference

| Task | Command |
|------|---------|
| Parse markdown → outline | `python scripts/md_to_outline.py doc.md` |
| Inspect brand palette + layouts | `python scripts/extract_palette.py template.pptx` |
| Build full deck | `python scripts/build_deck.py doc.md template.pptx output.pptx` |
| Visual QA | See `document-skills:pptx` → QA section |

## Workflow

### 1. Analyze Inputs

```bash
python scripts/md_to_outline.py doc.md          # preview slide structure
python scripts/extract_palette.py template.pptx  # palette + layout names
python scripts/thumbnail.py template.pptx        # visual layout grid
```

Review the outline JSON — every `##` becomes a section divider, every `###` a content slide. Adjust the markdown if the structure is wrong **before** building.

### 2. Map Layouts

`extract_palette.py` prints numbered layout names from the master. Note which indices correspond to:

| Slide type | Layout to use |
|------------|---------------|
| Cover | `Title Slide` or index 0 |
| Section divider | `Section Header` |
| Standard content | `Title and Content` |
| Comparison / two columns | `Two Content` |
| Pull quote / callout | any quote/blank layout |
| Image-dominant | `Picture with Caption` or `Blank` |

If the template lacks a needed layout, use the closest available and document the mismatch.

### 3. Build the Deck

```bash
python scripts/build_deck.py doc.md template.pptx output.pptx
```

The script:
1. **Parses** markdown → structured outline (via `md_to_outline.py`)
2. **Opens** the template — inherits master, theme, and color palette
3. **Clears** template placeholder slides
4. **Adds** slides in outline order, each linked to its layout
5. **Fills** title and body placeholders from outline content
6. **Saves** the bundle

Palette colors are inherited automatically from the theme — never hardcode hex values.

### 4. QA

Run the full QA loop from `document-skills:pptx`:
- Content QA: `python -m markitdown output.pptx`
- Visual QA: convert to images with `soffice` + `pdftoppm`, inspect with a subagent

## Markdown Input Format

See [references/markdown-schema.md](references/markdown-schema.md) for the full spec.

**Heading hierarchy:**

| Heading | Becomes |
|---------|---------|
| `# Title` | Deck title (cover slide) |
| `## Section` | Section divider slide |
| `### Slide Title` | Content slide |
| Bullets under `###` | Body placeholder |
| `> blockquote` | Callout / quote slide |
| `![alt](path)` | Image slide |
| Markdown table | Two-column data slide |

## Common Mistakes

- **Using pptxgenjs instead of Python** — pptxgenjs creates slides from scratch and breaks master layout XML references. This skill uses `python-pptx` to preserve them.
- **Hardcoding hex colors** — always pull from the template theme via `extract_palette.py`; never override with literal hex strings.
- **Skipping `md_to_outline.py`** — building directly from a markdown read produces flat, unstructured slides. Always preview the outline first.
- **Not clearing template slides** — `build_deck.py` clears placeholder slides automatically; if calling python-pptx manually, remove `<p:sldId>` entries before adding new slides.
- **Assuming layout index is stable** — layout order varies by template. Always use `extract_palette.py` to confirm index-to-name mapping before hard-coding.
- **Ignoring layout count** — if the template has 5 layouts and you reference index 8, python-pptx raises `IndexError`. Map layout by name, not number.

## Dependencies

```bash
pip install python-pptx "markitdown[pptx]" Pillow
```

LibreOffice (`soffice`) and Poppler (`pdftoppm`) for visual QA — see `document-skills:pptx`.
