---
name: legal-contract-redliner-xpera
description: Use when asked to review, redline, check, or flag risks in any contract — NDAs, SaaS agreements, MSAs, SOWs, employment agreements, or any legal document shared for review
---

# Legal Contract Redliner

## Core Principle

Systematic clause scan before any commentary. Severity-triaged output. Every risk paired with playbook redline language — not just flagged.

**Giving general commentary without redline markup is not a review. It is a summary.**

## The Protocol

**Complete every phase in order. Do not skip.**

### Phase 1: Identify the Document Type

Before scanning, name the contract type and note:
- Which party is "you" (the party receiving the contract for review)?
- Is this the other party's paper (vendor/counterparty draft) or your template?
- Counterparty's paper gets more scrutiny — every one-sided provision is a negotiation target.

### Phase 2: Systematic Clause Scan

Run every section against the **Risk Taxonomy** below. Do not stop when you find the first issue. Scan the full document.

Check for **both present risks** (clause exists but is unfavorable) and **missing provisions** (standard protective clause is absent entirely).

### Phase 3: Severity Triage

Assign every finding a severity level:

| Level | Label | Meaning |
|-------|-------|---------|
| 🔴 | CRITICAL | Must fix before signing. Existential exposure. |
| 🟠 | HIGH | Significant financial or legal exposure. Negotiate hard. |
| 🟡 | MEDIUM | Suboptimal but manageable. Push back if possible. |
| 🟢 | LOW | Flag for awareness. Accept if other issues are resolved. |

### Phase 4: Draft Redlines

For every 🔴 and 🟠 finding, produce a redline using this markup:

```
**[§ Section Number — Clause Name]** 🔴 CRITICAL

> **Issue:** [One sentence on what is wrong and why it creates exposure]

**Current language:**
> "[exact quote from contract]"

**Proposed redline:**
> ~~[deleted text]~~ **[replacement text]**

**Playbook note:** [Why this language, what it protects against]
```

For 🟡 findings, produce the redline only if the fix is straightforward. Otherwise note the concern and recommend negotiation.

For 🟢 findings, list in the "Also Noted" section — no full redline required.

---

## Risk Taxonomy

Scan every contract for all of the following. See `references/playbook.md` for standard replacement language.

### Indemnification
- [ ] Is indemnification **mutual**? (one-sided = 🔴)
- [ ] Is there a **cap** on indemnification obligations? (uncapped = 🔴)
- [ ] Does scope extend beyond the indemnifying party's own acts/omissions? (overbroad = 🟠)
- [ ] Does it include IP infringement indemnity from the vendor? (missing = 🟠)

### Limitation of Liability
- [ ] Is the LoL **mutual**? (one-sided = 🔴)
- [ ] Are carve-outs (fraud, gross negligence, willful misconduct, IP indemnity) present for **both** parties? (asymmetric carve-outs = 🟠)
- [ ] Is the liability cap a reasonable multiple of fees paid? (too low = 🟠)

### Auto-Renewal
- [ ] Is the renewal notice window **≥ 60 days**? (<30 days = 🔴, 30–59 days = 🟡)
- [ ] Is the renewal term ≤ the initial term? (perpetual or >1yr lock-in = 🟠)

### IP Ownership
- [ ] Does IP assignment scope stay within deliverables created **under this agreement**? (IP created outside scope assigned = 🔴)
- [ ] Are **pre-existing IP and general tools/methodologies** explicitly retained? (missing = 🟠)
- [ ] For SaaS: does vendor claim rights to **customer data or outputs**? (= 🔴)

### Non-Compete / Non-Solicitation
- [ ] Duration ≤ 1 year post-termination? (>1yr = 🟠, >2yr = 🔴)
- [ ] Geography/industry scope proportionate to actual business? (overbroad = 🟠)
- [ ] Employee non-solicitation mutual? (one-sided = 🟡)
- [ ] Is there a no-hire carve-out for public job postings? (missing = 🟡)

### Confidentiality
- [ ] Is "Confidential Information" definition **bounded** (not everything)? (overbroad = 🟡)
- [ ] Are standard exclusions present (public domain, independently developed, legally required disclosure)? (missing = 🟡)
- [ ] Duration: 3–5 years for general CI, indefinite for trade secrets? (indefinite on all = 🟠)

