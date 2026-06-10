---
name: db-migration-safety
description: Use when writing, reviewing, or generating any database migration — SQL, Prisma, TypeORM, or raw ALTER TABLE. Triggers on "create migration", "alter table", "add column", "drop column", "rename column", "remove field", "backfill data". Also triggers when a migration might run against a live table with existing rows.
---

# DB Migration Safety

## Overview

Zero-downtime migrations require separating **structural changes** from **data changes** and enforcing a strict **code-deploy/migration sequencing order**. A migration that works on an empty dev table can lock a 5M-row production table for minutes or cause in-flight query failures.

## The Two Iron Rules

**Rule 1 — Sequence matters:**
- **Adding** something: migration first → code deploy second
- **Removing** something: code deploy first (stop using it) → migration second (drop it)

**Rule 2 — Never backfill inside a migration transaction:**
- Prisma and TypeORM wrap migration files in a single transaction
- An `UPDATE users SET ...` on 5M rows inside that transaction holds `ACCESS EXCLUSIVE` lock for minutes
- Backfills must run as a separate, out-of-band script before the constraint migration

---

## Dangerous Operations — Stop and Use the Safe Alternative

| Operation | Why dangerous | Safe alternative |
|---|---|---|
| `ADD COLUMN col NOT NULL` | Full table rewrite (PG < 11) or scan to validate constraint | Two-phase: nullable first → backfill outside tx → NOT VALID + VALIDATE |
| `ALTER COLUMN SET NOT NULL` after backfill | Scans entire table even if every row has a value | Add `CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE CONSTRAINT` → then `SET NOT NULL` (instant on PG 12+) |
| `DROP COLUMN` before removing app code | In-flight queries using old column name crash | Deploy code that stops reading/writing column first, then drop |
| `RENAME COLUMN` / `RENAME TABLE` | Old column name vanishes instantly; in-flight queries crash | Expand-contract: add new → dual-write → migrate reads → drop old |
| `CREATE INDEX` (non-concurrent) | `ACCESS EXCLUSIVE` lock blocks all reads and writes | `CREATE INDEX CONCURRENTLY` (Postgres) or `ALGORITHM=INPLACE` (MySQL) |
| `UPDATE table SET col = val` inside migration file | Full-table lock for entire backfill duration | Extract to separate backfill script; run in batches outside transaction |
| `ADD CONSTRAINT` without `NOT VALID` | Full table scan under lock | Add `NOT VALID`, then `VALIDATE CONSTRAINT` in separate step |
| `ALTER COLUMN TYPE` | Full table rewrite | Add new column → backfill → switch app → drop old |

---

## Safe Patterns

### Adding a NOT NULL column with backfill

**Migration 1 — add nullable (deploy immediately):**
```sql
ALTER TABLE "users" ADD COLUMN "display_name" TEXT;
```

**Backfill script — run outside migration, in batches:**
```sql
DO $$
DECLARE
  batch_size INT := 5000;
  last_id BIGINT := 0;
  max_id  BIGINT;
BEGIN
  SELECT MAX(id) INTO max_id FROM users;
  WHILE last_id < max_id LOOP
    UPDATE users
      SET display_name = email
    WHERE id > last_id
      AND id <= last_id + batch_size
      AND display_name IS NULL;
    last_id := last_id + batch_size;
    PERFORM pg_sleep(0.05);
  END LOOP;
END $$;
```

**Migration 2 — enforce NOT NULL (after backfill confirmed complete):**
```sql
-- This migration does not run in a transaction
-- NOT VALID skips scanning existing rows (takes ShareUpdateExclusiveLock)
ALTER TABLE "users"
  ADD CONSTRAINT "users_display_name_not_null"
  CHECK ("display_name" IS NOT NULL)
  NOT VALID;

-- VALIDATE does the scan separately, also non-blocking to writes
ALTER TABLE "users"
  VALIDATE CONSTRAINT "users_display_name_not_null";

-- On PG 12+ this is now instant (trusts the validated check constraint)
ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL;

ALTER TABLE "users" DROP CONSTRAINT "users_display_name_not_null";
```

---

### Removing a column safely

**Step 1 — code deploy:** Remove all reads and writes to `legacy_token` from application code. Deploy and verify.

**Step 2 — migration (after deploy is stable):**
```sql
ALTER TABLE "users" DROP COLUMN IF EXISTS "legacy_token";
```

Never combine these steps in one release.

---

### Renaming a column (expand-contract)

**Migration 1 — add new column (fast, no backfill in migration):**
```sql
ALTER TABLE "users" ADD COLUMN "phone_number" TEXT;
```

