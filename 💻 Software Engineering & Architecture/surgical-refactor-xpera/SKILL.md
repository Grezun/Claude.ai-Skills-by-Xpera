---
name: surgical-refactor
description: Use when asked to refactor, clean up, rewrite, or improve a specific function, method, class, or block of code. Enforces scope discipline — only the explicitly named target may be touched.
---

# Surgical Refactor

## Overview

Touch only what was asked. Every change outside the named target is a violation — even if it looks like an improvement.

## The Rule

**One target. Zero side effects on the diff.**

When asked to refactor a function, method, class, or block:
- Modify ONLY that exact target
- Leave everything outside it byte-for-byte identical

## Absolute Prohibitions

These are never allowed unless the user explicitly names them as part of the task:

- Reformatting adjacent functions or files
- Renaming variables, parameters, or types outside the target
- Removing unused imports unless the refactor introduced the unused state
- Fixing bugs or smells noticed in nearby code
- Updating callers, tests, or dependent code
- Adding or removing blank lines outside the target
- Changing comments outside the target
- "Cleaning up" anything not named

## Red Flags — STOP

If you are about to do any of the following, **stop and revert the change**:

| Thought | What it means |
|---------|---------------|
| "While I'm here, this import is unused..." | Out of scope. Stop. |
| "This adjacent function has the same issue..." | Out of scope. Stop. |
| "The caller should be updated to match..." | Out of scope. Stop. |
| "The formatting is inconsistent throughout..." | Out of scope. Stop. |
| "The test for this should be updated..." | Out of scope. Stop. |
| "This variable name is unclear, I'll rename it..." | Out of scope. Stop. |
| "I noticed a bug nearby..." | Out of scope. Stop. |
| "This is a small fix, it won't hurt the diff..." | Still out of scope. Stop. |

## Common Rationalizations — All Invalid

| Excuse | Reality |
|--------|---------|
| "It's a one-line change, very contained" | Scope is defined by the task, not the size of the change. |
| "This is clearly a bug that should be fixed" | Note it in the response. Do NOT touch it. |
| "Renaming improves readability throughout" | Renaming is a separate task. Propose it; don't do it. |
| "The test needs to reflect the new signature" | Only if the user asked for both. Otherwise: note it. |
| "I'm following the spirit of clean code" | The spirit of this task is a minimal diff. |
| "The user will want this too" | Ask. Don't assume. |
| "All three functions have the same issue — consistent API is better" | Consistency is a separate task. Note the others; touch only the named one. |
| "Option A is surgical but Option B (touching all) is clearly better engineering" | This framing is scope creep dressed as a principled choice. The task defines the scope. |
| "Adjacent functions have the same latent bug — fixing all prevents future tickets" | Preventing future tickets is not this task. Note it; don't fix it. |

## Correct Pattern

```
User: "Refactor the `parseDate` function to handle ISO 8601."

✅ Correct:
- Modify only `parseDate`
- If you notice a related bug in `formatDate` → mention it in your response, touch nothing
- If tests need updating → tell the user, do not touch them

❌ Wrong:
- Also renaming `date_str` to `dateString` in the caller
- Removing an unused import two lines above
- Reformatting the function below parseDate "for consistency"
```

## Git Diff Hygiene

After writing your changes, mentally verify:

1. Does the diff contain ONLY lines inside the named target?
2. Are there any whitespace, blank line, or formatting changes outside the target?
3. Are there any renamings that touch code outside the target?

If the answer to 2 or 3 is yes — revert those lines before presenting.

## Reporting Side-Observations

If you notice issues outside the target while working, **report them in your response, never fix them silently**:

> "I also noticed that `formatDate` has a similar edge case — want me to address that in a separate refactor?"

This keeps the diff clean and gives the user full control.
