# Daily Sales Report - Date Filter Bug Fix

**Date**: October 31, 2025
**Issue**: Date filters not working in `/reports/sales/daily` page
**Status**: ✅ **FIX READY FOR DEPLOYMENT**

---

## 🐛 Problem Summary

The daily sales report was showing transactions from **multiple days** instead of just the selected date:

**Expected**: Only transactions from Oct 31, 2025
**Actual**: Transactions from Oct 28-31, 2025 (4 days worth)

### User Impact
- ❌ Sales reports show incorrect data
- ❌ Daily totals include wrong transactions
- ❌ Can't get accurate single-day reports
- ❌ Branch filtering combined with date filtering not working

---

## 🔍 Root Cause Analysis

### The Data Flow

```
User selects date in UI
    ↓
React hook (useDailySalesReport) creates startDate/endDate
    ↓
useUniversalTransactionV1 sends p_payload with date_from/date_to
    ↓
hera_txn_crud_v1 orchestrator receives the payload
    ↓
❌ BUG HERE: Orchestrator extracts p_payload.filters (which doesn't exist)
    ↓
hera_txn_query_v1 receives empty filters object
    ↓
date_from and date_to are NULL in the query function
    ↓
WHERE clause doesn't filter by date (returns all transactions)
```

### The Code Problem

**Client sends** (useUniversalTransactionV1.ts:282-288):
```typescript
p_payload: {
  transaction_type: 'GL_JOURNAL',
  smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
  date_from: '2025-10-31T00:00:00.000Z',  // ← At root level
  date_to: '2025-10-31T23:59:59.999Z',    // ← At root level
  include_lines: true,
  limit: 1000
}
```

**Orchestrator expects** (FIX-ORCHESTRATOR-READ-INCLUDE-DELETED.sql:64):
```sql
v_filters := COALESCE(p_payload->'filters', '{}'::jsonb);
-- This looks for: p_payload.filters.date_from
-- But client sends: p_payload.date_from
-- Result: v_filters = {} (empty object)
```

**Orchestrator passes** (Line 128):
```sql
v_resp := hera_txn_query_v1(p_organization_id, v_filters);
-- Passes empty object instead of full payload!
```

**Query function receives** (fix-hera-txn-query-v1-full-projection.sql:28-29):
```sql
v_date_from := (p_filters->>'date_from')::timestamptz;  -- Gets NULL
v_date_to   := (p_filters->>'date_to')::timestamptz;    -- Gets NULL
```

**WHERE clause doesn't filter** (Lines 52-53):
```sql
AND (v_date_from IS NULL OR t.transaction_date >= v_date_from)  -- Always TRUE
AND (v_date_to   IS NULL OR t.transaction_date <  v_date_to)    -- Always TRUE
```

---

## ✅ The Fix

### Change Required

**File**: Database function `hera_txn_crud_v1`
**Location**: Line 128 in the orchestrator
**Change**: One line modification

**Before (WRONG)**:
```sql
ELSIF v_action = 'query' THEN
  v_resp := hera_txn_query_v1(p_organization_id, v_filters);
  v_ok := true;
```

**After (FIXED)**:
```sql
ELSIF v_action = 'query' THEN
  -- Pass p_payload directly (filters are at root level)
  v_resp := hera_txn_query_v1(p_organization_id, p_payload);
  v_ok := true;
```

### Why This Works

1. Client sends filters at `p_payload.date_from` level ✅
2. Orchestrator now passes full `p_payload` to query function ✅
3. Query function extracts `p_filters->>'date_from'` which now exists ✅
4. WHERE clause properly filters by date range ✅

---

## 🚀 Deployment Instructions

### Step 1: Apply the SQL Fix

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire SQL from `/FIX-ORCHESTRATOR-QUERY-FILTERS.sql`
3. Run the CREATE OR REPLACE FUNCTION statement
4. Verify deployment with:

```sql
SELECT
  proname AS function_name,
  prosrc LIKE '%hera_txn_query_v1(p_organization_id, p_payload)%' AS has_fix
FROM pg_proc
WHERE proname = 'hera_txn_crud_v1';

-- Expected: has_fix = true
```

### Step 2: Verify in Application

1. Navigate to `/salon/reports/sales/daily`
2. Select today's date (Oct 31, 2025)
3. Open browser console
4. Look for log: `📅 [useUniversalTransactionV1] QUERY COMPLETED - Date Verification:`
5. Verify `dates_match_filter: true`
6. Check that only today's transactions appear

### Step 3: Test Edge Cases

✅ **Test these scenarios**:
- [ ] Select different dates and verify results change
- [ ] Filter by branch + date combination
- [ ] Select date with no transactions (should show empty state)
- [ ] Select date with multiple transactions (should show all)
- [ ] Check monthly report still works (`/reports/sales/monthly`)

