-- Fix for entity creation constraint violation
-- The trigger was incorrectly trying to insert audit logs during entity creation

-- First, let's check if the problematic trigger exists
DO $$
BEGIN
    -- Drop any triggers that might be incorrectly attached to core_entities
    DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON core_entities;
    
    -- Drop the trigger from universal_transactions to recreate it
    DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON universal_transactions;
END $$;

-- Create a simpler enforcement function that doesn't create audit logs
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

-- Apply the fixed trigger only to universal_transactions
CREATE TRIGGER trigger_enforce_transaction_standards
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_standards();

-- Create a simple validation function for entities
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

-- Apply simple validation to entities
DROP TRIGGER IF EXISTS trigger_validate_entity_smart_code ON core_entities;
CREATE TRIGGER trigger_validate_entity_smart_code
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW EXECUTE FUNCTION validate_entity_smart_code();

-- Fix the transaction lines trigger as well
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

-- Replace the transaction lines trigger
DROP TRIGGER IF EXISTS trigger_enforce_line_gl_accounts ON universal_transaction_lines;
CREATE TRIGGER trigger_enforce_line_standards
    BEFORE INSERT OR UPDATE ON universal_transaction_lines
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_line_standards();