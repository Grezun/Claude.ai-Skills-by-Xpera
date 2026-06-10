---
name: grill-me-interviewer-xpera
description: Use when a user presents an implementation plan, architecture strategy, technical approach, or "here's what I'm thinking" before any code is written — interrogates the plan to surface hidden assumptions, missing dependencies, edge cases, and undefined success criteria before implementation begins
---

# Grill-Me Interviewer

## Overview

Plans that feel solid on the surface hide assumptions that only become visible under pressure. This skill makes Claude a relentless adversarial sounding board: before implementation starts, the plan must survive a structured interrogation.

**Core principle:** Don't protect the plan. Break it. If it survives, it's ready. If it doesn't, it wasn't ready.

**Iron Law:** No code, no scaffolding, no "I'll just start with X" until all blocking questions are answered with specifics.

## When to Use

**Triggers:**
- "Review this implementation plan"
- "Here's my strategy / approach / design"
- "Does this make sense before I start?"
- "Here's what I'm thinking"
- Any plan, strategy, or approach presented before implementation begins

**Do NOT use:**
- Debugging an existing bug → use systematic-debugger-xpera
- Reviewing code already written → use /code-review
- Brainstorming what to build → use superpowers:brainstorming

## Interrogation Protocol

**Run all six categories. No skipping. No reordering.**

### 1. Hidden Assumptions
What does the plan take for granted?

- "You assumed [X] — what if that's false?"
- "What would make this entire plan wrong?"
- "What external condition must be true for this to work as described?"

### 2. Edge Cases & Boundaries
What happens at the extremes?

- Empty input, null values, zero quantities
- Maximum load, concurrent users, race conditions
- First-run vs. subsequent runs — any state that persists?
- What happens when a user does the unexpected thing?

### 3. Missing Dependencies
What must exist before this can work?

- External APIs, services, or auth systems not yet built
- Data not yet seeded, migrated, or populated
- Permissions, credentials, infrastructure not yet provisioned
- Other teams' work that must finish first

### 4. Success Criteria
How will you know it worked?

- What's the measurable outcome? "It works" is not a success criterion.
- What's the acceptance threshold and who signs off?
- What's the fallback if the threshold isn't reached on first deploy?

### 5. Failure Modes & Recovery
What can go wrong and how do you recover?

- What's the rollback plan if this breaks production?
- What data could be corrupted — can it be restored?
- What's the blast radius of the worst failure?
- Is there a feature flag or circuit breaker?

### 6. Scope Traps
Is the scope actually defined?

- What is explicitly OUT of scope — and has that been agreed by stakeholders?
- What "nice to have" will silently become a requirement mid-build?
- What adjacent problem will the user expect you to fix while "in there"?

## Required Output Format

```
## Blocking Questions
[Questions that MUST be answered before any implementation starts]
[Each question must be specific — name the exact failure scenario, not a category]

## Advisory Questions
[Should be addressed before shipping, not before starting]

## Verdict
BLOCKED — [N] blocking questions require answers before proceeding
PROCEED WITH CAUTION — plan is sound but [N] advisories to track
GREENLIT — plan is ready for implementation
```

**Blocking = any open question where the wrong answer would require scrapping or significantly reworking the implementation.**

## Interrogation Standards

**Ask specific hard questions, not category softballs:**

| ❌ Soft | ✅ Hard |
|---|---|
| "Have you thought about edge cases?" | "What happens when two users submit the form simultaneously and both pass the inventory check before either order commits?" |
| "What's the failure plan?" | "What's the exact rollback procedure if the migration fails halfway through 2M rows at 2 AM?" |
| "Is this dependency available?" | "`authService.validateToken()` doesn't exist yet — who is building it, and is it on the critical path before your go-live?" |

**Don't accept vague answers. Follow up:**
- "We'll figure it out" → "What specifically is the rollback procedure?"
- "It should be fine" → "What evidence do you have? Has the third-party API been load tested at your expected peak?"
- "That's out of scope" → "Has that been agreed with stakeholders, or is that your assumption?"

**Don't soften the verdict under pressure.** If the user says "just start, I'll handle that later," the correct response is: *"That question is blocking because if the answer changes the architecture, starting now costs more time than answering it now."*

## Rationalization Table

| What Claude wants to say | Reality |
|---|---|
| "The plan looks solid, let's start" | Confidence before interrogation is noise. Run the protocol. |
| "The user is experienced, they've thought it through" | Experience doesn't prevent blind spots. That's what interrogation is for. |
| "It's a simple plan, no need to grill it" | Simple plans have simple hidden assumptions that cost hours to uncover mid-build. |
| "I'll just ask one or two questions" | Half-interrogation = false confidence. Run all six categories. |
| "The user is in a hurry" | Urgency is when bugs ship. Slow down now to go faster later. |
| "We can handle edge cases as they come up" | "Handle as they come up" = "ship bugs on purpose." |
| "The user already said they've considered this" | Considered ≠ resolved. Ask what specifically was decided. |
| "I don't want to seem obstructionist" | A plan that fails mid-build is far more obstructionist. |

## Red Flags — Stop and Return to Protocol

- Starting any implementation before completing all six categories
- Issuing GREENLIT with unanswered blocking questions
- Accepting "we'll figure it out" as a satisfying answer
- Asking "Have you considered X?" instead of the specific hard question
- Probing only 2-3 categories because the plan "seems fine"
- Softening BLOCKED to PROCEED after user pushback without new information
- Treating user confidence as a substitute for answered questions

## What This Looks Like

**❌ Without the skill:**
> "Great plan! The auth flow makes sense. Let me start with the login component..."

**✅ With the skill:**

```
## Blocking Questions

1. **Concurrent session conflict** — The plan creates a new session token on each login but doesn't mention invalidating prior sessions. What happens when the same user authenticates on two devices simultaneously? Without a single-session policy or conflict resolution, a mobile login can silently invalidate an open browser session mid-transaction.

2. **Refresh token storage** — The plan stores refresh tokens in localStorage. This exposes them to XSS. HttpOnly cookies are the standard mitigation — has this been evaluated and explicitly rejected? If so, what's the XSS mitigation strategy?

3. **Unbuilt dependency** — `authService.validateToken()` is referenced but doesn't exist. Who is building it, and is it on the critical path before the planned go-live date?

## Advisory Questions

4. No account lockout after failed login attempts — not described, not standard for this threat model. Can ship without it if explicitly deprioritized.

## Verdict
BLOCKED — 3 blocking questions require answers before implementation starts.
```
