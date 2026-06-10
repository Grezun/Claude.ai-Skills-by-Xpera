---
name: wcag-accessibility-audit-xpera
description: Use when asked to check HTML, fix a form, review a component, or audit any UI for accessibility — acts as an automated WCAG 2.1 AA reviewer before reporting work complete
---

# WCAG Accessibility Audit

## Core Rule

Every UI must pass WCAG 2.1 AA before it ships. Run this audit on any HTML, JSX, or form component. Produce a structured report. Fix all ERRORs before marking work done.

**Target level:** WCAG 2.1 AA (legally required in most jurisdictions).

---

## The Five Audit Categories

Check each category in order. Report findings using the output format at the bottom.

---

### Category 1 — Semantic HTML

Use elements for their intended purpose. ARIA supplements semantics; it never replaces them.

| ❌ Non-semantic | ✅ Semantic replacement |
|----------------|------------------------|
| `<div onClick={…}>` | `<button type="button">` |
| `<div onClick={…}>` for nav link | `<a href="…">` |
| `<div class="list">` | `<ul>` / `<ol>` / `<dl>` |
| `<div class="heading">` | `<h1>`–`<h6>` (in logical order) |
| `<b>` / `<i>` for emphasis | `<strong>` / `<em>` |
| `<div class="nav">` | `<nav aria-label="…">` |
| `<div class="main">` | `<main>` |
| `<div class="header">` | `<header>` |
| `<div class="footer">` | `<footer>` |

**Heading hierarchy:** `<h1>` appears once per page. Each level increments by one — never skip from `<h2>` to `<h4>`.

---

### Category 2 — ARIA Attributes

**First rule of ARIA:** don't use ARIA if a native HTML element does the job.

**Required ARIA by pattern:**

| Pattern | Required attributes |
|---------|-------------------|
| Icon button (no visible text) | `aria-label="Action name"` |
| Toggle / expand button | `aria-expanded="true\|false"` |
| Modal / dialog | `role="dialog"` + `aria-modal="true"` + `aria-labelledby="title-id"` |
| Alert / error message | `role="alert"` or `aria-live="assertive"` |
| Status / notification | `aria-live="polite"` |
| Loading spinner | `role="status"` + `aria-label="Loading"` |
| Custom combobox | `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-autocomplete` |
| Tab panel | `role="tablist"` + `role="tab"` + `role="tabpanel"` + `aria-selected` + `aria-controls` |
| Decorative image | `alt=""` + `aria-hidden="true"` |
| Informative image | `alt="Descriptive text"` (no `aria-hidden`) |

**Never:**
- Use `aria-hidden="true"` on a focusable element
- Use positive `tabindex` values (`tabindex="2"` — breaks natural DOM order)
- Add `role="button"` to a `<div>` — use `<button>` instead
- Use `aria-label` and visible text that say different things

---

### Category 3 — Keyboard Navigation

All interactive elements must be operable by keyboard alone.

**Checklist:**

- [ ] Every interactive element reachable with `Tab`
- [ ] `Tab` order follows visual reading order (left→right, top→bottom)
- [ ] No `tabindex` values greater than 0
- [ ] `Escape` closes modals, popovers, dropdowns
- [ ] `Enter` / `Space` activates buttons
- [ ] Arrow keys navigate within composite widgets (menus, tabs, radio groups)
- [ ] Focus trapped inside open modal — does not reach content behind it
- [ ] After modal closes, focus returns to the trigger element
- [ ] No `outline: none` or `outline: 0` without a visible replacement focus style
- [ ] Skip-to-main link present for pages with repeated navigation

