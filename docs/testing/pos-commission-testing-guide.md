# POS Commission Mode Testing Guide

## Overview
This guide helps you test the POS system with commission modes ON and OFF to ensure the system behaves correctly in both scenarios.

## Prerequisites
- Access to the salon POS system
- Admin access to toggle commission settings
- Test services and stylists created in the system

## Testing Scenarios

### 1. Check Current Commission Mode

1. Navigate to **Admin → Settings → Salon**
2. Look for the "Commission Settings" card
3. Note whether commissions are **Enabled** or **Disabled**

Alternatively, check the POS header:
- Navigate to **Salon → POS**
- Look for the commission badge in the header:
  - ✅ "Commissions ON" = Full commission tracking
  - ⚠️ "Commissions OFF — Simple POS" = No commission requirements

### 2. Test with Commissions ON

**Expected Behavior:**
- Services MUST have a stylist assigned
- Commission lines are automatically generated
- Validation prevents checkout without stylists on services

**Test Steps:**
1. Ensure commissions are **ENABLED** in settings
2. Go to POS and add a service to cart
3. Try to proceed to payment WITHOUT assigning a stylist
   - **Expected**: Validation error "Service must have an assigned stylist"
4. Assign a stylist to the service
5. Proceed to payment
   - **Expected**: Payment processes successfully
6. Check the receipt/transaction details
   - **Expected**: Commission lines appear showing stylist commissions

### 3. Test with Commissions OFF (Simple POS)

**Expected Behavior:**
- Services can be sold without stylist assignment
- No commission lines are generated
- Faster, simpler checkout process

**Test Steps:**
1. Toggle commissions to **DISABLED** in settings
2. Wait for the 30-second cooldown if recently changed
3. Go to POS and add a service to cart
4. Notice the helper text under the total:
   - "Commissions are disabled for this location. Stylist selection is optional."
5. Proceed to payment WITHOUT assigning a stylist
   - **Expected**: Payment processes successfully
6. Check the receipt/transaction details
   - **Expected**: NO commission lines appear

### 4. Test Mode Switching

**Test the 30-second cooldown:**
1. Toggle commission mode
2. Immediately try to toggle again
   - **Expected**: Error message "Please wait X seconds before toggling again"

**Test data consistency:**
1. Create a sale with commissions ON (with stylist)
2. Toggle commissions OFF
3. Create a sale without stylist
4. Check the POS Health page (`/ops/pos-health`)
   - Both sales should appear correctly
   - No violation warnings should appear

### 5. Monitor System Health

Navigate to `/ops/pos-health` to see:
- Current commission mode
- Today's sales breakdown
- Any commission violations (commission lines while disabled)
- System status indicators

## Quick SQL Checks

Use these queries to verify the system state:

```sql
-- Check current commission setting for your org
SELECT 
  entity_name,
  settings->'salon'->'commissions'->>'enabled' as commissions_enabled
FROM core_organizations
WHERE id = 'your-org-id';

-- Find recent sales with/without stylists
SELECT 
  ut.transaction_code,
  ut.created_at,
  utl.metadata->>'stylist_name' as stylist,
  utl.line_amount
FROM universal_transactions ut
JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
WHERE ut.organization_id = 'your-org-id'
  AND ut.transaction_type = 'sale'
  AND utl.smart_code LIKE '%SERVICE%'
ORDER BY ut.created_at DESC
LIMIT 10;

-- Check for commission lines
SELECT 
  ut.transaction_code,
  ut.created_at,
  COUNT(*) FILTER (WHERE utl.smart_code LIKE '%COMMISSION%') as commission_lines
FROM universal_transactions ut
JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
WHERE ut.organization_id = 'your-org-id'
  AND ut.transaction_type = 'sale'
  AND ut.created_at >= CURRENT_DATE
GROUP BY ut.id, ut.transaction_code, ut.created_at
ORDER BY ut.created_at DESC;
```

## Troubleshooting

### Issue: Can't toggle commission mode
- **Check**: Are you logged in as Owner or Admin?
- **Check**: Did you wait 30 seconds since last toggle?

### Issue: Commission lines appear when disabled
- Check `/ops/pos-health` for violations
- This indicates transactions were created before disabling
- New transactions should not have commission lines

### Issue: Validation not working as expected
- Ensure you're using the latest code
- Check browser console for errors
- Verify organization settings are saved correctly

## Success Criteria

✅ With commissions ON:
- Services require stylist assignment
- Commission lines are generated
- Proper validation messages appear

✅ With commissions OFF:
- Services can be sold without stylists
- No commission lines generated
- Helper text appears in cart
- "Simple POS" badge visible

✅ Mode switching:
- 30-second cooldown enforced
- Reason dialog appears
- Changes logged for audit
- No data corruption between modes