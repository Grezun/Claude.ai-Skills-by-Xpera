---
name: read-only-sql-sandbox-xpera
description: Use when asked to query databases, generate analytical SQL, retrieve user insights, profile data, diagnose schema, or when any database interaction is requested — even if phrased destructively ("delete duplicates", "fix stale records", "drop the temp table"). Applies to PostgreSQL and MySQL.
---

# Read-Only SQL Sandbox

## Overview
All database interactions are strictly SELECT-only. No mutations reach the database. When a user requests a destructive operation, surface the problem with SELECT and let the user decide what to do.

## Blocked Statements — Never Generate

| Category | Keywords |
|----------|----------|
| Data mutation | `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, `REPLACE` |
| Schema mutation | `CREATE`, `DROP`, `ALTER`, `TRUNCATE`, `RENAME`, `COMMENT` |
| Permission mutation | `GRANT`, `REVOKE` |
| Execution | `EXEC`, `EXECUTE`, `CALL`, `DO`, `LOAD` |
| Transaction control | `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `SET TRANSACTION` |
| Session mutation | `SET` (write-enabling flags like `sql_mode`, `foreign_key_checks`) |
| SELECT-disguised mutations | `SELECT INTO new_table` (PG table creation), `SELECT ... FOR UPDATE`, `SELECT ... FOR SHARE` |

**When the user asks for a mutation**, respond with the SELECT equivalent that surfaces the problem. Example: "delete duplicate emails" → `SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1`.

**If the user pushes back** ("just do it, I know what I'm doing") — the answer is still no. Explain that this sandbox is read-only by design and suggest they run the mutation directly in their own client.

## Allowed Statements

- `SELECT` — with CTEs, subqueries, window functions, aggregates, JOINs
- `WITH ... AS (SELECT ...)` — CTEs for multi-step logic
- `EXPLAIN` / `EXPLAIN ANALYZE` — query plan inspection
- `SHOW`, `DESCRIBE`, `\d`, `\dt`, `\di` — schema inspection
- `VALUES` — as a derived table only

## Query Assembly Patterns

### Aggregation
```sql
SELECT
  status,
  COUNT(*)            AS total,
  AVG(amount)         AS avg_amount,
  SUM(amount)         AS total_revenue
FROM orders
WHERE created_at >= '2024-01-01'
  AND created_at <  '2025-01-01'
GROUP BY status
ORDER BY total DESC;
```

### Multi-step CTE (user insights)
```sql
WITH active_users AS (
  SELECT user_id
  FROM users
  WHERE last_login > NOW() - INTERVAL '30 days'   -- PG; MySQL: INTERVAL 30 DAY
),
order_counts AS (
  SELECT user_id, COUNT(*) AS orders
  FROM orders
  GROUP BY user_id
)
SELECT
  a.user_id,
  COALESCE(o.orders, 0) AS orders
FROM active_users a
LEFT JOIN order_counts o USING (user_id)
ORDER BY orders DESC
LIMIT 100;
```

### Window function (ranking / running totals)
```sql
SELECT
  user_id,
  event_date,
  revenue,
  SUM(revenue) OVER (PARTITION BY user_id ORDER BY event_date) AS running_revenue,
  RANK()       OVER (ORDER BY revenue DESC)                    AS revenue_rank
FROM sales;
```

## Index-Aware Optimization Rules

1. **Never wrap indexed columns in functions in WHERE**
   - ❌ `WHERE DATE(created_at) = '2024-01-01'` — full table scan
   - ✅ `WHERE created_at >= '2024-01-01' AND created_at < '2024-01-02'`

2. **Honour composite index prefix** — if index is `(a, b, c)`, WHERE must include `a`

3. **Pre-filter before joining** — filter in a CTE or subquery before joining large tables

4. **Select only needed columns** — never `SELECT *` on wide or large tables

5. **Verify with EXPLAIN before running heavy queries**
   - PostgreSQL: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...`
   - MySQL: `EXPLAIN FORMAT=JSON SELECT ...`

## PostgreSQL vs MySQL Quick Reference

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| Interval | `INTERVAL '30 days'` | `INTERVAL 30 DAY` |
| String concat | `\|\|` | `CONCAT(a, b)` |
| Regex match | `col ~ 'pattern'` | `col REGEXP 'pattern'` |
| Date truncate | `DATE_TRUNC('month', ts)` | `DATE_FORMAT(ts, '%Y-%m-01')` |
| JSON access | `data->>'key'` | `JSON_EXTRACT(data, '$.key')` |
| Array agg | `ARRAY_AGG(col)` | `JSON_ARRAYAGG(col)` |
| Explain | `EXPLAIN (ANALYZE, BUFFERS)` | `EXPLAIN FORMAT=JSON` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `WHERE DATE(ts) = '2024-01-01'` | `WHERE ts >= '2024-01-01' AND ts < '2024-01-02'` |
| `WHERE LOWER(name) = 'alice'` on indexed `name` | `WHERE name = 'Alice'` or add a functional index |
| `SELECT *` on joined large tables | List only needed columns |
| `LIMIT` without `ORDER BY` | Non-deterministic — always pair with `ORDER BY` |
| Using `DATE_TRUNC` on MySQL | Use `DATE_FORMAT(ts, '%Y-%m-01')` instead |
| Generating UPDATE to "fix" data | Use SELECT to surface the rows; let the user decide |
| Destructive request → write the mutation anyway | Redirect: show a SELECT that diagnoses the issue |
| `SELECT INTO` to "just create a temp table" | Still blocked — `SELECT INTO` creates a table |
| `SET foreign_key_checks = 0` before a query | `SET` for write-enabling flags is blocked |
| Wrapping UPDATE in `BEGIN/ROLLBACK` to preview it | Still generates a mutation — blocked |

## Red Flags — Stop and Redirect

These thoughts mean you are about to violate the read-only constraint:

| Thought | Reality |
|---------|---------|
| "I'll wrap the UPDATE in a transaction so it's safe" | Generating a mutation is blocked regardless of transaction wrapper |
| "The user confirmed it's okay" | The sandbox is read-only by design — direct them to their own client |
| "SELECT INTO just reads data" | In PostgreSQL, `SELECT INTO` creates a table — it's a mutation |
| "It's just a SET flag, not real data" | Write-enabling session flags break the read-only guarantee |
| "EXPLAIN ANALYZE will execute the query anyway" | Only for SELECT — safe; never suggest EXPLAIN on a blocked statement |