**Focus style minimum:**
```css
/* ❌ Never */
:focus { outline: none; }

/* ✅ Minimum — matches browser default or better */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

---

### Category 4 — Forms

Forms are the highest-density source of accessibility failures.

**Every input requires:**

```tsx
{/* ✅ Correct form field pattern */}
<div>
  <label htmlFor="email">
    Email address
    <span aria-hidden="true"> *</span>         {/* visual asterisk */}
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-describedby="email-hint email-error"  {/* link hint + error */}
  />
  <p id="email-hint">We'll never share your email.</p>
  <p id="email-error" role="alert" aria-live="assertive">
    {error}
  </p>
</div>
```

**Form checklist:**

- [ ] Every `<input>` / `<select>` / `<textarea>` has a `<label>` with matching `htmlFor` / `id`
- [ ] Placeholder text is NOT the only label (placeholder disappears on input)
- [ ] Required fields marked with both `required` and `aria-required="true"`
- [ ] Required indicated visually AND in text (not color alone)
- [ ] Error messages linked via `aria-describedby`, not just displayed nearby
- [ ] Error messages use `role="alert"` or `aria-live="assertive"`
- [ ] Error state reflected on the input: `aria-invalid="true"`
- [ ] Submit button is a `<button type="submit">`, not `<div>`
- [ ] Grouped radio/checkbox use `<fieldset>` + `<legend>`

---

### Category 5 — Screen Reader Output

What a screen reader announces must be accurate and complete.

**Checklist:**

- [ ] `<html lang="en">` (or appropriate locale) is set
- [ ] Every `<img>` has `alt` — empty string `alt=""` for decorative images
- [ ] SVG icons have `aria-hidden="true"` if decorative, or `<title>` + `aria-labelledby` if informative
- [ ] Dynamic content updates use `aria-live` regions
- [ ] Modals announce their title on open (`aria-labelledby` points to visible heading)
- [ ] Tables use `<caption>`, `<thead>`, `scope="col"` / `scope="row"`
- [ ] Links describe destination — not "click here" or "read more"
- [ ] Buttons describe action — not "submit" for everything
- [ ] Loading states announced: `role="status"` or `aria-live="polite"`
- [ ] Content hidden visually but available to screen readers uses `.sr-only`, not `display:none`

**`.sr-only` utility (Tailwind):**
```tsx
className="sr-only"  {/* visually hidden, screen-reader visible */}
```

---

## Color Contrast (WCAG 1.4.3 / 1.4.11)

| Element | Minimum ratio |
|---------|--------------|
| Normal text (< 18px / not bold) | **4.5 : 1** |
| Large text (≥ 18px or ≥ 14px bold) | **3 : 1** |
| UI components & focus indicators | **3 : 1** |
| Decorative / disabled elements | No requirement |

Flag any color combination that likely fails. Use shadcn CSS variables — they are pre-tested for contrast in both light and dark mode.

---

## Audit Report Format

```
## WCAG 2.1 AA Audit

### Category 1 — Semantic HTML
[PASS / n issue(s)]
- ERROR [1.3.1]: <div onClick> at line X — replace with <button>
- WARN  [1.3.1]: Heading skips from h2 to h4

### Category 2 — ARIA
[PASS / n issue(s)]
- ERROR [4.1.2]: Icon button missing aria-label

### Category 3 — Keyboard Navigation
[PASS / n issue(s)]
- ERROR [2.1.1]: Modal does not trap focus
- WARN  [2.4.7]: outline:none with no visible replacement

### Category 4 — Forms
[PASS / n issue(s)]
- ERROR [1.3.1]: Input #email has no associated <label>
- ERROR [3.3.1]: Error message not linked via aria-describedby

### Category 5 — Screen Reader
[PASS / n issue(s)]
- ERROR [1.1.1]: <img> at line X missing alt attribute
- WARN  [2.4.4]: Link text "click here" is not descriptive

### Summary
X error(s) — must fix before shipping
Y warning(s) — strongly recommended

### Fixed Code
[Full corrected component if any ERRORs found]
```

**ERRORs** = WCAG AA violations. Must be resolved.
**WARNs** = best-practice issues that reduce usability. Fix if time allows.
