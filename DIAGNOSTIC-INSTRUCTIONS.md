# POS Transaction Diagnostic Instructions

## Issue: Commission still being added + Wrong branch address

### Step 1: Check Browser Console During Transaction Creation

1. Open `/salon/pos` page
2. Open browser DevTools (F12)
3. Go to "Console" tab
4. Clear console
5. Create a new sale transaction
6. Look for these log entries:

#### Key Log Lines to Check:

```
[PaymentDialog] 💰 PAYMENT VALIDATION CHECK:
[PaymentDialog] Processing checkout with ENTERPRISE TRACKING:
[usePosCheckout] ENTERPRISE TRACKING - All entities linked:
[useUniversalTransaction] Creating transaction (ENTERPRISE-GRADE):
```

### Step 2: Check What's Being Sent to RPC

In the console, look for:

```javascript
[usePosCheckout] ENTERPRISE TRACKING - All entities linked: {
  branch_id: "..."
  customer_id: "..."
  lines_count: X  // ← Should NOT include commission lines anymore
}
```

### Step 3: Check Network Tab

1. Go to "Network" tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for request to `/api/v2/universal/txn-emit`
4. Click on it → "Payload" tab
5. Copy the entire payload and send it to me

### Step 4: Check Branch Address

Look for this log:

```javascript
[PaymentDialog] ✅ Fetched organization name: ...
[PaymentDialog] Error fetching branch details: ...  // ← If this appears, branch lookup failed
```

### What to Send Me:

1. **Full console logs** from creating ONE transaction
2. **Network request payload** from `/api/v2/universal/txn-emit`
3. **Branch ID and Organization ID** being used
4. **Screenshot** of the wrong receipt showing:
   - Branch name (correct)
   - Branch address (wrong - showing mixed address)
   - Total amount (wrong - showing 1890 instead of 945)

## Expected vs Actual:

### Expected Behavior:
```
Subtotal: AED 900.00
Tax (5%): AED 45.00
Total: AED 945.00

Lines sent to RPC:
- 2x service lines (900 total)
- 1x tax line (45)
- 2x payment lines (945 total)
= 5 lines total (NO commission lines)
```

### Current Behavior (WRONG):
```
Subtotal: AED 900.00
Tax (5%): AED 45.00
Total: AED 1890.00  ← 2x correct amount

Possible causes:
1. Old commission lines still in transaction (need to check DB)
2. Double-counting somewhere in calculation
3. Payment lines being added to total (shouldn't be)
```

## Quick Test Query:

Run this in Supabase SQL Editor to check if commission lines exist:

```sql
-- Check recent transactions for commission lines
SELECT
  t.transaction_code,
  t.total_amount,
  t.created_at,
  COUNT(l.id) as total_lines,
  COUNT(CASE WHEN l.line_type = 'commission' THEN 1 END) as commission_lines,
  SUM(CASE WHEN l.line_type IN ('service', 'product') THEN l.line_amount ELSE 0 END) as service_product_total,
  SUM(CASE WHEN l.line_type = 'commission' THEN l.line_amount ELSE 0 END) as commission_total,
  SUM(CASE WHEN l.line_type = 'tax' THEN l.line_amount ELSE 0 END) as tax_total
FROM universal_transactions t
LEFT JOIN universal_transaction_lines l ON l.transaction_id = t.id
WHERE t.transaction_type = 'SALE'
  AND t.created_at > NOW() - INTERVAL '1 hour'
GROUP BY t.id, t.transaction_code, t.total_amount, t.created_at
ORDER BY t.created_at DESC
LIMIT 5;
```

This will show if commission lines are still being created.
