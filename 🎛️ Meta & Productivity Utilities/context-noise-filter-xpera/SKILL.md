---
name: context-noise-filter-xpera
description: Use when running shell commands in agentic sessions and receiving long tool output — npm install, webpack builds, test runs, server logs, or any CLI output with more than ~30 lines. Use when context is filling up with repeated tool results or when summarizing what bash commands produced.
---

# Context Noise Filter

## Overview

Replace full tool output with a one-line carry-forward summary plus an extracted signal block. Never let a tool result occupy more context than the signal it contains.

**Core rule:** If the tool output contains no errors and no unexpected state, compress it to a single sentence and discard the rest.

## Signal vs Noise by Tool

| Tool | Noise (discard) | Signal (keep) |
|------|----------------|---------------|
| `npm install` / `pnpm install` / `yarn` | All `npm warn deprecated` lines, progress bars, funding notice, audit counts | "added N packages" OR any `npm ERR!` / `ERR_PNPM_` lines |
| `npm test` / `jest` | All `PASS` lines, timing, coverage table rows for passing files | `FAIL` lines, full error block (test name + stack trace excerpt + line ref), summary counts |
| `webpack` / `vite` | Asset size list, module counts, chunk info, timing | `ERROR in` blocks, warnings that indicate actionable state (e.g. bundle size exceeded, circular dependency), final compiled status line |
| `nodemon` / server startup | All `✓` middleware/route lines, version header, watch config | Last line before crash, any `Error:` output, `app crashed` without preceding error (silent crash) |
| `docker build` | Step numbers with cache hits (`---> Using cache`), layer hashes | `Error response from daemon`, `failed to solve`, any step that fails |
| `git` commands | Full diff output beyond 20 lines, full log beyond 5 entries | Conflict markers, error lines, branch/commit references needed for next step |
| `tsc` / TypeScript | Duplicate occurrences of the same error code in the same file | First occurrence of each (file + error code) pair; different codes in the same file are each kept |

## The Carry-Forward Pattern

After each tool call, apply this before reasoning further:

```
[RAW OUTPUT: 847 lines]

Carry-forward: npm install succeeded (848 packages). No blocking errors.
Signal block: none — discard entire output.
```

```
[RAW OUTPUT: 200 lines]

Carry-forward: jest — 1 failure in Dashboard.test.jsx, 47 passed.
Signal block:
  FAIL src/components/Dashboard.test.jsx
  ● Dashboard › renders chart with data
  TypeError: Cannot read properties of undefined (reading 'map')
    at Dashboard.jsx:38 — data.metrics.map(...)
  Coverage gap: Dashboard.jsx lines 38,39,54-67
```

The signal block is what you carry into the next reasoning step. Everything else is evicted.

## Silent Crash Pattern

When a server/process crashes with no error output:
- Signal: the **last line before crash** + the crash notice
- Keep: `[nodemon] app crashed - waiting for file changes before starting...` AND whatever line preceded it
- Action: add `process.on('uncaughtException')` / `process.on('unhandledRejection')` handlers to surface the real error

## Common Mistakes

| Mistake | Correct approach |
|---------|----------------|
| Quoting deprecation warnings when diagnosing a build error | Discard all `npm warn deprecated` — they never cause build failures |
| Including all 10 passing test suite names to "give context" | Pass/fail count is enough: "10 passed, 1 failed" |
| Keeping coverage table for uninvolved files | Keep coverage only for the failing file |
| Repeating full webpack asset output because "sizes might matter" | Keep only the `ERROR in` block; asset sizes are noise unless the task is bundle optimization |
| Treating silent crash as "no error" | A silent crash IS the signal — extract last-line-before-crash + add error handlers |
| Keeping vulnerability counts "so the user knows" | Vulnerability counts are not related to the current task unless the task IS a security audit — discard |
