#!/usr/bin/env python3
"""
Deterministic PDF parser — outputs structured markdown.
Usage: python3 parse_pdf.py <path-to-pdf> [--pages N] [--pages N-M]

Requires: pip install pdfplumber pypdf
"""

import sys
import argparse
import re

try:
    import pdfplumber
except ImportError:
    sys.exit("ERROR: pdfplumber not installed. Run: pip install pdfplumber")

try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        PdfReader = None


def parse_page_range(spec: str, total_pages: int) -> list[int]:
    """Parse '3' or '2-5' into 0-based page indices."""
    spec = spec.strip()
    if "-" in spec:
        start, end = spec.split("-", 1)
        return list(range(int(start) - 1, min(int(end), total_pages)))
    return [int(spec) - 1]


def table_to_markdown(table: list[list]) -> str:
    """Convert pdfplumber table (list of rows) to markdown table."""
    if not table or not table[0]:
        return ""

    # Clean cells — pdfplumber returns None for empty cells
    def clean(cell):
        if cell is None:
            return ""
        return str(cell).replace("\n", " ").strip()

    rows = [[clean(c) for c in row] for row in table]
    col_count = max(len(row) for row in rows)

    # Pad short rows
    rows = [row + [""] * (col_count - len(row)) for row in rows]

    header = rows[0]
    separator = ["---"] * col_count
    body = rows[1:]

    lines = []
    lines.append("| " + " | ".join(header) + " |")
    lines.append("| " + " | ".join(separator) + " |")
    for row in body:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def extract_page(page, page_num: int) -> str:
    """Extract a single page to markdown, tables first then text."""
    output = [f"\n## Page {page_num}\n"]

    # Extract tables using geometric analysis (pdfplumber strength)
    tables = page.extract_tables()
    table_bboxes = []

    for i, table in enumerate(tables):
        md = table_to_markdown(table)
        if md:
            output.append(f"### Table {i + 1}\n")
            output.append(md)
            output.append("")

        # Track bounding boxes to exclude table text from body text
        table_settings = page.find_tables()
        for t in table_settings:
            table_bboxes.append(t.bbox)

    # Extract text outside tables
    if table_bboxes:
        # Crop away table regions and extract remaining text
        remaining = page
        text_parts = []
        # Use words outside table bounding boxes
        words = page.extract_words()
        for word in words:
            wx0, wy0, wx1, wy1 = word["x0"], word["top"], word["x1"], word["bottom"]
            in_table = any(
                bx0 <= wx0 and wy0 >= by0 and wx1 <= bx1 and wy1 <= by1
                for bx0, by0, bx1, by1 in table_bboxes
            )
            if not in_table:
                text_parts.append(word["text"])
        body_text = " ".join(text_parts).strip()
    else:
        body_text = page.extract_text() or ""

    # Clean up excessive whitespace while preserving paragraph breaks
    body_text = re.sub(r"[ \t]+", " ", body_text)
    body_text = re.sub(r"\n{3,}", "\n\n", body_text)

    if body_text.strip():
        output.append("### Text\n")
        output.append(body_text.strip())
        output.append("")

    return "\n".join(output)


def is_scanned_page(page) -> bool:
    """Heuristic: if a page has no extractable text but has images, it's likely scanned."""
    text = page.extract_text() or ""
    has_images = len(page.images) > 0
    return has_images and len(text.strip()) < 20


def main():
    parser = argparse.ArgumentParser(description="Deterministic PDF to markdown extractor")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument(
        "--pages",
        help="Page(s) to extract, e.g. '3' or '2-5'. Default: all pages.",
        default=None,
    )
    args = parser.parse_args()

    pdf_path = args.pdf_path

    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)

            # Determine which pages to process
            if args.pages:
                page_indices = parse_page_range(args.pages, total_pages)
            else:
                page_indices = list(range(total_pages))

            print(f"# PDF Extraction: {pdf_path}")
            print(f"Total pages: {total_pages} | Extracting: {len(page_indices)} page(s)\n")
            print("---\n")

            scanned_pages = []

            for idx in page_indices:
                if idx < 0 or idx >= total_pages:
                    print(f"⚠ Page {idx + 1} out of range — skipping.")
                    continue

                page = pdf.pages[idx]

                if is_scanned_page(page):
                    scanned_pages.append(idx + 1)
                    print(f"\n## Page {idx + 1}\n")
                    print(
                        f"⚠ **SCANNED IMAGE PAGE** — no selectable text detected. "
                        f"OCR required to read this page.\n"
                    )
                else:
                    print(extract_page(page, idx + 1))

            if scanned_pages:
                print("\n---")
                print(
                    f"\n⚠ **Scanned pages detected:** {scanned_pages}. "
                    "These pages contain images rather than selectable text and cannot be "
                    "extracted without OCR. Options: Adobe Acrobat OCR, Google Drive "
                    "(auto-OCR on upload), or share a screenshot for direct image reading."
                )

    except FileNotFoundError:
        sys.exit(f"ERROR: File not found: {pdf_path}")
    except Exception as e:
        sys.exit(f"ERROR: Failed to parse PDF: {e}")


if __name__ == "__main__":
    main()
