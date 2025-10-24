# Finance DNA v2 - Updated for Sign Convention

## 🚨 Critical Updates Made

All Finance DNA v2 functions have been updated to use the **line_amount sign convention** instead of the non-existent `debit_amount` and `credit_amount` columns.

### ✅ **Sign Convention Rules:**
- **Positive `line_amount`** = Debit
- **Negative `line_amount`** = Credit
- **Only GL transactions** (smart_code contains `.GL.`) are validated for balance

## 📁 Updated Files

### 1. **01-core-setup-fixed.sql** (Updated)
- ✅ Fixed GL balance validation function
- ✅ Uses `line_amount >= 0` for debits, `line_amount < 0` for credits
- ✅ Only checks GL transactions (`smart_code ~* '\.GL\.'`)

### 2. **02-reporting-rpcs-fixed.sql** (Completely Rewritten)
- ✅ Account Summary Report
- ✅ Trial Balance Report  
- ✅ Income Statement Report
- ✅ Balance Sheet Report
- ✅ All use sign convention for proper accounting presentation

### 3. **03-policy-engine-fixed.sql** (Completely Rewritten)
- ✅ Policy engine for automatic GL posting
- ✅ Balance validation using sign convention
- ✅ Account lookup helpers
- ✅ Creates proper debit/credit entries using line_amount

### 4. **04-migration-functions-fixed.sql** (Completely Rewritten)
- ✅ Legacy GL migration with sign conversion
- ✅ Data validation functions
- ✅ Rollback capabilities
- ✅ Converts old debit/credit amounts to sign convention

## 🎯 **Key Changes Made**

### Before (❌ Broken):
```sql
-- This would fail - columns don't exist
SELECT debit_amount, credit_amount 
FROM universal_transaction_lines;
```

### After (✅ Working):
```sql
-- Using sign convention
SELECT 
  CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END as debit_amount,
  CASE WHEN line_amount < 0 THEN ABS(line_amount) ELSE 0 END as credit_amount
FROM universal_transaction_lines
WHERE smart_code ~* '\.GL\.';
```

## 🔧 **Deployment Instructions**

### Option 1: Deploy Individual Files
Run each SQL file in order:
1. `01-core-setup-fixed.sql`
2. `02-reporting-rpcs-fixed.sql` 
3. `03-policy-engine-fixed.sql`
4. `04-migration-functions-fixed.sql`

### Option 2: Use the GL Trigger (Recommended)
Deploy the corrected GL balance trigger:
- `../gl-balance-trigger-deploy-fixed.sql`

## 🚨 **Critical Fixes**

### Transaction Type Filtering
```sql
-- ❌ OLD: Validated ALL transactions (including appointments)
WHERE transaction_id = p_transaction_id

-- ✅ NEW: Only validates GL transactions  
WHERE transaction_id = p_transaction_id
  AND smart_code ~* '\.GL\.'
```

### Balance Calculation
```sql
-- ❌ OLD: Used non-existent columns
SUM(debit_amount) - SUM(credit_amount)

-- ✅ NEW: Uses sign convention
SUM(line_amount)  -- Automatically balanced if correct
```

### Trigger Conditions
```sql
-- ❌ OLD: Failed on DELETE operations
WHEN (NEW.smart_code ~* '\.GL\.' OR OLD.smart_code ~* '\.GL\.')

-- ✅ NEW: Properly handles all operations
WHEN (
  (TG_OP IN ('INSERT', 'UPDATE') AND NEW.smart_code ~* '\.GL\.') OR
  (TG_OP = 'DELETE' AND OLD.smart_code ~* '\.GL\.')
)
```

## 🎯 **Expected Results**

After deploying these updates:

1. ✅ **Appointments work without GL validation errors**
2. ✅ **POS sales work without debit/credit errors**  
3. ✅ **GL transactions are properly balanced**
4. ✅ **Financial reports show correct amounts**
5. ✅ **Legacy data can be migrated properly**

## 📋 **Testing Checklist**

- [ ] Deploy GL trigger fix
- [ ] Test appointment creation (should work without GL errors)
- [ ] Test POS transaction (should work without debit/credit errors)
- [ ] Create test GL entry with balanced debits/credits
- [ ] Run financial reports to verify calculations
- [ ] Test legacy data migration (if needed)

## 🔍 **Backwards Compatibility**

The `v_universal_gl_lines` view provides backwards compatibility:
```sql
-- Legacy code can still use:
SELECT debit_amount, credit_amount FROM v_universal_gl_lines;

-- This view automatically converts from line_amount sign convention
```

## 📞 **Support**

If you encounter issues:
1. Check that `line_amount` field exists in `universal_transaction_lines`
2. Verify smart codes contain `.GL.` for accounting transactions
3. Ensure appointments use `HERA.SALON.APPOINTMENT.*` (no `.GL.`)
4. Check the trigger is properly deployed with the corrected WHEN condition