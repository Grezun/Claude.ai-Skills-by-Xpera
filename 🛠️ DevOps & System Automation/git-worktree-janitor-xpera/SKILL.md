---
name: git-worktree-janitor-xpera
description: Use when asked to "clean up my branch", "prepare a pull request", "get this ready for review", or when the working tree has untracked files and uncommitted changes that need organizing before submission.
---

# git-worktree-janitor

## Overview

Structured five-phase workflow for cleaning up a messy local git environment and producing a PR-ready branch — including conventional commits, explicit noise exclusion, and a multi-file diff document that feeds directly into the PR description and code review.

**The diff documentation step is mandatory.** Without it, reviewers lack a navigable map of what changed and why.

## Workflow

```
AUDIT → TRIAGE → COMMIT → DOCUMENT → PR
```

### Phase 1 — AUDIT

Run all four commands before touching anything:

```bash
git status                          # full working tree state
git diff --stat                     # line counts per changed file
git log --oneline origin/main..HEAD # commits already on branch
git stash list                      # any stashed work?
```

Also verify the branch is up-to-date:

```bash
git fetch origin
git log --oneline HEAD..origin/main # if non-empty, rebase first
```

If behind: `git rebase origin/main` before proceeding.

### Phase 2 — TRIAGE

Classify every file from `git status` into one of three buckets:

| Bucket | Contents | Action |
|--------|----------|--------|
| **COMMIT** | Source, tests, docs, configs that belong in the repo | Stage and commit |
| **IGNORE** | `.env*`, `*.log`, `.DS_Store`, personal notes, build artifacts | Add to `.gitignore` first, then confirm they don't appear in `git status` |
| **DEFER** | Incomplete work, unrelated experiments | Stash (`git stash push -m "label" <files>`) or move off-tree (`mv file ~/Desktop/`) |

**Never use `git add -A` or `git add .`** — always name files explicitly.

Check `.gitignore` before appending:

```bash
grep -q "\.env" .gitignore || echo ".env*" >> .gitignore
grep -q "\.DS_Store" .gitignore || echo ".DS_Store" >> .gitignore
grep -q "debug\.log" .gitignore || echo "debug.log" >> .gitignore
```

### Phase 3 — COMMIT

Group COMMIT-bucket files by concern. Each commit = one logical unit.

**Run tests before first commit:**
```bash
npm test   # or: pytest / cargo test / go test ./...
```
Do not commit if tests fail.

**Conventional commit format:**
```
<type>(<scope>): <imperative summary under 72 chars>

<optional body: what changed and why, not how>
```

| Type | When |
|------|------|
| `feat` | New capability |
| `fix` | Bug or security correction |
| `refactor` | Restructure without behavior change |
| `test` | Test-only changes |
| `docs` | Documentation only |
| `chore` | Deps, config, tooling |

Always pass message via heredoc:

```bash
git commit -m "$(cat <<'EOF'
fix(auth): migrate session tokens to httpOnly cookies

Replaces localStorage approach with httpOnly cookie sessions to prevent
XSS token theft. Adds crypto utility for secure token generation.
EOF
)"
```

Order commits: highest-risk/most-foundational first. Docs and dependency bumps are **separate commits** — never combine them with source changes.

### Phase 4 — DOCUMENT (mandatory)

Generate a multi-file diff document. This becomes the PR description and a permanent record of what changed.

Structure:

```markdown
## Diff Summary — <branch-name>

### Changed files

| File | Type | Summary |
|------|------|---------|
| src/auth/middleware.ts | modified | Replaces localStorage sessions with httpOnly cookies |
| src/auth/oauth.ts | added | New OAuth 2.0 provider module |
| src/utils/crypto.ts | added | Token generation utility for cookie sessions |
| docs/auth-flow.md | added | Documents the new OAuth flow |
| package.json | modified | Bumps eslint from 8.x to 9.x |

### Commits in this branch

1. `fix(auth)` — migrate session tokens to httpOnly cookies
2. `feat(auth)` — add OAuth 2.0 provider support
3. `feat(users)` — support avatar uploads on user profiles
4. `chore(deps)` — bump dev dependency versions

### Reviewer focus

- `src/auth/middleware.ts` — highest-risk, verify cookie flags (Secure, SameSite)
- `src/auth/oauth.ts` — new module, verify authorization code flow correctness
- `src/utils/crypto.ts` — verify entropy source and algorithm

### Excluded files

| File | Reason |
|------|--------|
| `.env.local` | Local secrets — added to `.gitignore` |
| `debug.log` | Throwaway log — added to `.gitignore` |
| `TODO.md` | Personal notes — not project material |
```

Paste this document into the PR body verbatim.

### Phase 5 — PR

```bash
git push -u origin <branch-name>

gh pr create \
  --base main \
  --title "<type>: <concise description under 70 chars>" \
  --body "$(cat <<'EOF'
<paste Phase 4 diff document here>

## Test plan
- [ ] All tests pass locally
- [ ] Manual smoke test of affected flows
- [ ] Confirm no secrets appear in any commit (`git log -p | grep -i "secret\|password\|token\|key"`)
EOF
)"
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `git add -A` staging `.env` files | Always name files explicitly; triage first |
| One giant commit for all changes | Group by concern — three focused commits beat one blob |
| Skipping diff documentation | Phase 4 is non-negotiable; reviewers need the map |
| Committing with failing tests | Run tests before Phase 3 |
| Not rebasing before committing | Audit phase includes `git log HEAD..origin/main` check |
| Vague commit messages ("fixes", "WIP update") | Use conventional format with scope and imperative body |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The PR title explains the changes" | Reviewers need a file-level map with summaries. Phase 4 is mandatory. |
| "It's just docs and a dep bump, one commit is fine" | Docs and deps are separate concerns and separate bisect points. Two commits. |
| "git add -A is fine, I'll check git status after" | Secrets staged in milliseconds can't be unstaged from remote history. Name files explicitly. |
| "Tests are probably fine, I'll check after the PR opens" | Failing CI delays merge and signals careless prep. Run tests before Phase 3. |
| "The branch is only one commit behind, rebase is overkill" | Even one divergent commit creates a conflict surface during review. Always rebase first. |
| "TODO.md is just notes, nobody will look at it" | Personal files in commit history are noise reviewers must filter. Move it off-tree. |

## Red Flags — STOP

- About to run `git add .` → **name files explicitly**
- Skipping diff documentation because "the PR title explains it" → **Phase 4 is mandatory**
- About to combine docs + deps in one commit → **two separate commits**
- Tests failing but "it's a small change" → **fix tests first**
- `.env.local` not yet in `.gitignore` → **add before staging anything**
- Branch is behind `origin/main` → **rebase before committing**
