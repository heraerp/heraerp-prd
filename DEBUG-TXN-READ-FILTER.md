# Debug: Transaction READ Filter Issue

## Problem Statement

Both functions look correct:
- ✅ Orchestrator passes `include_deleted` correctly
- ✅ `hera_txn_read_v1` has the filter `AND (p_include_deleted OR t.transaction_status <> 'voided')`

But Test 4 still fails: Normal READ finds voided transactions.

## Hypothesis: NULL vs 'voided'

**Potential Issue**: If `transaction_status` is NULL instead of 'voided', the comparison fails.

```sql
-- If transaction_status is NULL:
NULL <> 'voided'  →  NULL (not TRUE, not FALSE)
```

In SQL, `NULL <> 'voided'` returns `NULL`, which is treated as `FALSE` in a WHERE clause.

## Investigation Needed

**Check 1**: What does `hera_txn_void_v1` actually set?
- Does it set `transaction_status = 'voided'`?
- Or does it set something else?

**Check 2**: What's in the database after VOID?
```sql
SELECT id, transaction_status, transaction_code
FROM universal_transactions
WHERE id = '67564351-f0aa-4c5a-906e-c1faadb398be';
```

**Check 3**: Add defensive NULL handling
```sql
-- Current
AND (p_include_deleted OR t.transaction_status <> 'voided')

-- More defensive
AND (p_include_deleted OR COALESCE(t.transaction_status, '') <> 'voided')
```

## Quick Test

Run this after VOID to see actual status:

```sql
-- After running test
SELECT
  id,
  transaction_status,
  transaction_status IS NULL AS status_is_null,
  transaction_status <> 'voided' AS filter_result,
  p_include_deleted OR (transaction_status <> 'voided') AS would_return
FROM universal_transactions
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
ORDER BY created_at DESC
LIMIT 5;
```

## Recommended Fix

**Option 1**: Make comparison NULL-safe
```sql
AND (p_include_deleted OR COALESCE(t.transaction_status, 'active') <> 'voided')
```

**Option 2**: Check for both NULL and 'voided'
```sql
AND (p_include_deleted OR (t.transaction_status IS NULL OR t.transaction_status <> 'voided'))
```

**Option 3**: Use positive check
```sql
AND (p_include_deleted OR t.transaction_status IN ('active', 'completed', 'pending', 'draft'))
```

## Next Steps

1. Check what `hera_txn_void_v1` actually does
2. Query database to see actual transaction_status values
3. Update filter to be NULL-safe if needed
