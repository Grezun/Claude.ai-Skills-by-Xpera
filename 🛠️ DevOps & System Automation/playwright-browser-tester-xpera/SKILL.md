---
name: playwright-browser-tester-xpera
description: Use when asked to test a UI flow, verify a login, check a form submission, reproduce a visual bug, or run any browser interaction against a local dev server — triggers before writing test code or opening a browser manually
---

# Playwright Browser Tester

## Overview

Playwright drives a real browser against the local dev server, captures screenshots at every step, records console errors and network failures, then feeds those artefacts back into the conversation via `Read` — so Claude sees the exact visual state and can diagnose the bug immediately.

**The loop:** run script → screenshots + report.json on disk → `Read` each file → Claude analyzes → proposes fix.

## Prerequisites Check (always run first)

```bash
# 1. Is the dev server up?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200/30x = good. Connection refused = start the server first.

# 2. Is Playwright importable as a module in this project?
node -e "require('playwright')" 2>/dev/null && echo "INSTALLED" || echo "NOT INSTALLED"
# npx playwright --version may show a version from the global cache but the module
# still won't import unless node_modules/playwright exists in the project.
# If NOT INSTALLED:
#   Option A (preferred): npm install --save-dev playwright && npx playwright install chromium
#   Option B (no project install): mkdir /tmp/pw-ws && cd /tmp/pw-ws && npm init -y \
#                                  && npm install playwright && npx playwright install chromium
```

If the server is down, find the start command in `package.json` (`dev`, `start`) or `Makefile` and run it before proceeding.

## Run the Script

```bash
# Adapt and run the inline pattern from the Implementation section,
# or copy scripts/pw-capture.ts from this skill into the project root.
OUT=/tmp/pw-run npx tsx scripts/pw-capture.ts
```

## Feed Results Back to Claude

After the script exits, **always read these files directly into the conversation:**

```
Read /tmp/pw-run/01-initial.png
Read /tmp/pw-run/02-filled.png
Read /tmp/pw-run/03-result.png
Read /tmp/pw-run/report.json
```

Claude can then see the exact visual state and structured error log. Without this step, screenshots stay on disk and are invisible to Claude.

## What Gets Captured

| Artefact | What it reveals |
|----------|----------------|
| `01-initial.png` | Page on arrival — confirms correct URL loaded |
| `02-filled.png` | Form state before submit — selector issues visible here |
| `03-result.png` | Post-submit state — redirect success or error message |
| `report.json` | Steps pass/fail, final URL, console errors, network failures |

## Implementation — Login Flow Pattern

Adapt field selectors, credentials, and expected URL to the target flow:

```typescript
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = process.env.OUT ?? '/tmp/pw-run';
fs.mkdirSync(OUT, { recursive: true });

const consoleErrors: string[] = [];
const pageErrors: string[]    = [];
const networkFailures: { url: string; status: number }[] = [];

const browser = await chromium.launch({ headless: true });
const page    = await browser.newPage();

page.on('console',   msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => pageErrors.push(err.message));
page.on('response',  res => { if (res.status() >= 400) networkFailures.push({ url: res.url(), status: res.status() }); });

const steps: { step: string; url: string; ok: boolean }[] = [];

// ── 1. Navigate ───────────────────────────────────────────────────────────
await page.goto('http://localhost:3000/login');
await page.screenshot({ path: `${OUT}/01-initial.png`, fullPage: true });
steps.push({ step: 'navigate to /login', url: page.url(), ok: true });

// ── 2. Fill credentials ───────────────────────────────────────────────────
// Try multiple selectors — apps vary widely
const emailInput = page.locator([
  'input[type="email"]', 'input[name="email"]', '#email',
  'input[placeholder*="email" i]',
].join(', ')).first();

const passInput = page.locator([
  'input[type="password"]', 'input[name="password"]', '#password',
].join(', ')).first();

await emailInput.fill('admin@example.com');
await passInput.fill('password123');
await page.screenshot({ path: `${OUT}/02-filled.png`, fullPage: true });

// ── 3. Submit & wait for redirect ─────────────────────────────────────────
// waitForURL handles SPA push-state routing; waitForNavigation misses it
await passInput.press('Enter');
await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 6000 })
  .catch(() => {}); // swallow timeout — screenshot will show what happened
await page.screenshot({ path: `${OUT}/03-result.png`, fullPage: true });

const landed = new URL(page.url()).pathname;
steps.push({ step: 'redirect to /dashboard', url: page.url(), ok: landed === '/dashboard' });

await browser.close();

// ── 4. Write structured report ────────────────────────────────────────────
const report = { steps, consoleErrors, pageErrors, networkFailures };
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

console.log('\n=== RESULT ===');
steps.forEach(s => console.log(`${s.ok ? '✓' : '✗'} ${s.step}  →  ${s.url}`));
if (consoleErrors.length)    console.log('Console errors:', consoleErrors);
if (networkFailures.length)  console.log('Network failures:', networkFailures);
console.log(`\nNext: Read ${OUT}/01-initial.png  &&  Read ${OUT}/report.json`);
```

## Common Selectors

| Field | Selectors (try in this order) |
|-------|-------------------------------|
| Email | `input[type="email"]`, `input[name="email"]`, `#email`, `input[placeholder*="email" i]` |
| Password | `input[type="password"]`, `input[name="password"]`, `#password` |
| Submit | `button[type="submit"]`, `button:has-text("Log in")`, `button:has-text("Sign in")` |
| Error toast | `[role="alert"]`, `.error`, `[data-testid*="error"]` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Testing with `curl` | `curl` misses JS-driven redirects, SPA routing, and client-side validation |
| `waitForNavigation()` times out | Use `waitForURL(predicate)` — handles push-state SPAs correctly |
| Screenshots saved but not `Read` | **Always** call `Read <path>` on each PNG — images on disk are invisible to Claude |
| Assuming `npx playwright --version` = importable | Run `node -e "require('playwright')"` — the npx cache may have the binary without the module in `node_modules/` |
| Checking only the final URL | A redirect alone doesn't prove success — inspect `report.json` for network failures and console errors |
| One hard-coded selector | Use the comma-joined selector list + `.first()` pattern; if none match, log all `<input>` elements found on the page |
