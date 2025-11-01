# Service Analytics Fix Summary

## 🚨 Issue Identified

**Problem**: Service Analytics in `/salon/dashboard` showing "No service data available yet"

**User Debug Output**:
```javascript
{
  activeServicesCount: 27,              // ✅ Services exist
  periodCompletedTicketsCount: 26,      // ✅ Transactions exist
  sampleTransactionWithLines: {
    id: '730b52e6-fbad-4161-ab86-2e5b7c3b375d',
    linesCount: 0,                      // ❌ PROBLEM: No lines!
    sampleLines: []                     // ❌ Empty array
  },
  serviceStatsCount: 0,                 // ❌ No services matched
  topServices: []                       // ❌ Nothing to display
}
```

## 🔍 Root Cause Analysis

### Investigation Steps:
1. ✅ Confirmed 27 active services exist in the system
2. ✅ Confirmed 26 GL_JOURNAL transactions exist for the period
3. ✅ Verified `include_lines: true` is correctly set in `useUniversalTransactionV1` hook (line 386 of `useSalonDashboard.ts`)
4. ✅ Traced data flow: Hook → RPC Orchestrator → Query Function
5. ❌ **FOUND**: `hera_txn_query_v1` function **completely ignores** the `include_lines` parameter

### Root Cause:
The `hera_txn_query_v1` PostgreSQL function was designed to only return transaction headers (no lines). From the function documentation:

```sql
-- Line 8 of fix-hera-txn-query-v1-full-projection.sql:
- Returns full header fields (no lines) for each item
```

Even though the client sends `include_lines: true`, the function never checks this parameter and never fetches transaction lines from the `universal_transaction_lines` table.

### Why This Breaks Service Analytics:
Service Analytics relies on matching service entities to transaction lines:

```typescript
// From useSalonDashboard.ts line 848-854
const serviceTransactions = periodCompletedTickets.filter(t => {
  const lines = t.lines || []
  // Check if any line references this service
  return lines.some((line: any) =>
    line.entity_id === service.id &&
    (line.line_type === 'service' || line.line_type === 'gl')
  )
})
```

Without `lines` array, this filter always returns empty, so no services are matched.

## ✅ Solution Implemented

### File: `/home/san/PRD/heraerp-dev/FIX-TXN-QUERY-INCLUDE-LINES.sql`

**Changes to `hera_txn_query_v1` function:**

1. **Added `v_include_lines` parameter extraction** (defaults to `true`):
   ```sql
   v_include_lines boolean := COALESCE((p_filters->>'include_lines')::boolean, true);
   ```

2. **Created two execution paths**:
   - **WITH lines** (when `include_lines = true`):
     - Fetches transactions from `universal_transactions`
     - Joins `universal_transaction_lines` with LEFT JOIN
     - Aggregates lines using `jsonb_agg()` ordered by `line_number`
     - Includes `lines` array in response

   - **WITHOUT lines** (when `include_lines = false`):
     - Original fast path
     - No join, no lines - optimal performance

3. **Lines structure returned**:
   ```json
   {
     "id": "uuid",
     "line_number": 1,
     "line_type": "service",
     "entity_id": "service-uuid",
     "description": "Hair Treatment",
     "quantity": 1,
     "unit_amount": 450.00,
     "line_amount": 450.00,
     "discount_amount": 0,
     "tax_amount": 0,
     "smart_code": "HERA.SALON.SERVICE.LINE.v1",
     "line_data": {},
     "created_at": "...",
     "updated_at": "..."
   }
   ```

## 📋 Deployment Instructions

### Step 1: Deploy SQL Fix
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `/home/san/PRD/heraerp-dev/FIX-TXN-QUERY-INCLUDE-LINES.sql`
3. Copy the entire SQL script
4. Paste into SQL Editor
5. Click **Run** to deploy

### Step 2: Verify Deployment
Run this verification query in Supabase SQL Editor:

```sql
SELECT
  proname AS function_name,
  prosrc LIKE '%v_include_lines%' AS has_include_lines_variable,
  prosrc LIKE '%LEFT JOIN lines_agg%' AS has_lines_join
FROM pg_proc
WHERE proname = 'hera_txn_query_v1';
```

**Expected output:**
```
function_name     | has_include_lines_variable | has_lines_join
------------------|----------------------------|----------------
hera_txn_query_v1 | true                       | true
```

### Step 3: Test in Application
1. Open `/salon/dashboard` in browser
2. Open browser console (F12)
3. Look for debug log: `[useSalonDashboard] Service Analytics Debug:`
4. Verify the output now shows:
   ```javascript
   {
     sampleTransactionWithLines: {
       linesCount: 2,              // ✅ Lines now included!
       sampleLines: [
         {
           line_type: 'service',
           entity_id: 'service-uuid',
           line_amount: 450.00
         }
       ]
     },
     serviceStatsCount: 5,         // ✅ Services matched!
     topServices: [                // ✅ Data displayed!
       {
         name: 'Balayage',
         bookings: 12,
         revenue: 5400.00
       }
     ]
   }
   ```
5. **Service Analytics section should now display service data**

## 📊 Impact Assessment

### Before Fix:
- ❌ Transaction lines not fetched from database
- ❌ Service Analytics always empty
- ❌ No service revenue or booking statistics
- ❌ Poor dashboard user experience

### After Fix:
- ✅ Transaction lines fetched when requested
- ✅ Service Analytics populated correctly
- ✅ Accurate service revenue and booking statistics
- ✅ Complete dashboard analytics experience
- ✅ Maintains performance (only fetches lines when needed)

## 🔧 Related Files

### Modified:
- `/home/san/PRD/heraerp-dev/FIX-TXN-QUERY-INCLUDE-LINES.sql` - **NEW SQL fix**

### Investigated (No changes needed):
- `/home/san/PRD/heraerp-dev/src/hooks/useUniversalTransactionV1.ts` - Already correctly passing `include_lines: true`
- `/home/san/PRD/heraerp-dev/src/hooks/useSalonDashboard.ts` - Already correctly processing lines (just needs lines data)
- `/home/san/PRD/heraerp-dev/src/components/salon/dashboard/CustomerAndServiceInsights.tsx` - UI correctly handles data

## 🎯 Success Criteria

Fix is successful when:
- [ ] SQL deployment completes without errors
- [ ] Verification query returns `true` for both checks
- [ ] Browser console shows `linesCount > 0` in debug logs
- [ ] Service Analytics section displays service data
- [ ] Top services show correct booking counts
- [ ] Service revenue totals are accurate

## 📝 Notes

### Performance Considerations:
- The fix uses LEFT JOIN to handle transactions with no lines
- Lines are aggregated using `jsonb_agg()` which is efficient in PostgreSQL
- When `include_lines = false`, the original fast path is used (no performance impact)
- Default is `include_lines = true` for backward compatibility

### Future Improvements:
- Consider caching line data for frequently accessed transactions
- Add indexes on `universal_transaction_lines(transaction_id, line_number)` if performance degrades
- Monitor query performance with large transaction volumes

---

**Status**: ✅ **READY TO DEPLOY**

**Deployment**: Run SQL script in Supabase Dashboard → SQL Editor

**Testing**: Check `/salon/dashboard` after deployment

**Rollback**: If needed, restore previous `hera_txn_query_v1` from `fix-hera-txn-query-v1-full-projection.sql`
