---
name: audit-semgrep-remediation
description: Use when given Semgrep, CodeQL, or similar SAST output and asked to fix, review, or triage a security finding — even when the request sounds simple ("just bump the version", "add sanitization here")
---

# Semgrep / CodeQL Security Audit & Remediation

## Core Principle

**Understand the vulnerability before touching code. Fix at the root, not at the flag.**

Violating the letter of this protocol is violating its purpose.

## The Protocol

**Complete every step in order. No skipping.**

### 1. Parse the Finding

Extract from the tool output:
- **Rule ID** — what class of vulnerability is this? (e.g., `python.django.security.injection.tainted-sql-string`)
- **Severity** — CRITICAL / HIGH / MEDIUM / LOW / INFO
- **File + line** — where is the *sink* (where tainted data does harm)?
- **Message** — what exact unsafe operation is being performed?
- **Taint source** — where does the tool say tainted data *enters*? (not always shown explicitly)

Do not move to step 2 until you can write one sentence: *"Tainted data from [source] reaches [operation] at [file:line] without [what's missing]."*

### 2. Understand the Vulnerability Class

Look up the rule ID or message to confirm the attack vector. Do not assume — verify.

| Class | Source | Sink | What's missing |
|---|---|---|---|
| SQL Injection | User input | DB query | Parameterized query |
| XSS | User input | HTML render / `innerHTML` | Context-aware output encoding |
| Path Traversal | User input | File open/read | Canonicalization + allowlist |
| Command Injection | User input | `exec` / `subprocess` | Allowlist or shell=False |
| SSRF | User input | HTTP request URL | URL scheme + host allowlist |
| Insecure Deserialization | External data | `pickle.loads`, `unserialize` | Safe deserializer or schema validation |
| Hardcoded Secret | Source code | Credential used | Env var / secrets manager |
| Vulnerable Dependency | `package.json` / `requirements.txt` | Transitive use | Patched version |

If the class is not in this table, research it before proceeding.

### 3. Trace the Full Taint Path

Walk the data from **source → transformations → sink**:

1. Where does user-controlled (or externally-controlled) data enter the system?
2. Does it pass through any existing sanitization? Is that sanitization correct for this class?
3. At what layer does it reach the sink?
4. Is the sink itself replaceable with a safe API (e.g., parameterized query), or must sanitization happen before it?

**Do not sanitize at the sink if the correct fix is a safe API call.**
**Do not sanitize mid-chain if the correct fix is validation at the boundary.**

Write before proceeding: *"The right remediation layer is [entry / mid / output / API replacement] because [reason]."*

### 4. Triage Severity

Before writing any code, decide:

- **CRITICAL / HIGH** → Fix now. Block merge if in a PR.
- **MEDIUM** → Fix in this PR if the change is small; otherwise file a tracked issue with reproduction steps.
- **LOW / INFO** → Document, file issue, do not block. Only fix in-line if trivially small.

**Do not spend engineering time on LOW findings while HIGH/CRITICAL findings are unaddressed.**

**When given multiple findings at once:** sort by severity descending, then address CRITICAL and HIGH first as a batch before touching MEDIUM or LOW. Do not interleave.

### 5. Apply the Surgical Fix

The smallest change that eliminates the vulnerability at the layer identified in step 3.

**Dependency vulnerabilities:**
1. Confirm the CVE affects the version in use.
2. Confirm the patched version exists and covers the CVE.
3. Check the changelog for breaking changes between current and patched version.
4. Confirm the vulnerable code path is actually reachable in this project (if not, document and downgrade severity).
5. Update the lockfile, run tests.

**Code vulnerabilities:**
1. Use the safe API if one exists (parameterized query > string escaping).
2. Validate/allowlist at the system boundary if the data can be constrained.
3. Encode at output if the data must pass through untransformed.
4. Do not mix strategies — pick one layer, apply it completely.

**Do not refactor adjacent code. Do not rename variables. Do not clean up formatting. One logical change only.**

### 6. Scan for Siblings

After fixing the flagged instance, search the codebase for the same pattern:

```bash
# Example: SQLi via string interpolation in Python
grep -rn "execute(f\"" . --include="*.py"
grep -rn 'execute(".*%s.*"' . --include="*.py"
grep -rn "execute(.*format(" . --include="*.py"
```

Adapt the grep to the vulnerability class. If siblings exist:
- Fix them in the same PR if trivial.
- File tracked issues for each if non-trivial.
- Do not ignore them.

### 7. Verify

Re-run the scanner on the changed file(s):

```bash
semgrep --config=auto path/to/changed/file.py
# or
semgrep --config=p/owasp-top-ten path/to/changed/file.py
```

If the scanner still flags the fix, return to step 3 — you fixed the wrong layer.
If tests break, return to step 5 — your fix changed behavior.

**Do not mark a finding as resolved until the scanner no longer reports it.**

If you cannot run the scanner in this environment, say so explicitly — do not claim the finding is resolved. State: "Fix applied; scanner verification required before closing."

## Required Output Format

```
## Finding
Rule: <rule-id>  Severity: <level>  File: <path:line>

## Taint Path
Source: <where tainted data enters>
Transformations: <any existing sanitization — and why it's insufficient>
Sink: <unsafe operation>

## Remediation Layer
<entry / mid / output / API replacement> — because <reason>

## Fix Applied
<description of the one change made>

## Siblings Found
<list of similar patterns found, or "none">

## Verification
Scanner output after fix: <clean / still flagged — and next step>
```

## Red Flags — STOP, Return to Step 3

These thoughts mean you have not finished the analysis:

| Thought | Reality |
|---|---|
| "The tool flagged line N, I fixed line N, done." | You fixed the symptom. The source is still tainted. |
| "I added `.escape()` / `.strip()`, it's sanitized now." | Wrong sanitizer for the class — or wrong layer entirely. |
| "Bumping to latest version fixes all CVEs." | Unverified. Check CVE affects used version. Check breaking changes. |
| "This looks like a false positive." | Prove it. Document the invariant. Then add `# nosemgrep: reason`. |
| "I'll clean up the surrounding code while I'm here." | Scope creep introduces new bugs. One change only. |
| "The tool would have flagged other instances." | Tools miss things. Always grep for siblings manually. |
| "My fix clearly addresses the tool's description." | Re-run the scanner. Confirm. Do not assume. |
| "The tests pass, so it's fixed." | Tests verify behavior, not security properties. Re-run the scanner. |
| "This is LOW severity, I'll note it and move on." | Acceptable — but file the issue. Do not silently skip. |

## Suppressing Findings (nosemgrep / noqa)

Only suppress when you can state the invariant that makes the finding safe:

```python
# nosemgrep: python.django.security.injection.tainted-sql-string
# Safe: query_id is always an integer cast from request.GET validated by IntegerField form
cursor.execute("SELECT * FROM orders WHERE id = %d" % query_id)
```

Suppression without a documented invariant is a deferred vulnerability.