### Governing Law & Dispute Resolution
- [ ] Is governing law in an acceptable jurisdiction for your party? (unfavorable = 🟡)
- [ ] Is mandatory arbitration combined with **class action waiver**? (= 🟠)
- [ ] Is there a right to seek **injunctive relief** in court regardless of arbitration? (missing = 🟡)

### Termination
- [ ] Does **your party** have termination for convenience? (missing = 🟠)
- [ ] Are cure periods present before termination for cause? (missing = 🟠)
- [ ] Are data return/deletion obligations upon termination defined? (missing = 🟡)

### Assignment
- [ ] Is consent required for assignment? (no consent required = 🟡)
- [ ] Is change-of-control (acquisition) treated as an assignment requiring consent? (missing = 🟡)

### Payment & Pricing
- [ ] Are price escalation caps defined? (uncapped auto-escalation = 🟠)
- [ ] Is the late payment interest rate reasonable (≤ 1.5%/month)? (higher = 🟡)

### SLA / Service Levels (SaaS only)
- [ ] Are SLA remedies limited to **credits only** with no termination right? (= 🟠)
- [ ] Is there a **termination right** for repeated SLA failures? (missing = 🟠)

### Survival
- [ ] Do only appropriate obligations survive termination (confidentiality, IP, payment, indemnification)? (overbroad survival = 🟡)

---

## Required Output Format

```
## Contract Review: [Document Name / Type]
**Reviewing as:** [Party Name]
**Document origin:** [Counterparty paper / Own template]
**Overall Risk:** 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW

---

## Executive Summary
[2–4 sentences. Key risk areas. Whether this is signable as-is.]

---

## Findings

### 🔴 Critical Issues
[Full redline markup per finding]

### 🟠 High Issues
[Full redline markup per finding]

### 🟡 Medium Issues
[Redline or negotiation note per finding]

---

## Missing Provisions
[Standard clauses not present at all, with recommended additions]

---

## Also Noted (Low / Awareness)
- [§X.X] [Issue]
```

---

## Common Mistakes

**Stopping at the first red flag.** Complete the full taxonomy scan before drafting any redlines. You will miss issues buried in survival, assignment, and payment sections.

**Flagging without fixing.** "This indemnification clause is broad" is not a redline. Always pair the issue with proposed replacement language from the playbook.

**Treating all issues as equal.** Severity triage changes negotiation strategy. 🔴 issues are walk-away conditions; 🟢 issues are accept-if-needed.

**Missing absent provisions.** A missing data-return-on-termination clause is a risk just as much as a bad clause. Always check what is not there.

**Summarizing instead of quoting.** Always quote the exact contract language in the "Current language" block. Paraphrasing introduces errors.

---

## Red Flags — Stop and Re-Run the Scan

| Thought | What it signals |
|---------|-----------------|
| "The contract looks pretty standard" | Standard ≠ balanced. Run the full taxonomy. |
| "I'll just highlight the main concerns" | "Main" means you stopped early. Finish the scan. |
| "This clause seems fine" | Fine ≠ checked. Mark it reviewed in the taxonomy checklist. |
| "I'll note this is risky without rewriting it" | Not a redline. Pull playbook language and draft the fix. |
| "The other party probably won't agree to this" | Not your job to pre-concede. Flag it; let the negotiator decide. |

---

## Rationalization Table

| What Claude says | Reality |
|---|---|
| "This is a standard NDA, nothing unusual" | Every NDA has traps. Scan the full taxonomy. |
| "The indemnification seems mutual" | Read it again — mutual scope ≠ mutual cap. Check both. |
| "Auto-renewal is normal" | Normal ≠ acceptable. Check the notice window; flag if <60 days. |
| "I'll summarize the risks at a high level" | High-level summaries don't produce redlines. Follow the output format. |
| "The governing law clause is boilerplate" | Boilerplate in the counterparty's jurisdiction. Flag it. |
| "I'm not a lawyer so I'll be cautious" | You are following a playbook. Apply it. Add disclaimer at the end. |

---

*Always close with:* **"This review follows a corporate legal playbook and is not legal advice. Have qualified counsel review before signing."**
