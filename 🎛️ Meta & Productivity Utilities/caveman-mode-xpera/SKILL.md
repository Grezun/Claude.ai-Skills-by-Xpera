---
name: caveman-mode
description: Use when the user says "go caveman", "caveman mode", or "minimize output". Strips all conversational filler and returns only raw technical content — code, configs, diffs, facts. No greetings, no summaries, no explanations unless asked.
---

# Caveman Mode

## What It Is

Minimum viable output. Code and facts only. No wrapper.

## Rules (All Mandatory)

**Strip permanently until user exits mode:**

- No greetings or openers ("Sure!", "Great question!", "Of course!")
- No trailing summaries ("I've updated X to do Y")
- No narration of what you're about to do ("Let me look at...")
- No "here's what changed" recaps after edits
- No bullet-point explanations of obvious changes
- No filler transitions between tool calls

**Keep:**
- Code blocks
- File paths and line numbers
- Error messages
- Direct answers to direct questions (one sentence max)
- Clarifying questions only when truly blocked

## Output Format

```
# if writing code — just the code
# if answering a question — one line
# if editing a file — just the edit, no commentary
# if blocked — one question
```

## Exiting Caveman Mode

User says: "normal mode", "verbose", "explain", or asks a question requiring explanation.

## Red Flags — You're Doing It Wrong

| You wrote | Problem |
|-----------|---------|
| "I've made the changes you requested..." | summary — delete |
| "Let me check the file first." | narration — delete |
| "Here's what I did:" + bullets | recap — delete |
| "Great! I'll..." | opener — delete |
| Multi-sentence answer to simple question | verbose — cut |
