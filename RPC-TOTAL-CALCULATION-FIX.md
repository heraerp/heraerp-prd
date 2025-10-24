# RPC Total Calculation Fix - Complete Guide

## Issue Summary

**Problem**: Transaction `total_amount` field was being calculated as 2x the actual customer-facing total.

**Example**:
- Service: AED 450.00
- Tax: AED 22.50
- **Customer owes**: AED 472.50
- **Stored in database**: AED 945.00 ❌ (doubled!)

**Root Cause**: The RPC function `hera_txn_create_v1` was summing ALL lines including payment lines.

---

## Why Payment Lines Should Be Excluded

**Transaction lines have different purposes**:

### Customer-Facing Lines (INCLUDE in total):
- ✅ `service` - Services performed
- ✅ `product` - Products sold
- ✅ `tax` - Tax on the sale
- ✅ `tip` - Gratuity
- ✅ `discount` - Discounts applied (negative amount)

### Audit/Tracking Lines (EXCLUDE from total):
- ❌ `payment` - Records HOW customer paid (not WHAT they owe)
- ❌ `commission` - Internal expense tracking

**The Accounting Logic**:
```
Customer Total = Services + Products + Tax + Tips - Discounts
Payment Lines = Record of how the customer paid the total
Commission Lines = Internal expense calculation

If you include payment in total, you get:
Total = Customer Total + Payment = 2x Customer Total ❌
```

---

## The Fix

### Original Code (Broken)
**File**: `hera_txn_create_v1` function, lines 97-101

```sql
-- ❌ WRONG: Sums ALL lines including payments
WITH ins AS (
  INSERT INTO universal_transaction_lines(...)
  SELECT ... FROM normalized n
  RETURNING line_amount, discount_amount, tax_amount
)
SELECT COALESCE(SUM(line_amount - discount_amount + tax_amount), 0)
INTO v_total
FROM ins;  -- ← Includes payment lines!
```

### Fixed Code
```sql
-- ✅ CORRECT: Calculate total BEFORE inserting, exclude payment/commission
WITH normalized AS (
  SELECT
    line_number, entity_id, line_type, description,
    quantity, unit_amount, line_amount, discount_amount, tax_amount,
    line_sc, line_data
  FROM src
)
-- Calculate total first, filtering by line_type
SELECT COALESCE(SUM(line_amount - discount_amount + tax_amount), 0)
INTO v_total
FROM normalized
WHERE line_type NOT IN ('payment', 'commission');  -- ← Exclude payment/commission

-- Then insert ALL lines (including payment for audit)
INSERT INTO universal_transaction_lines(...)
SELECT ... FROM normalized n;
```

**Key Changes**:
1. Calculate `v_total` directly from the `normalized` CTE (before INSERT)
2. Filter with `WHERE line_type NOT IN ('payment', 'commission')`
3. Payment lines still get inserted (for audit trail), just not included in total

---

## How to Apply the Fix

### Step 1: Backup Current Function (Optional but Recommended)
```bash
cd /home/san/PRD/heraerp-prd/mcp-server

# Backup existing function definition
pg_dump "postgresql://..." \
  --schema-only \
  --table=hera_txn_create_v1 \
  > backup-hera_txn_create_v1-$(date +%Y%m%d-%H%M%S).sql
```

### Step 2: Apply the Fix
```bash
cd /home/san/PRD/heraerp-prd/mcp-server

# Apply the corrected function
psql "postgresql://..." < fix-rpc-total-calculation.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Open `fix-rpc-total-calculation.sql`
3. Run the script

### Step 3: Test the Fix
```bash
cd /home/san/PRD/heraerp-prd/mcp-server

