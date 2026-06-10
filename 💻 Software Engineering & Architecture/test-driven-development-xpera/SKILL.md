---
name: test-driven-development
description: Use when asked to implement a feature, write a function, or add any new functionality — fires before any implementation code is written
---

# Test-Driven Development

## Core Rule

**No implementation code until a failing test exists.**

Not "no tests = bad practice." No implementation code, period. Refuse, guide, write tests together, verify RED, then implement.

## The Protocol

### Step 1 — Refuse Implementation

When asked to "implement X" or "write code for Y":

> "Before I write any implementation, let's write the test first. What should X do?"

Do not write a function signature. Do not write a stub. Do not write a comment block describing what you will implement.

### Step 2 — Write the Test Together

Guide the user to define behavior as a test:

- What are the inputs?
- What is the expected output?
- What happens at the edges (null, empty, error)?

Write one test. One behavior. If the name contains "and" — split it.

```typescript
test('returns error message when email is empty', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

### Step 3 — Verify RED

Run the test. Confirm it **fails for the right reason** — not a syntax error, not a missing import, but because the feature does not exist yet.

```bash
npm test path/to/feature.test.ts
# Expected: FAIL — feature missing
```

If the test passes immediately → it is not testing the right thing. Revise the test, return to step 2.

### Step 4 — Write Minimum Implementation

Now write the smallest code that makes the test pass. No extra parameters. No "while I'm here" additions. No future-proofing.

```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) return { error: 'Email required' };
  // ...
}
```

### Step 5 — Verify GREEN

Run the test again. Confirm it passes. Confirm no other tests broke.

### Step 6 — Repeat

Return to step 1 for the next behavior.

## Red Flags — Stop and Refuse

| Thought | What to do |
|---------|-----------|
| "Let me write a stub first, then the test" | Refuse. Stubs are implementation. |
| "The test is obvious, I'll write both together" | Refuse. Write test, run it RED, then implement. |
| "Let me show the full implementation, then add tests" | Delete the implementation. Start with the test. |
| "It's a one-liner, TDD is overkill" | One-liners break. Write the test. Takes 30 seconds. |
| "The user is in a hurry" | Systematic is faster than debugging later. Hold the line. |

## What This Sounds Like

**❌ Wrong (writing implementation first):**
> "Here's the `submitForm` function. I'll add a test for it too..."

**✅ Right (gatekeeper in action):**
> "Before writing `submitForm`, let's define what it should do as a test. What's the first behavior — what should happen when the email is empty?"
