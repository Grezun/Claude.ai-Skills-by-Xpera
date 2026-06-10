---
name: skill-creator-xpera
description: Use when building a new Claude skill from scratch, turning a workflow into a reusable skill, or validating an existing skill against Anthropic development standards. Triggers on "build a skill", "create a skill", "make an automation workflow", "turn this into a skill", "help me write a skill". Use this skill before writing any SKILL.md frontmatter or skill body.
---

# Skill Creator (Interactive Engine)

An interactive wizard that guides skill creation end-to-end: intent → naming → frontmatter → body → validation → testing. Works alongside `superpowers:writing-skills` (the TDD methodology) and `document-skills:skill-creator` (the eval/benchmark pipeline).

**REQUIRED BACKGROUND:** Load `superpowers:writing-skills` before starting. It defines the RED-GREEN-REFACTOR cycle this skill depends on.

---

## Phase 1: Capture Intent

Ask the user these questions before touching any file:

1. **Core behavior** — "What should this skill enable Claude to do? One sentence."
2. **Trigger signals** — "What would a user type to trigger this? Give 3 different phrasings."
3. **Output format** — "What does success look like? A file, a plan, a conversation?"
4. **Skill type** — "Is this a technique (steps), a pattern (mental model), or a reference (docs/API)?"

Extract answers from conversation history first if they're already there. Confirm before proceeding.

---

## Phase 2: Name the Skill

**Hard rules — zero exceptions:**
- Characters: `[a-z0-9-]` only — no spaces, underscores, parentheses, or special chars
- Format: kebab-case verb-first gerunds preferred (`creating-skills`, not `skill-creation`)
- Length: under 40 characters
- No double hyphens

```
✓ Only [a-z0-9-]?
✓ Starts with a letter?
✓ Under 40 chars?
✓ Verb-first / descriptive of the action?
```

**Present the candidate name and get explicit approval before Phase 3.**

---

## Phase 3: Write the Description

The description is the only thing Claude reads to decide whether to invoke your skill. It must describe **when to use it**, not what it does internally.

**Rules:**
- Start with `"Use when..."`
- Triggering conditions only — no workflow summary, no process description
- Third person (will be injected into the system prompt)
- Under 500 characters; total frontmatter under 1024 characters
- Include concrete triggers: error messages, symptoms, exact user phrases

**The critical trap:**
```yaml
# ❌ WRONG: Describes the workflow → Claude follows the description, skips the skill body
description: Use when creating skills — interviews user, writes YAML, runs RED-GREEN-REFACTOR tests

# ✅ RIGHT: Triggering conditions only
description: Use when building a new Claude skill, turning a workflow into a skill,
  or validating an existing skill against Anthropic development standards
```

**Validation before writing:**
```
✓ Starts with "Use when..."?
✓ Third person?
✓ Zero workflow description?
✓ Under 500 chars?
✓ Includes specific phrases the user would actually type?
```

---

## Phase 4: Build the SKILL.md Body

### Required Frontmatter

```yaml
---
name: your-skill-name
description: Use when [specific triggering conditions]
---
```

Optional: `compatibility: [list of required tools]` — rarely needed.  
Full field spec: [agentskills.io/specification](https://agentskills.io/specification)

### Body Structure by Skill Type

**Technique skill** (steps to follow):
1. Overview — what this is, core principle (2 sentences)
2. When to Use — symptoms/situations as bullets; when NOT to use
3. Core Pattern — steps, before/after code comparison
4. Common Mistakes — what goes wrong + fix

**Pattern skill** (mental model):
1. Overview — the insight in 1-2 sentences
2. When to Apply — recognition signals
3. The Pattern — clear articulation with one excellent example
4. Counter-Examples — when NOT to apply

**Reference skill** (docs/API):
1. Overview — what's covered
2. Quick Reference — table or bullets for scanning
3. Details — organized by domain, heavy content in `references/` files
4. Common Errors — lookup failures + fixes

### File Structure

```
skill-name/
  SKILL.md          # Required — under 500 lines ideal
  references/       # Heavy docs (>100 lines) — link from SKILL.md
  scripts/          # Reusable tools — reference from SKILL.md
  assets/           # Templates, icons, fonts
```

Keep `SKILL.md` lean. If approaching 500 lines, move content to `references/` and add clear pointers.

---

## Phase 5: Validate Against Standards

Run this before the skill is considered complete:

### Frontmatter
- [ ] `name` matches `[a-z0-9-]` only
- [ ] `description` starts with `"Use when..."`
- [ ] `description` contains zero workflow/process description
- [ ] Total frontmatter under 1024 characters
- [ ] Written in third person

### Content Quality
- [ ] Overview explains WHAT, not HOW the skill works internally
- [ ] No multi-paragraph docstrings or comment blocks
- [ ] No narrative ("In session X, we found...")
- [ ] Flowcharts only for genuinely non-obvious decision points
- [ ] One great example, not many mediocre ones
- [ ] Cross-references use `[[skill-name]]` notation, not `@path` force-loads

### Token Efficiency
- [ ] SKILL.md under 500 lines
- [ ] Heavy reference in `references/` files, not inline
- [ ] No content duplicated from cross-referenced skills

### Security
- [ ] No malware, exploit code, or hidden actions
- [ ] Skill behavior matches its stated description

Flag every failure with the specific fix required before proceeding to testing.

---

## Phase 6: Test the Skill

**Non-negotiable:** Follow RED-GREEN-REFACTOR from `superpowers:writing-skills`.

| Phase | Action |
|-------|--------|
| RED | Run a subagent on a realistic task *without* the skill. Document exact failures and rationalizations verbatim. |
| GREEN | Write/refine the skill. Run the same task *with* the skill. Verify compliance. |
| REFACTOR | Find new loopholes → add explicit counters → retest until bulletproof. |

**Test type by skill category:**
- Discipline skills: 3+ combined pressures (time + sunk cost + authority)
- Technique skills: application scenario + edge case variation
- Reference skills: retrieval test + correct-application test

**Never ship untested.** If you skipped RED, delete the skill and start over.

---

## Interactive Conversation Guide

Use this structure when guiding a user live:

```
"What should this skill enable Claude to do? One sentence."
→ [extract core behavior]

"What would a user type to trigger this? Three different phrasings."
→ [extract trigger signals]

"Is this a technique, pattern, or reference skill?"
→ [select body structure]

[Draft name + description → validate → get approval]

[Draft SKILL.md body → run validation checklist → flag issues]

"Before we ship, let me run a quick baseline to see what happens 
 WITHOUT the skill..."
→ [RED phase — spawn subagent without skill, document failures]

[GREEN phase — write skill, verify compliance]
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Description summarizes the workflow | Rewrite: triggering conditions only, no process |
| Special chars in name (`_`, spaces, `()`) | Rename to `[a-z0-9-]` only |
| Missing `"Use when..."` prefix | Required — it's the signal Claude parses |
| Shipped without RED baseline test | Run it. If skipped, ship is blocked. |
| Inline code that should be a script | Move to `scripts/`, add reference in SKILL.md |
| Force-loading skills with `@path` | Use `[[skill-name]]` cross-references instead |
| Multi-language examples | One excellent example in the most relevant language |
| Description over 500 chars | Trim — only the sharpest trigger conditions survive |
