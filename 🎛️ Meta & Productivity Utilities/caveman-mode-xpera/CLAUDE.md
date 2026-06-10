# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A single Claude Code skill definition. The entire skill lives in `SKILL.md` — one file, no build step, no dependencies.

## Skill Metadata Format

`SKILL.md` uses a YAML frontmatter block followed by Markdown:

```
---
name: <skill-slug>
description: <trigger description — what the user says to invoke it>
---

# Body: rules, format, behavior
```

The `description` field is what Claude Code uses to decide when to auto-invoke the skill. Keep it precise and tied to exact user phrases.

## Editing the Skill

Edit `SKILL.md` directly. No compilation, no install, no restart needed. Changes take effect the next time the skill is invoked.

## Skill Behavior Contract

- **Trigger phrases** (defined in `description`): "go caveman", "caveman mode", "minimize output"
- **Exit phrases**: "normal mode", "verbose", "explain"
- **Core invariant**: strip all conversational wrapper; return only code, configs, diffs, and single-line facts
- **Persistence**: mode stays active until the user explicitly exits it
