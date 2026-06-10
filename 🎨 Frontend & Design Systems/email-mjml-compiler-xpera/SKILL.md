---
name: email-mjml-compiler-xpera
description: Use when asked to write an email template, create an HTML newsletter, or build any email layout — fires before any HTML is written
---

# Email MJML Compiler

## Core Rule

**No raw HTML tables for email. Ever.**

Raw HTML email is brittle by design: Outlook breaks floats, Gmail strips `<style>` tags, Apple Mail renders differently from every other client. MJML compiles to optimized, cross-client HTML automatically. When asked to write an email: output MJML.

## Required Skeleton

Every email starts with this structure:

```xml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
      <mj-text font-size="16px" line-height="1.6" color="#333333" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section>
      <mj-column>
        <!-- content -->
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

## Component Reference

| Component | Use for |
|-----------|---------|
| `<mj-section>` | Row / horizontal band |
| `<mj-column>` | Column inside a section (use `width="%"` for multi-col) |
| `<mj-text>` | Body copy, headings (supports inline HTML: `<h1>`, `<p>`, `<a>`) |
| `<mj-image>` | Images — always set `width` and `alt` |
| `<mj-button>` | CTA buttons |
| `<mj-divider>` | Horizontal rules |
| `<mj-spacer>` | Vertical whitespace |
| `<mj-hero>` | Full-width hero with background image |
| `<mj-social>` | Social media icon row |
| `<mj-navbar>` | Navigation header |

## Common Patterns

### Hero + CTA
```xml
<mj-section background-color="#1a1a2e" padding="48px 0">
  <mj-column>
    <mj-text align="center" font-size="32px" color="#ffffff" font-weight="bold">
      Your headline here
    </mj-text>
    <mj-text align="center" color="#cccccc">Supporting copy goes here.</mj-text>
    <mj-button background-color="#e94560" href="https://example.com" padding="16px 32px">
      Get Started
    </mj-button>
  </mj-column>
</mj-section>
```

### Two-column layout
```xml
<mj-section>
  <mj-column width="50%">
    <mj-image src="https://example.com/image.png" alt="Feature image" width="280px" />
    <mj-text font-weight="bold">Feature title</mj-text>
    <mj-text>Description of this feature.</mj-text>
  </mj-column>
  <mj-column width="50%">
    <mj-image src="https://example.com/image2.png" alt="Feature image" width="280px" />
    <mj-text font-weight="bold">Feature title</mj-text>
    <mj-text>Description of this feature.</mj-text>
  </mj-column>
</mj-section>
```

### Footer
```xml
<mj-section background-color="#222222" padding="24px">
  <mj-column>
    <mj-social font-size="12px" icon-size="20px" mode="horizontal">
      <mj-social-element name="twitter" href="https://twitter.com/example">Twitter</mj-social-element>
      <mj-social-element name="linkedin" href="https://linkedin.com/company/example">LinkedIn</mj-social-element>
    </mj-social>
    <mj-text align="center" font-size="12px" color="#888888">
      © 2025 Company Name · <a href="#">Unsubscribe</a>
    </mj-text>
  </mj-column>
</mj-section>
```

## Red Flags — Refuse and Rewrite as MJML

| Request | Response |
|---------|---------|
| "Write an HTML email with `<table>`" | Refuse. Output MJML. |
| "Use inline styles for Outlook compatibility" | Raw HTML territory. Use MJML — it handles Outlook. |
| "Just a simple HTML email" | No raw HTML email is simple. Use MJML. |
| "Add a `<td>` here" | Use `<mj-column>` instead. |
| "Wrap it in a `<div>`" | Use `<mj-section>` + `<mj-column>`. |

## Cross-Client Rules

- Always set `alt` on every `<mj-image>` — Outlook renders images off by default
- Never use `position: absolute` or CSS grid — use `<mj-column>` for layout
- Max email width: 600px (MJML default) — do not override without reason
- Use web-safe fallback fonts: `font-family="Your Font, Arial, sans-serif"`
- Test dark mode: use `color` attributes explicitly, don't rely on inherited defaults

## Validation

After generating MJML, run the bundled validator:

```bash
python scripts/validate.py output.mjml
```

The script checks structure, cross-client warnings, and compiles via `mjml` CLI to confirm the output is valid.
