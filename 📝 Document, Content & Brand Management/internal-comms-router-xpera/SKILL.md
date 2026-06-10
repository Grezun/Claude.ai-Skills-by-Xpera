---
name: internal-comms-router
description: Use when asked to draft a Slack announcement, incident alert, post-mortem, executive update, or project sync. Triggers include "write an incident report," "send a team update," "draft an announcement," "post-mortem write-up," or any internal corporate message needing a precise, scannable format.
---

# Internal Comms Router

## Overview

Route the request to the right format, then apply it exactly. Every output is concise, link-heavy, and scannable in under 30 seconds. No prose paragraphs. No generic markdown headers. Slack-native formatting only.

## Routing Table

| Trigger | Format |
|---|---|
| "Slack announcement," "tell the team," "channel post" | [Announcement](#announcement) |
| "Incident," "outage," "page," "alert," real-time | [Incident Alert](#incident-alert) |
| "Post-mortem," "retrospective," "root cause," after resolution | [Post-Mortem](#post-mortem) |
| "Executive update," "leadership update," "stakeholder update" | [Executive Update](#executive-update) |
| "Project sync," "status update," "weekly update," "standup" | [Project Sync](#project-sync) |

If the type is ambiguous, ask one question: *"Is this for an ongoing incident, a post-mortem, an executive audience, or a general team update?"*

## Slack Formatting Rules

These apply to ALL formats:

- Bold with `*asterisks*`, not `**double**`
- Italic with `_underscores_`
- Bullet with `•` (not `-` or `*`)
- Links inline, next to the relevant item: `[→ Ticket](url)` — never footnoted
- If a URL is unknown, write `[→ Ticket](TBD)` — never omit the link placeholder
- No `##` headers — use `*Bold label:*` as section markers
- Emoji at the start of the message to signal type; choose one that fits

## Formats

### Announcement

Use for: general team/org updates, policy changes, new hires, launches.

```
:emoji: *TITLE* — one-sentence summary

*What:* [1–2 sentences]
*Who's affected:* [scope]
*Action required:* [none / what + deadline]

[→ Doc](url) | [→ Ticket](url) | [→ Slack thread](url)
```

### Incident Alert

Use for: real-time during an active incident. Short, factual, updated in-thread.

```
:fire: *INCIDENT: [System] — [Brief description]*

*Status:* 🔴 Investigating / 🟡 Mitigating / 🟢 Resolved
*Impact:* [who/what is affected, scale]
*Started:* [HH:MM TZ]
*IC:* @name

[→ Incident channel](url) | [→ Runbook](url) | [→ Status page](url)
```

Update the same thread; don't post new messages. Change Status emoji as it evolves.

### Post-Mortem

Use for: after an incident is resolved. Written summary for the record.

```
:wrench: *POST-MORTEM: [Title]* | [Date] | SEV[1–3]

*Summary:* [2–3 sentences: what happened, impact, how it was resolved]

*Timeline*
• [HH:MM] — [event]
• [HH:MM] — [event]
• [HH:MM] — resolved

*Root cause:* [1 sentence]
*Impact:* [affected users / systems / duration]
*Resolution:* [what fixed it]

*Action items*
• [ ] @owner — [task] → [→ Ticket](url)
• [ ] @owner — [task] → [→ Ticket](url)

[→ Full post-mortem doc](url) | [→ Monitoring](url) | [→ On-call log](url)
```

### Executive Update

Use for: upward comms to leadership or cross-functional stakeholders.

```
:bar_chart: *[Project] — Executive Update* | [Date]

*TL;DR:* [1–2 sentences: status and the one thing they need to know]

*Status:* 🟢 On track / 🟡 At risk / 🔴 Blocked
*Key metrics:* [metric]: [value] | [metric]: [value]

*Since last update*
• [accomplishment]
• [accomplishment]

*Decisions needed*
• [decision + deadline + owner]

*Next milestone:* [date] — [deliverable]

[→ Roadmap](url) | [→ Dashboard](url) | [→ Spec](url)
```

If no decisions are needed, omit that section entirely.

### Project Sync

Use for: recurring team status posts, standups, weekly updates.

```
:arrows_counterclockwise: *[Project] Sync* | [Date]

*Progress:* [what shipped or was completed]
*Blockers:* [none / specific blocker + @owner]
*Next:* [top 1–3 priorities this week]

[→ Board](url) | [→ Spec](url) | [→ Notes](url)
```

## Information Gathering

Draft immediately with `[TBD]` placeholders for missing info. Never ask more than two questions before producing a draft.

Questions worth asking:
- Severity / scope (if not stated)
- The primary link (ticket, doc, or runbook)

Questions NOT worth asking:
- Tone (always direct and factual)
- Audience (routes determine audience)
- Length (always short)

## Common Mistakes

| Mistake | Fix |
|---|---|
| Writing prose paragraphs | Use the template. Every time. |
| Omitting links because "user didn't provide them" | Use `[→ Label](TBD)` placeholder |
| Using `##` markdown headers | Use `*Bold label:*` |
| Asking for format preference | Route from the table; don't ask |
| Writing > 150 words | Cut to template length |
| Adding formal opening/closing ("Hope this finds you well") | Delete it |

## Red Flags — STOP and apply the template

- You wrote a paragraph that starts with "I" or "We are pleased to"
- The output has `##` or `###` in it
- There are no inline links (not even `TBD` placeholders)
- You asked more than two clarifying questions before drafting
- The output is longer than the template allows

**All of these mean: delete the draft and start from the template.**