# Run the test script
node test-rpc-fix.js
```

**Expected output**:
```
✅ SUCCESS! Total is correct (excludes payment lines)
✅ Fix is working properly!
```

### Step 4: Verify Existing Transactions
```bash
# Check recent transactions to see the impact
node check-sale-transactions.js
```

**Before fix**:
```
Customer-facing total: AED 472.50
Stored total_amount: AED 945.00
🚨 DOUBLED! Payment lines likely included in total
```

**After fix** (new transactions):
```
Customer-facing total: AED 472.50
Stored total_amount: AED 472.50
✅ Totals match!
```

---

## Impact Assessment

### What Changes:
- ✅ **New transactions**: Will have correct `total_amount` values
- ⚠️  **Old transactions**: Will keep incorrect values (no automatic fix)
- ✅ **Display logic**: Already working correctly (calculates from lines/metadata)

### What Doesn't Change:
- ❌ Existing transaction records are NOT automatically updated
- ✅ Display logic in UI continues to work (it already calculates correctly)
- ✅ Payment lines still get inserted (for audit trail)
- ✅ Commission lines still get inserted (for tracking)

### Should Old Transactions Be Fixed?

**Option 1: Leave as-is** (Recommended)
- Pro: No risk of data corruption
- Pro: Historical record preserved
- Con: Database totals don't match for old records
- Mitigation: Display logic already handles this correctly

**Option 2: Migrate old transactions**
- Pro: Consistent database values
- Con: Requires careful migration script
- Con: Risk of mistakes
- Con: Loses historical record of when issue occurred

**Recommendation**: Leave old transactions as-is. The display logic already calculates correctly, so users see the right values. The database inconsistency is internal only.

---

## Testing Checklist

### Manual Testing:
- [ ] Create a new sale with service + tax + payment
- [ ] Verify console shows correct total (not doubled)
- [ ] Check receipt shows correct total
- [ ] Verify transaction in database has correct `total_amount`
- [ ] Check payment history displays correct amount
- [ ] Try with multiple payment methods
- [ ] Try with discount and tip added

### Automated Testing:
- [ ] Run `node test-rpc-fix.js` - should show ✅ SUCCESS
- [ ] Run `node check-sale-transactions.js` - new transactions should not be doubled
- [ ] Check console logs show correct totals

---

## Rollback Plan

If the fix causes issues, rollback with:

```sql
-- Restore the original function (before fix)
-- WARNING: This will bring back the doubling issue

BEGIN;

DROP FUNCTION IF EXISTS public.hera_txn_create_v1(jsonb, jsonb, uuid);

-- Paste the original function definition here
-- (from the backup file)

COMMIT;
```

---

## Related Issues

### 1. Branch Address Issue (Separate)
**Status**: Under investigation
**File**: `BRANCH-ADDRESS-INVESTIGATION-FINDINGS.md`
**Issue**: Receipt shows correct branch name but wrong address
**Fix**: Awaiting user test with diagnostic logging

### 2. Display Logic Already Fixed
**Status**: ✅ Complete
**Files**:
- `SaleDetailsDialog.tsx` (lines 158-172)
- `useHeraSales.ts` (lines 205-230)
**Fix**: Calculate total from metadata/lines instead of `total_amount` field

This RPC fix ensures NEW transactions have correct values in the database, while the display fix ensures OLD transactions are shown correctly to users.

---

## Summary

**What was broken**:
```typescript
// RPC function calculated total like this:
total = service + tax + payment
      = 450 + 22.50 + 472.50
      = 945.00 ❌ DOUBLED!
```

**What's fixed**:
```typescript
// RPC function now calculates total like this:
total = service + tax  (excludes payment)
      = 450 + 22.50
      = 472.50 ✅ CORRECT!
```

**Files Changed**:
- `fix-rpc-total-calculation.sql` - Fixed RPC function
- `test-rpc-fix.js` - Test script to verify fix

**Next Steps**:
1. Review the fix
2. Apply to Supabase
3. Test with new transaction
4. Monitor for any issues

---

## Questions?

If you have questions or issues after applying this fix, check:
1. Console logs for any RPC errors
2. Test script output (`node test-rpc-fix.js`)
3. Recent transaction totals (`node check-sale-transactions.js`)
