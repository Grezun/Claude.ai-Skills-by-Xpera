# Internal Comms — Before/After Examples

## Incident Alert

**BAD (what Claude does without this skill):**

> Hi team, I wanted to let everyone know that we're currently experiencing some issues with our database service. Our engineering team is aware of the situation and is actively working to resolve it. We apologize for any inconvenience this may cause. We will keep you updated as the situation develops. Thank you for your patience.

**GOOD:**

```
:fire: *INCIDENT: Database — Connection pool exhausted*

*Status:* 🔴 Investigating
*Impact:* All write operations failing; ~2,400 affected users
*Started:* 14:32 PT
*IC:* @sarah

[→ #incident-2024-db](TBD) | [→ Runbook](TBD) | [→ Status page](TBD)
```

---

## Post-Mortem

**BAD:**

> ## Database Outage Post-Mortem
>
> On June 10th, we experienced a significant outage affecting our database service. This document outlines what happened, why it happened, and what we're doing to prevent it in the future.
>
> **Background:** Our database connection pool became exhausted due to a combination of factors...

**GOOD:**

```
:wrench: *POST-MORTEM: Database connection pool exhaustion* | Jun 10, 2026 | SEV2

*Summary:* A misconfigured connection limit in the v2.4 deploy caused pool exhaustion at peak load, taking down all write operations for 47 minutes. Rolling back the deploy resolved the issue.

*Timeline*
• 14:32 — Alerts fire; write error rate hits 100%
• 14:38 — IC declared; @sarah paged
• 14:51 — Root cause identified: connection_limit=50 (was 200)
• 15:19 — Rollback to v2.3 complete; writes restored

*Root cause:* connection_limit misconfigured to 50 in v2.4 deploy config
*Impact:* 2,400 users; all writes failed; 47 min duration
*Resolution:* Rolled back to v2.3; config fix in v2.5

*Action items*
• [ ] @dev-infra — Add connection_limit to deploy checklist → [→ INFRA-441](TBD)
• [ ] @platform — Alert on pool utilization > 80% → [→ INFRA-442](TBD)

[→ Full doc](TBD) | [→ Monitoring](TBD) | [→ On-call log](TBD)
```

---

## Executive Update

**BAD:**

> Hi leadership, I wanted to provide an update on the Atlas project. The team has been making great progress over the past two weeks. We successfully completed the API integration milestone and are on track to hit our Q3 targets. There are a few things I'd like to flag for your awareness...

**GOOD:**

```
:bar_chart: *Atlas — Executive Update* | Jun 10, 2026

*TL;DR:* API integration shipped; on track for Q3 launch. One decision needed on vendor contract.

*Status:* 🟢 On track
*Key metrics:* Milestone completion: 4/6 | Budget: $420K / $500K | Eng velocity: +12% WoW

*Since last update*
• Shipped API integration (2 days early)
• Resolved payment provider latency issue
• Onboarded 3 beta customers

*Decisions needed*
• Approve Vendor X contract extension by Jun 17 — @cfo owns → [→ Contract draft](TBD)

*Next milestone:* Jul 1 — Beta to GA

[→ Roadmap](TBD) | [→ Dashboard](TBD) | [→ Spec](TBD)
```

---

## Announcement

**BAD:**

> Hey everyone! We're excited to announce that we'll be rolling out our new deployment pipeline next Tuesday. This has been a long time coming and the infrastructure team has worked really hard on it. The new system will be faster, more reliable, and easier to use. Please read the attached documentation for more information.

**GOOD:**

```
:rocket: *New deployment pipeline goes live Jun 17*

*What:* Automated blue-green deploys replace manual process; avg deploy time drops from 12 min → 90 sec.
*Who's affected:* All engineers who deploy to production
*Action required:* Read the migration guide and test your service by Jun 16 EOD

[→ Migration guide](TBD) | [→ Runbook](TBD) | [→ #eng-deployments](TBD)
```

---

## Project Sync

**BAD:**

> Weekly update for the Atlas project:
>
> This week the team completed work on the API integration and made good progress on the testing phase. We're feeling good about our timeline. Next week we plan to focus on the beta customer onboarding process.

**GOOD:**

```
:arrows_counterclockwise: *Atlas Sync* | Jun 10, 2026

*Progress:* Shipped API integration; 3 beta customers onboarded; payment latency fix deployed
*Blockers:* Vendor contract unsigned — blocking GA date; @cfo to resolve by Jun 17
*Next:* GA readiness review (Jun 15), load testing (Jun 12–14), docs finalization

[→ Board](TBD) | [→ Spec](TBD) | [→ Notes](TBD)
```
