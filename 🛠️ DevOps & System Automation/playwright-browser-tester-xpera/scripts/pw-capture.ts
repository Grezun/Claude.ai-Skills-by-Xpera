/**
 * pw-capture.ts — ready-to-adapt Playwright capture script
 *
 * Usage:
 *   OUT=/tmp/pw-run URL=http://localhost:3000/login npx tsx pw-capture.ts
 *
 * Captures: screenshots at each step, console errors, page errors,
 * network failures, and a structured report.json.
 *
 * After running, feed results back to Claude:
 *   Read /tmp/pw-run/01-initial.png
 *   Read /tmp/pw-run/03-result.png
 *   Read /tmp/pw-run/report.json
 */

import { chromium, type Page } from 'playwright';
import fs from 'fs';
import path from 'path';

// ── Config (override via env) ─────────────────────────────────────────────
const OUT         = process.env.OUT  ?? '/tmp/pw-run';
const START_URL   = process.env.URL  ?? 'http://localhost:3000/login';
const EMAIL       = process.env.EMAIL    ?? 'admin@example.com';
const PASSWORD    = process.env.PASSWORD ?? 'password123';
const EXPECT_PATH = process.env.EXPECT   ?? '/dashboard';

fs.mkdirSync(OUT, { recursive: true });

// ── Telemetry collectors ───────────────────────────────────────────────────
const consoleErrors:   string[]                           = [];
const pageErrors:      string[]                           = [];
const networkFailures: { url: string; status: number }[] = [];
const steps:           { step: string; url: string; ok: boolean; error?: string }[] = [];

function attachListeners(page: Page) {
  page.on('console',   msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('response',  res => {
    if (res.status() >= 400) networkFailures.push({ url: res.url(), status: res.status() });
  });
}

function shot(name: string) {
  return path.join(OUT, name);
}

// ── Main flow ─────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const page    = await browser.newPage();
attachListeners(page);

try {
  // 1. Navigate
  await page.goto(START_URL);
  await page.screenshot({ path: shot('01-initial.png'), fullPage: true });
  steps.push({ step: `navigate to ${START_URL}`, url: page.url(), ok: true });

  // 2. Fill credentials
  // Comma-joined selector tries multiple patterns — adapt as needed
  const emailInput = page.locator([
    'input[type="email"]',
    'input[name="email"]',
    '#email',
    'input[placeholder*="email" i]',
    'input[autocomplete="email"]',
  ].join(', ')).first();

  const passInput = page.locator([
    'input[type="password"]',
    'input[name="password"]',
    '#password',
    'input[autocomplete="current-password"]',
  ].join(', ')).first();

  await emailInput.waitFor({ timeout: 4000 });
  await emailInput.fill(EMAIL);
  await passInput.fill(PASSWORD);
  await page.screenshot({ path: shot('02-filled.png'), fullPage: true });
  steps.push({ step: 'fill credentials', url: page.url(), ok: true });

  // 3. Submit
  // Press Enter on the password field; falls back to clicking the submit button
  const submitted = await passInput.press('Enter').then(() => true).catch(() => false);
  if (!submitted) {
    const submitBtn = page.locator([
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
    ].join(', ')).first();
    await submitBtn.click();
  }

  // 4. Wait for redirect (handles full-page nav AND SPA push-state)
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 6000 })
    .catch(() => {});  // screenshot below will capture whatever happened
  await page.screenshot({ path: shot('03-result.png'), fullPage: true });

  const landed = new URL(page.url()).pathname;
  const ok     = landed === EXPECT_PATH;
  steps.push({
    step: `redirect to ${EXPECT_PATH}`,
    url:  page.url(),
    ok,
    error: ok ? undefined : `Expected ${EXPECT_PATH}, got ${landed}`,
  });

  // 5. If still on login, capture any error message shown
  if (!ok) {
    const errorText = await page.locator([
      '[role="alert"]', '.error', '.alert-error',
      '[data-testid*="error"]', 'p:has-text("Invalid")', 'p:has-text("incorrect")',
    ].join(', ')).first().textContent({ timeout: 1000 }).catch(() => null);

    if (errorText) steps[steps.length - 1].error += ` | Page says: "${errorText.trim()}"`;
  }

} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  steps.push({ step: 'unexpected error', url: page.url(), ok: false, error: msg });
  await page.screenshot({ path: shot('99-error.png'), fullPage: true });
} finally {
  await browser.close();
}

// ── Write report ──────────────────────────────────────────────────────────
const report = { steps, consoleErrors, pageErrors, networkFailures };
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

// ── Print summary ─────────────────────────────────────────────────────────
console.log('\n=== PLAYWRIGHT RESULT ===');
steps.forEach(s => console.log(`${s.ok ? '✓' : '✗'} ${s.step}  →  ${s.url}${s.error ? `\n    ↳ ${s.error}` : ''}`));
if (consoleErrors.length)   console.log('\nConsole errors:', consoleErrors);
if (pageErrors.length)      console.log('\nPage errors:', pageErrors);
if (networkFailures.length) console.log('\nNetwork failures:', networkFailures);

const allOk = steps.every(s => s.ok);
console.log(`\nOverall: ${allOk ? 'PASS ✓' : 'FAIL ✗'}`);
console.log(`\n── Feed back to Claude ──────────────────────────────────────`);
console.log(`Read ${OUT}/01-initial.png`);
console.log(`Read ${OUT}/02-filled.png`);
console.log(`Read ${OUT}/03-result.png`);
console.log(`Read ${OUT}/report.json`);

process.exit(allOk ? 0 : 1);
