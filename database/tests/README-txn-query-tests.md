# HERA Transaction Query v1 - Test Suite

## Quick Start

### 1. Update Organization UUID

Edit `test-hera-txn-query-v1.sql` and replace `YOUR-ORG-UUID` with your actual organization UUID:

```bash
# Find your organization UUID
psql $DATABASE_URL -c "SELECT id, organization_name FROM core_organizations LIMIT 5;"

# Update the test file
sed -i "s/YOUR-ORG-UUID/your-actual-uuid-here/g" database/tests/test-hera-txn-query-v1.sql
```

### 2. Run Tests

```bash
# Full test suite
psql $DATABASE_URL -f database/tests/test-hera-txn-query-v1.sql

# Or run interactively
psql $DATABASE_URL
\i database/tests/test-hera-txn-query-v1.sql
```

### 3. Quick Smoke Test

```bash
psql $DATABASE_URL -c "
SELECT
  (result->>'success')::boolean as success,
  (result->'data'->>'total')::bigint as total_transactions
FROM (
  SELECT hera_txn_query_v1(
    'YOUR-ORG-UUID'::uuid,
    '{\"limit\": 10}'::jsonb
  ) as result
) t;
"
```

---

## Test Coverage

### Phase 1: Basic Functionality (5 tests)
- ✅ Basic query with defaults
- ✅ Pagination (limit/offset)
- ✅ Date range filtering
- ✅ Empty result handling
- ✅ Invalid organization UUID

### Phase 2: Filters (8 tests)
- ✅ Transaction type filter
- ✅ Single status filter
- ✅ Multi-status filter (comma-separated)
- ✅ Smart code filter
- ✅ Transaction code filter
- ✅ Source entity filter
- ✅ Target entity filter
- ✅ Amount range filter

### Phase 3: Advanced Features (6 tests)
- ✅ Text search (ILIKE)
- ✅ Cursor pagination
- ✅ Dynamic sorting (date/amount/code)
- ✅ Include transaction lines
- ✅ Complex combined filters
- ✅ Performance analysis (EXPLAIN)

### Phase 4: Error Handling (4 tests)
- ✅ Invalid UUID handling
- ✅ Cursor + offset conflict
- ✅ Invalid sort parameters
- ✅ Malformed JSON

**Total: 23 test cases**

---

## Example Queries

### Basic Query
```sql
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{}'::jsonb
);
```

### Date Range + Status Filter
```sql
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-02-01T00:00:00Z",
    "transaction_status": "posted,approved",
    "limit": 50
  }'::jsonb
);
```

### Text Search
```sql
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "search": "INV-2024",
    "limit": 20
  }'::jsonb
);
```

### With Transaction Lines
```sql
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "include_lines": true,
    "limit": 10
  }'::jsonb
);
```

### Cursor Pagination (Infinite Scroll)
```sql
-- Page 1
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{"limit": 100}'::jsonb
);
-- Get last ID from results

-- Page 2
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "after_id": "last-txn-id-from-page-1",
    "limit": 100
  }'::jsonb
);
```

### Complex Filter
```sql
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "transaction_type": "sale",
    "transaction_status": "posted",
    "amount_min": 1000,
    "date_from": "2024-01-01T00:00:00Z",
    "sort_by": "amount",
    "sort_dir": "DESC",
    "limit": 50
  }'::jsonb
);
```

---

## Performance Benchmarks

### Expected Response Times

| Query Type | Target | Acceptable |
|------------|--------|------------|
| Basic query (date range) | < 50ms | < 200ms |
| With filters | < 100ms | < 300ms |
| Text search | < 150ms | < 500ms |
| With lines (10 txns) | < 100ms | < 400ms |
| Cursor pagination | < 20ms | < 100ms |

### Verify Performance
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT hera_txn_query_v1(
  'org-uuid'::uuid,
  '{
    "date_from": "2024-01-01T00:00:00Z",
    "limit": 100
  }'::jsonb
);
```

Look for:
- ✅ "Index Scan" (good)
- ❌ "Seq Scan" (bad - missing index)
- Total execution time < 200ms

---

## Troubleshooting

### Test Failure: "function does not exist"
```bash
# Verify function is deployed
psql $DATABASE_URL -c "\df hera_txn_query_v1"

# Re-deploy if needed
psql $DATABASE_URL -f path/to/hera_txn_query_v1.sql
```

### Test Failure: No data returned
```bash
# Verify transactions exist
psql $DATABASE_URL -c "
SELECT COUNT(*) as transaction_count
FROM universal_transactions
WHERE organization_id = 'YOUR-ORG-UUID'::uuid;
"

# Verify not all voided
psql $DATABASE_URL -c "
SELECT transaction_status, COUNT(*)
FROM universal_transactions
WHERE organization_id = 'YOUR-ORG-UUID'::uuid
GROUP BY transaction_status;
"
```

### Slow Performance
```bash
# Check if indexes exist
psql $DATABASE_URL -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'universal_transactions'
ORDER BY indexname;
"

# Create missing indexes
psql $DATABASE_URL -f database/tests/test-hera-txn-query-v1-indexes.sql

# Refresh stats
psql $DATABASE_URL -c "ANALYZE universal_transactions;"
```

### Cursor pagination error
```bash
# Verify transaction exists
psql $DATABASE_URL -c "
SELECT id, transaction_code, transaction_date
FROM universal_transactions
WHERE id = 'CURSOR-UUID'::uuid;
"
```

---

## Common Issues

### Issue: "Cannot use both after_id and offset"
**Cause:** Both cursor and offset pagination used simultaneously
**Solution:** Use either `after_id` (cursor) OR `offset` (page), not both

### Issue: Slow text search
**Cause:** Missing trigram (GIN) indexes
**Solution:** Run index creation script with pg_trgm indexes

### Issue: No results with multi-status
**Cause:** Invalid status value in comma-separated list
**Solution:** Check valid statuses: `draft`, `approved`, `posted`, `voided`

### Issue: Lines not included
**Cause:** `include_lines` flag not set
**Solution:** Add `"include_lines": true` to filters JSON

---

## CI/CD Integration

### Add to Pipeline
```yaml
# .github/workflows/test-db-functions.yml
- name: Test Transaction Query Function
  run: |
    export DATABASE_URL="${{ secrets.SUPABASE_DB_URL }}"
    export ORG_ID="${{ secrets.TEST_ORG_UUID }}"
    sed -i "s/YOUR-ORG-UUID/$ORG_ID/g" database/tests/test-hera-txn-query-v1.sql
    psql $DATABASE_URL -f database/tests/test-hera-txn-query-v1.sql
```

### Automated Smoke Test
```bash
#!/bin/bash
# test-txn-query-smoke.sh

ORG_ID="${1:-YOUR-ORG-UUID}"
RESULT=$(psql $DATABASE_URL -t -c "
  SELECT (result->>'success')::boolean
  FROM (
    SELECT hera_txn_query_v1('$ORG_ID'::uuid, '{}'::jsonb) as result
  ) t;
")

if [ "$RESULT" = "t" ]; then
  echo "✅ Smoke test PASSED"
  exit 0
else
  echo "❌ Smoke test FAILED"
  exit 1
fi
```

---

## Additional Resources

- **Function Source:** `database/functions/hera_txn_query_v1.sql`
- **Index Definitions:** `database/tests/test-hera-txn-query-v1-indexes.sql`
- **API Documentation:** See function comments in source file
- **Performance Tuning:** See "Index Usage Statistics" section in test output

---

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review "Troubleshooting" section above
3. Run `EXPLAIN ANALYZE` to diagnose performance issues
4. Verify all required indexes are created
