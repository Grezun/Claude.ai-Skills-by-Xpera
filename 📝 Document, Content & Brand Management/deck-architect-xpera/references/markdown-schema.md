# Corporate Markdown Schema for deck-architect

Expected input format for `md_to_outline.py` and `build_deck.py`.

## Heading Hierarchy

```markdown
# Deck Title
## Section Name
### Slide Title
#### Sub-point (treated as indented bullet)
```

| Level | Maps to | Slide type |
|-------|---------|------------|
| `#`   | Deck title (cover slide) | `cover` |
| `##`  | Section divider slide | `section` |
| `###` | Content slide | `content` (default) |
| `####`+ | Indented sub-bullet within current `###` slide | — |

## Optional Frontmatter

```yaml
---
title: Q3 Strategy Review
subtitle: Finance & Operations
date: 2026-06-10
author: Alex
---
```

`title` and `subtitle` override the `# Heading` value for the cover slide if present.

## Slide Type Overrides

Add a hint comment immediately after a `###` heading to override the inferred slide type:

```markdown
### Key Quote
<!-- type: callout -->
> "We ship or we sink." — CEO
```

Supported type hints: `content` · `callout` · `image` · `data` · `section`

## Bullets

Standard Markdown bullets become body placeholder text, one paragraph per bullet:

```markdown
### Our Goals
- Grow ARR by 40%
- Launch in 3 new markets
- Reduce churn below 5%
```

Nested bullets (two spaces or tab indent) are preserved as sub-bullets.

## Callout / Quote Slides

A `> blockquote` under a `###` heading automatically sets the slide type to `callout`:

```markdown
### Customer Voice
> "This product changed how we work."
> — Head of Operations, Acme Corp
```

## Image Slides

An `![]()` image reference under a `###` sets type to `image`:

```markdown
### Product Screenshot
![Dashboard overview](assets/dashboard.png)
Brief caption line beneath the image.
```

The image path is stored in the outline; `build_deck.py` does not embed images automatically — handle image insertion manually after the initial build or extend `build_deck.py` for your template's image placeholder index.

## Data / Table Slides

A Markdown table under a `###` sets type to `data`, which maps to a two-column or comparison layout:

```markdown
### Before vs After
| Metric | Before | After |
|--------|--------|-------|
| Deploy time | 4 hours | 8 minutes |
| Error rate | 12% | 0.3% |
```

Table content is not auto-populated into placeholders — use it as a signal to choose a two-column layout, then populate cells manually or extend `build_deck.py`.

## Section Without a Divider Slide

Leave `##` title blank to group slides without emitting a section divider:

```markdown
##
### Hidden Lead-in Slide
Content here won't be preceded by a section header slide.
```

## Full Example

```markdown
---
title: 2026 Product Strategy
subtitle: All-Hands — June 2026
---

# 2026 Product Strategy

## Vision

### Where We're Going
- Become the category leader in AI-assisted workflows
- 10× the number of integrations
- Reach 1M active users

### One Thing to Remember
> "Simple tools. Real outcomes."

## Roadmap

### Q3 Priorities
- Ship the mobile app
- Launch the API marketplace
- Close Series B

### Timeline
| Quarter | Milestone |
|---------|-----------|
| Q3 2026 | Mobile app GA |
| Q4 2026 | API marketplace |
| Q1 2027 | Series B close |

## Team

### Who We Are
- 42 people across 8 countries
- Growing 15% QoQ
```