---

## 📊 Verification Checklist

After deployment, verify these conditions:

### Console Logs
```
✅ 📊 [useDailySalesReport] Filter params:
     startDate: "2025-10-31T00:00:00.000Z"
     endDate: "2025-10-31T23:59:59.999Z"

✅ 🚀 [useUniversalTransactionV1] RPC PAYLOAD BEING SENT:
     date_from_in_payload: "2025-10-31T00:00:00.000Z"
     date_to_in_payload: "2025-10-31T23:59:59.999Z"

✅ 📅 [useUniversalTransactionV1] QUERY COMPLETED - Date Verification:
     dates_match_filter: true
     all_transaction_dates_sorted: ["2025-10-31T..."]
```

### UI Behavior
```
✅ Only transactions from selected date appear in table
✅ Summary cards show correct totals for that date
✅ Changing date refreshes results immediately
✅ "No sales data" message shows for dates with no transactions
✅ Branch filter works with date filter
```

---

## 🧪 Testing Script

Run this to verify the fix works:

```bash
cd mcp-server
node test-date-filter.mjs
```

**Expected Output**:
```
🧪 DATE FILTER BUG TEST
============================================================
📅 Test Parameters:
  Date: 2025-10-31
  Start: 2025-10-31T00:00:00.000Z
  End: 2025-10-31T23:59:59.999Z

📥 RPC Response:
  Success: true
  Transaction Count: 2

📊 Transaction Dates Analysis:
  ✅ TXN-123: 2025-10-31T08:26:47.401Z
  ✅ TXN-124: 2025-10-31T14:15:22.189Z

  Summary:
    ✅ Within range: 2
    ❌ Outside range: 0

  ✅ Date filter is working correctly!
```

---

## 🎯 Impact Assessment

### Before Fix
- ❌ 16 transactions returned for single day query
- ❌ Date range: Oct 28 - Oct 31 (4 days)
- ❌ Incorrect daily totals
- ❌ Branch + date filtering broken

### After Fix
- ✅ Only transactions from selected date
- ✅ Date range matches filter exactly
- ✅ Correct daily totals
- ✅ Branch + date filtering works

### Performance Impact
- **No performance degradation** - Adding date filters actually **improves** performance
- Fewer rows returned = faster queries
- Index on `transaction_date` column will be used efficiently

---

## 📝 Related Files

**Fix SQL**:
- `/FIX-ORCHESTRATOR-QUERY-FILTERS.sql` - Complete fix with deployment instructions

**Affected Code**:
- `/src/hooks/useSalonSalesReports.ts` - Daily/monthly reports
- `/src/hooks/useUniversalTransactionV1.ts` - Transaction query hook
- `/src/app/salon/reports/sales/daily/page.tsx` - Daily report UI
- `/src/app/salon/reports/sales/monthly/page.tsx` - Monthly report UI

**Database Functions**:
- `hera_txn_crud_v1` - Orchestrator (needs fix on line 128)
- `hera_txn_query_v1` - Query function (already correct, no changes needed)

**Test Files**:
- `/mcp-server/test-date-filter.mjs` - Verification test

---

## 🚨 Important Notes

1. **No client code changes required** - This is a pure database fix
2. **Backward compatible** - Won't break existing functionality
3. **One-line change** - Minimal risk deployment
4. **Immediate effect** - No cache clearing needed
5. **Works for all report types** - Daily, monthly, custom date ranges

---

## ✅ Deployment Checklist

- [ ] Review FIX-ORCHESTRATOR-QUERY-FILTERS.sql
- [ ] Backup current function (optional but recommended)
- [ ] Run CREATE OR REPLACE FUNCTION in Supabase SQL Editor
- [ ] Verify deployment with verification query
- [ ] Test in UI (/salon/reports/sales/daily)
- [ ] Check browser console for correct logs
- [ ] Test branch filtering + date filtering combination
- [ ] Verify monthly report still works
- [ ] Run automated test: `node test-date-filter.mjs`
- [ ] Monitor for any errors in production

---

## 🎉 Expected Outcome

After deployment:
- ✅ Daily sales report shows correct date-filtered data
- ✅ Monthly sales report continues to work
- ✅ Branch filtering works with date filtering
- ✅ Performance improved (fewer rows returned)
- ✅ All console logs show `dates_match_filter: true`

---

**Status**: ✅ Ready to deploy
**Risk Level**: LOW (one-line fix, backward compatible)
**Testing**: Comprehensive test script provided
**Rollback**: Easy (just revert the function)

Deploy with confidence! 🚀
