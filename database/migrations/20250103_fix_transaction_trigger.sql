-- Fix transaction enforcement trigger that's incorrectly firing on entity creation
-- This migration removes the problematic audit log insertion that causes foreign key violations

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON universal_transactions;
DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON core_entities; -- In case it was mistakenly added here

-- Recreate the function without the problematic audit log insertion
CREATE OR REPLACE FUNCTION enforce_transaction_standards()
RETURNS TRIGGER AS $$
DECLARE
    coa_count INTEGER;
    doc_number_exists BOOLEAN;
    line_count INTEGER;
    invalid_gl_count INTEGER;
BEGIN
    -- Only apply this trigger to universal_transactions table
    IF TG_TABLE_NAME != 'universal_transactions' THEN
        RETURN NEW;
    END IF;

    -- 🔐 ENFORCE: Organization must have Chart of Accounts
    SELECT COUNT(*) INTO coa_count
    FROM core_entities 
    WHERE organization_id = NEW.organization_id 
      AND entity_type = 'gl_account'
      AND status = 'active';
    
    IF coa_count = 0 THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Organization % does not have a Chart of Accounts. Create COA before transactions.', 
            NEW.organization_id;
    END IF;

    -- 🔐 ENFORCE: Transaction must have transaction_code (not transaction_number)
    IF NEW.transaction_code IS NULL OR LENGTH(TRIM(NEW.transaction_code)) = 0 THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Transaction code is required. Use proper transaction code generation.';
    END IF;

    -- 🔐 ENFORCE: Business reference number required for audit trail
    IF NEW.reference_number IS NULL OR LENGTH(TRIM(NEW.reference_number)) = 0 THEN
        -- Auto-generate reference number if missing
        NEW.reference_number := 'AUTO-' || EXTRACT(YEAR FROM CURRENT_DATE) || 
                               LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || '-' ||
                               EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT;
        
        -- NOTE: We remove the audit log insertion here as it causes issues
        -- The auto-generated reference is tracked in the transaction metadata instead
        NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
            'auto_generated_reference', true,
            'generation_reason', 'Missing reference number',
            'generated_at', CURRENT_TIMESTAMP
        );
    END IF;

    -- 🔐 ENFORCE: Smart code pattern validation
    IF NEW.smart_code IS NULL OR 
       NOT (NEW.smart_code ~ '^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid or missing smart_code. Must follow pattern HERA.{INDUSTRY}.{MODULE}.{TYPE}.V{VERSION}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger ONLY to universal_transactions table
CREATE TRIGGER trigger_enforce_transaction_standards
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_standards();

-- Create a separate, simpler COA enforcement function for entities
CREATE OR REPLACE FUNCTION enforce_entity_standards()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate GL account entities
    IF NEW.entity_type = 'gl_account' THEN
        -- Account code format validation (7 digits)
        IF NEW.entity_code IS NULL OR NOT (NEW.entity_code ~ '^[1-5][0-9]{6}$') THEN
            RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: GL account code must be 7 digits starting with 1-5 (account type)';
        END IF;
    END IF;
    
    -- Validate smart code format for all entities
    IF NEW.smart_code IS NOT NULL AND 
       NOT (NEW.smart_code ~ '^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid smart_code format. Must follow pattern HERA.{INDUSTRY}.{MODULE}.{TYPE}.V{VERSION}';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply entity standards trigger to core_entities
DROP TRIGGER IF EXISTS trigger_enforce_entity_standards ON core_entities;
CREATE TRIGGER trigger_enforce_entity_standards
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW EXECUTE FUNCTION enforce_entity_standards();

-- Also ensure the transaction lines trigger doesn't have issues
CREATE OR REPLACE FUNCTION enforce_transaction_line_gl_accounts()
RETURNS TRIGGER AS $$
DECLARE
    gl_account_exists BOOLEAN;
    entity_is_gl_account BOOLEAN;
    transaction_org_id UUID;
BEGIN
    -- Get organization_id from parent transaction
    SELECT organization_id INTO transaction_org_id
    FROM universal_transactions 
    WHERE id = NEW.transaction_id;
    
    IF transaction_org_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Cannot find parent transaction for line item';
    END IF;

    -- Ensure line has organization_id matching parent transaction
    NEW.organization_id := transaction_org_id;

    -- Note: gl_account_code doesn't exist in schema, using line_entity_id instead
    -- 🔐 ENFORCE: If line_entity_id provided, it should be a valid entity
    IF NEW.line_entity_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.line_entity_id
              AND organization_id = transaction_org_id
              AND status = 'active'
        ) THEN
            RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Entity % does not exist in organization %', NEW.line_entity_id, transaction_org_id;
        END IF;
    END IF;

    -- Validate smart code if provided
    IF NEW.smart_code IS NOT NULL AND 
       NOT (NEW.smart_code ~ '^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid line smart_code format';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the transaction lines trigger with corrected logic
DROP TRIGGER IF EXISTS trigger_enforce_line_gl_accounts ON universal_transaction_lines;
CREATE TRIGGER trigger_enforce_line_gl_accounts
    BEFORE INSERT OR UPDATE ON universal_transaction_lines
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_line_gl_accounts();

-- Add comment explaining the fix
COMMENT ON FUNCTION enforce_transaction_standards() IS 'Fixed version that removes problematic audit log insertion that caused foreign key violations during entity creation';