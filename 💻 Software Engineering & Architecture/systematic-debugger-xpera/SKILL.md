---
name: systematic-debugger-xpera
description: Use when asked to fix a bug, resolve an error, or diagnose unexpected behavior — triggers before any fix is proposed or code is touched
---

# Systematic Debugger

## Core Principle

State before fix. Evidence before hypothesis. One change only.

**Violating the letter of this protocol is violating its purpose.**

## The Protocol

**Complete every step in order. No skipping.**

### 1. Isolate the State

Trace the exact data flow to the failure point — backward from the symptom to the origin.

- What does the stack trace / error message say exactly?
- What is the value of every relevant variable at that line?
- Where is that value set? What feeds it?
- Does the failure reproduce consistently, or only sometimes?

**Do not stop when you have a plausible explanation. Follow the chain to the origin.**

### 2. Check Boundary Conditions

At every function and data boundary in the traced path, ask:

- Null / undefined / missing (env var, DB record, dict key)
- Empty string, zero, negative, overflow
- Type mismatch (string where int expected, etc.)
- Off-by-one (index, pagination, range)
- First call vs. subsequent calls — shared or module-level state that persists

### 3. State a Single Hypothesis

Write it before touching code:

> "The root cause is **[X]** because the state shows **[Y]**. Fixing **[one specific thing]** will resolve the reported symptom."

You must fill in all three blanks from *observed evidence*, not intuition.
If you cannot, return to step 1 — you do not have enough information yet.

One hypothesis only. "It could be A or B" means you skipped step 1.

### 4. Propose One Surgical Fix

The smallest change that addresses the root cause in step 3.
Aim for one logical change. Never bundle a refactor, cleanup, or second fix alongside it.

Anything else found during analysis goes in **Also Noticed** — not in the fix.

## Required Output Format

```
## Root Cause
[Traced data flow and confirmed failure point — one paragraph]

## Hypothesis
Root cause: [specific mechanism]
Evidence: [what in the trace confirms it]
Fix will: [what symptom it resolves]

## Fix
[Minimal diff — only what the hypothesis names]

## Also Noticed (not fixed here)
- [Any other issues found during analysis]
```

**The "Also Noticed" section is mandatory.** If it is empty, either you found nothing else — unlikely for any non-trivial bug — or you bundled issues into the fix without saying so.

## Red Flags — Return to Step 1

| Thought | What it signals |
|---------|-----------------|
| "It's probably..." | You're guessing. No observed state yet. |
| "There are a few possible causes..." | One hypothesis only. Re-isolate. |
| "Let me also fix / clean up..." | Scope creep. One surgical change. Use "Also Noticed." |
| "The error usually means..." | General knowledge ≠ this bug's root cause. |
| "I'll try X and see if it helps" | Guessing with extra steps. |
| Writing a fix before stating the hypothesis | Steps are out of order. Stop. |
| No "Also Noticed" section | You either missed issues or bundled them silently. |

## Rationalization Table

| What Claude says | Reality |
|---|---|
| "The error message makes it obvious" | Obvious symptoms have non-obvious origins. Run Step 1 anyway. |
| "I'll fix this while I'm here too" | Bundled fixes obscure causation and make rollback impossible. Flag it, don't fix it. |
| "The fix is just one line, no analysis needed" | One-line fixes based on guesses fail at edge cases. State the hypothesis first. |
| "Time pressure — I'll explain after" | Unexplained fixes create the next bug. The protocol takes 2 minutes. |
| "I found two bugs, I'll fix both" | One bug report → one confirmed hypothesis → one fix. Open a second task for the second bug. |
| "I replaced X with a better implementation" | That is a refactor, not a bug fix. Surgical fix first; refactor separately. |

## What This Looks Like

**❌ Without the protocol:**
> "The issue is probably a null reference. I'll add a null check and also clean up the surrounding logic..."

**✅ With the protocol:**

```
## Root Cause
`user` is null at line 42. The session expiry check runs after the DB fetch,
so an expired session passes the auth guard but produces a null user record.

## Hypothesis
Root cause: `user.id` is accessed before validating the session is still active.
Evidence: stack trace points to line 42; session table shows token expired 3s before the request.
Fix will: prevent the null dereference for expired sessions.

## Fix
- const id = user.id;
+ const id = user?.id ?? throwUnauthorized();

## Also Noticed (not fixed here)
- Session expiry check order is inverted — should run before DB fetch (separate task)
- No rate limiting on this endpoint (security concern, separate task)
```
