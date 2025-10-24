# Test Suite: hera_txn_crud_v1

Comprehensive test suite for the HERA Transaction CRUD Orchestrator RPC function.

## 📋 Test Coverage

### Core Operations (6 tests)
1. ✅ **CREATE** - Create transaction with header + lines
2. ✅ **READ** - Read single transaction (verifies complete data return)
3. ✅ **UPDATE** - Update transaction (verifies fresh data return)
4. ✅ **QUERY** - Query transactions with filters
5. ✅ **EMIT** - Emit lightweight event
6. ✅ **VALIDATE** - Validate transaction

### Edge Cases (5 tests)
7. ✅ **Missing Actor** - Should fail with ACTOR_REQUIRED
8. ✅ **Missing Organization** - Should fail with ORG_REQUIRED
9. ✅ **Org Mismatch** - Should fail with ORG_MISMATCH
10. ✅ **Invalid Action** - Should fail with UNKNOWN_ACTION
11. ✅ **Missing Transaction ID** - Should fail with PARAM_REQUIRED

### Validations Performed
- ✅ Response structure (success, action, transaction_id, data)
- ✅ Action is uppercase
- ✅ Complete data return (header + lines)
- ✅ Transaction ID at root level
- ✅ Guardrail enforcement
- ✅ Error handling

## 🚀 Usage

### Prerequisites
```bash
# Ensure .env is configured with:
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEFAULT_ORGANIZATION_ID=your-org-uuid
```

### Run Tests
```bash
cd mcp-server
node test-hera-txn-crud-v1.mjs
```

### Expected Output
```
══════════════════════════════════════════════════════════════════════
  HERA Transaction CRUD V1 - Comprehensive Test Suite
══════════════════════════════════════════════════════════════════════

ℹ️  Organization ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
ℹ️  Actor ID: d89a470a-10e0-4e1d-af73-52ae87943e3a

============================================================
TEST: CREATE - Create Transaction with Header + Lines
============================================================
✅ CREATE: Transaction created successfully
✅ CREATE: Transaction ID: abc-123-def
✅ CREATE: Returned 1 line(s)
✅ CREATE: Complete data structure returned (header + lines)

============================================================
TEST: READ - Read Single Transaction
============================================================
✅ READ: Transaction retrieved successfully
✅ READ: Lines included: 1

... [additional tests] ...

══════════════════════════════════════════════════════════════════════
  TEST SUMMARY
══════════════════════════════════════════════════════════════════════

Total Tests:    11
Passed:         11
Failed:         0
Skipped:        0

✅ ALL TESTS PASSED (100.0% success rate)
✅ hera_txn_crud_v1 IS PRODUCTION READY
```

## 🔧 Configuration

### Update Actor ID
If you need to use a different actor, update this line in the test file:
```javascript
const TEST_ACTOR_ID = 'd89a470a-10e0-4e1d-af73-52ae87943e3a'; // Update this
```

### Update Organization ID
The test uses `DEFAULT_ORGANIZATION_ID` from `.env`. You can override it:
```javascript
const TEST_ORG_ID = 'your-org-uuid-here';
```

## 🧪 Test Details

### CREATE Test
- Creates transaction with 1 line item
- Validates response structure
- Verifies complete data return (header + lines)
- Tracks transaction ID for subsequent tests
- Validates actor stamping

### READ Test
- Reads transaction created by CREATE test
- Verifies transaction ID matches
- Validates complete structure (header + lines)
- Confirms lines are included

### UPDATE Test
- Updates transaction status and metadata
- Verifies fresh data is returned (not cached)
- Confirms lines are still included after update

### QUERY Test
- Queries transactions by type
- Validates array response
- Confirms data structure

### EMIT Test
- Creates lightweight event transaction
- Validates event structure
- Tracks ID if returned

### VALIDATE Test
- Validates transaction business rules
- Confirms validation response

### Edge Case Tests
All edge case tests verify that:
- Error is raised (either via error response or exception)
- Correct error code/message is returned
- Function fails fast without side effects

## 🔍 Debugging

### Enable Verbose Output
Uncomment these lines in the test to see full responses:
```javascript
logInfo('Response structure:');
console.log(JSON.stringify(data, null, 2));
```

### Check Individual Test
Comment out tests in the `tests` array to run specific ones:
```javascript
const tests = [
  { name: 'CREATE', fn: testCreate },
  // { name: 'READ', fn: (ctx) => testRead(ctx.transactionId) },  // Skip this
  // ... other tests
];
```

### Manual Cleanup
If tests fail and don't clean up, you can manually delete test transactions:
```sql
DELETE FROM universal_transactions
WHERE metadata->>'created_by_test' = 'hera_txn_crud_v1_test';
```

## ✅ Success Criteria

Tests pass if:
1. **All 11 tests pass** (6 operations + 5 edge cases)
2. **100% success rate**
3. **All response structures valid**
4. **Complete data returned** (header + lines)
5. **All guardrails enforced**
6. **Cleanup successful**

## 🚨 Common Issues

### Issue: "Function not found"
**Solution:** Deploy `hera_txn_crud_v1` to Supabase first

### Issue: "Actor not found"
**Solution:** Update `TEST_ACTOR_ID` with valid user entity UUID

### Issue: "Organization not found"
**Solution:** Update `DEFAULT_ORGANIZATION_ID` in .env

### Issue: Tests hang
**Solution:** Check Supabase connection and service role key

## 📊 Performance Benchmarks

Expected response times:
- CREATE: ~100-150ms (with READ)
- READ: ~50-80ms
- UPDATE: ~100-150ms (with READ)
- QUERY: ~50-100ms (depends on data size)
- EMIT: ~50-100ms
- VALIDATE: ~50-100ms

## 🔄 CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Test Transaction CRUD
  run: |
    cd mcp-server
    node test-hera-txn-crud-v1.mjs
```

Exit codes:
- `0` - All tests passed
- `1` - One or more tests failed

## 📝 Notes

- Tests create real transactions (cleaned up automatically)
- Tests run sequentially (not parallel) to ensure dependencies
- CREATE test runs first to generate transaction ID for other tests
- Cleanup runs even if tests fail
- Safe to run multiple times (idempotent)

---

**Last Updated:** 2025-10-23
**Test Version:** 1.0.0
**RPC Version:** hera_txn_crud_v1
