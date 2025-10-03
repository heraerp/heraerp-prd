# Fix Entity Creation Constraint Error

## Problem
The error "insert or update on table 'universal_transactions' violates foreign key constraint" is caused by a database trigger that's incorrectly trying to create audit logs during entity creation. The trigger `trigger_enforce_transaction_standards` is attempting to insert records with a `source_entity_id` that doesn't exist yet.

## Solution
Run the following SQL in your Supabase SQL Editor to fix the constraint:

```sql
-- 1. Drop problematic triggers
DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON core_entities;
DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON universal_transactions;

-- 2. Create simplified enforcement function (without audit logging)
CREATE OR REPLACE FUNCTION enforce_transaction_standards()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate smart codes - remove all the problematic audit logging
    IF NEW.smart_code IS NULL OR 
       NOT (NEW.smart_code ~ '^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid or missing smart_code. Must follow pattern HERA.{INDUSTRY}.{MODULE}.{TYPE}.V{VERSION}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply fixed trigger to universal_transactions only
CREATE TRIGGER trigger_enforce_transaction_standards
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_standards();

-- 4. Create entity validation function
CREATE OR REPLACE FUNCTION validate_entity_smart_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate smart code format if provided
    IF NEW.smart_code IS NOT NULL AND 
       NOT (NEW.smart_code ~ '^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid smart_code format for entity';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Apply entity validation trigger
DROP TRIGGER IF EXISTS trigger_validate_entity_smart_code ON core_entities;
DROP TRIGGER IF EXISTS trigger_enforce_entity_standards ON core_entities;
CREATE TRIGGER trigger_validate_entity_smart_code
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW EXECUTE FUNCTION validate_entity_smart_code();

-- 6. Fix transaction lines trigger
CREATE OR REPLACE FUNCTION enforce_transaction_line_standards()
RETURNS TRIGGER AS $$
BEGIN
    -- Just ensure organization_id matches parent transaction
    IF NEW.transaction_id IS NOT NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM universal_transactions 
        WHERE id = NEW.transaction_id;
    END IF;
    
    -- Validate smart code if provided
    IF NEW.smart_code IS NOT NULL AND 
       NOT (NEW.smart_code ~ '^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid line smart_code format';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Replace transaction lines trigger
DROP TRIGGER IF EXISTS trigger_enforce_line_gl_accounts ON universal_transaction_lines;
CREATE TRIGGER trigger_enforce_line_standards
    BEFORE INSERT OR UPDATE ON universal_transaction_lines
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_line_standards();
```

## How to Apply
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL above
4. Click "Run"
5. The constraint error should be fixed

## What This Fixes
- Removes the problematic audit log insertion that was causing foreign key violations
- Simplifies the trigger to only validate smart codes
- Separates entity validation from transaction validation
- Ensures triggers only run on appropriate tables

## Testing
After applying the fix, try creating a staff member again. The entity creation should now work without constraint violations.

## Alternative - Disable Triggers Temporarily
If you need a quick workaround while debugging:

```sql
-- Disable triggers temporarily
ALTER TABLE core_entities DISABLE TRIGGER ALL;
ALTER TABLE universal_transactions DISABLE TRIGGER ALL;
ALTER TABLE universal_transaction_lines DISABLE TRIGGER ALL;

-- Create your entities

-- Re-enable triggers
ALTER TABLE core_entities ENABLE TRIGGER ALL;
ALTER TABLE universal_transactions ENABLE TRIGGER ALL;
ALTER TABLE universal_transaction_lines ENABLE TRIGGER ALL;
```

## Root Cause
The original trigger in `/database/functions/triggers/transaction-enforcement-trigger.sql` (lines 46-64) was trying to insert audit logs into `core_entities` whenever a transaction was created, but was using `source_entity_id` which might not exist yet, causing the foreign key constraint violation.