**Deploy 1 — dual-write:** Update app to write both `phone` and `phone_number`; read from `phone`.

**Backfill script (out-of-band, after Deploy 1 is stable):**
```sql
DO $$
DECLARE
  batch_size INT := 5000;
  last_id BIGINT := 0;
  max_id  BIGINT;
BEGIN
  SELECT MAX(id) INTO max_id FROM users;
  WHILE last_id < max_id LOOP
    UPDATE users
      SET phone_number = phone
    WHERE id > last_id
      AND id <= last_id + batch_size
      AND phone_number IS NULL;
    last_id := last_id + batch_size;
    PERFORM pg_sleep(0.05);
  END LOOP;
END $$;
```

**Deploy 2 — switch reads:** Update app to read from `phone_number`; still write both.

**Deploy 3 — stop writing old column:** Remove writes to `phone` from app code.

**Migration 2 — drop old column (after Deploy 3 is stable):**
```sql
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";
```

---

### Adding an index

```sql
-- Always CONCURRENTLY — never without it on live tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_display_name"
  ON "users" ("display_name");
```

Note: `CONCURRENTLY` cannot run inside a transaction block. In Prisma, wrap it with `-- This migration does not run in a transaction` or split it to a separate migration with `BEGIN`/`COMMIT` removed.

---

## Prisma-Specific Notes

- Prisma wraps each migration file in a transaction by default — **never put large backfills in migration SQL files**
- To disable the transaction wrapper for a single migration, add at the top of the SQL file:
  ```sql
  -- This migration does not run in a transaction
  ```
  Required for `CREATE INDEX CONCURRENTLY`
- Multi-phase migrations = multiple numbered migration folders; run in sequence across releases
- After schema changes regenerate the client: `prisma generate`

## TypeORM-Specific Notes

- Never use `synchronize: true` in production — it auto-runs DDL without review
- Use `QueryRunner` to split operations across steps within a single migration class
- Test generated migration SQL (`migration:generate`) before running it; always review the output

---

## Pre-Migration Checklist

Before running any migration on a live table:

- [ ] Is the operation in the dangerous-operations table above? → Use safe alternative
- [ ] Does the migration contain a `UPDATE`/`INSERT` on the whole table? → Extract to batched backfill script
- [ ] Is this adding a constraint? → Use `NOT VALID` + `VALIDATE CONSTRAINT`
- [ ] Is this creating an index? → Use `CREATE INDEX CONCURRENTLY`
- [ ] Is this removing a column or table? → Confirm app code no longer references it in the deployed version
- [ ] Is this renaming anything? → Use expand-contract pattern across at least two releases
- [ ] Have you tested against a restored copy of production data (row count, not just schema)?

---

## Red Flags — Stop and Reconsider

- "It's just a quick `DROP COLUMN`" → Was the code deploy done first?
- "We can backfill inside the migration, it's only 2M rows" → 2M rows at 5ms each = 10s lock
- "I'll add the NOT NULL default directly" → On PG < 11 this rewrites the table; on any version it acquires an exclusive lock to validate
- "The rename is instant metadata-only" → The lock is instant; the app crash from broken queries is not
- "I'll just `ALTER COLUMN TYPE`" → This is a full table rewrite; expand-contract required
- "It's a maintenance window, locking is fine" → Zero-downtime means no maintenance windows required
- "TypeORM synchronize handles this" → `synchronize: true` auto-runs DDL in production without review — never use it
- "The table only has 100K rows, it's fast" → 100K rows × 5ms still locks writes for 500ms; batched scripts are always safer

## Rationalization Table

| Excuse | Why it fails |
|---|---|
| "It's a small backfill, I'll do it in the migration" | Any full-table `UPDATE` inside a migration transaction holds `ACCESS EXCLUSIVE` for its entire duration — even 50ms is a dropped connection on a busy table |
| "We're in a maintenance window, so locking is OK" | Zero-downtime means the app runs throughout — there is no window where locking a table is acceptable |
| "DROP COLUMN is metadata-only, it's safe" | The lock is metadata-only; the application crash from broken queries is not. Code deploy must precede the drop |
| "RENAME is instant in Postgres" | Instant lock, instant disappearance of the old name. Any in-flight query referencing the old name fails immediately |
| "NOT VALID then VALIDATE is overly complex" | Without it, `ALTER COLUMN SET NOT NULL` scans every row under a lock. The two-step approach is the correct path |
| "I'll combine the backfill and constraint into one migration" | Violates Rule 2. Backfill runs outside any transaction; constraint migration runs after backfill completes |
| "We can test this on dev with empty tables" | An empty table never reveals lock contention. Always test against a restored copy of production row counts |
