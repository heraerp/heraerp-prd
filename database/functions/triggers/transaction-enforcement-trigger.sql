/**
 * 🔐 HERA Transaction Enforcement Database Triggers
 * Smart Code: HERA.DB.TRIGGERS.ENFORCEMENT.v1
 * 
 * Database-level enforcement of COA and Document Number requirements
 * SACRED: These triggers ensure data integrity at the lowest level
 */

-- ===============================================
-- 1. Universal Transactions Enforcement Trigger
-- ===============================================

CREATE OR REPLACE FUNCTION enforce_transaction_standards()
RETURNS TRIGGER AS $$
DECLARE
    coa_count INTEGER;
    doc_number_exists BOOLEAN;
    line_count INTEGER;
    invalid_gl_count INTEGER;
BEGIN
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

    -- 🔐 ENFORCE: Transaction must have document number
    IF NEW.transaction_number IS NULL OR LENGTH(TRIM(NEW.transaction_number)) = 0 THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Transaction number is required. Use enforceTransactionStandards() to generate.';
    END IF;

    -- 🔐 ENFORCE: Business reference number required for audit trail
    IF NEW.reference_number IS NULL OR LENGTH(TRIM(NEW.reference_number)) = 0 THEN
        -- Auto-generate reference number if missing
        NEW.reference_number := 'AUTO-' || EXTRACT(YEAR FROM CURRENT_DATE) || 
                               LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || '-' ||
                               EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT;
        
        -- Log auto-generation for audit
        INSERT INTO core_entities (
            organization_id,
            entity_type, 
            entity_name,
            description,
            metadata
        ) VALUES (
            NEW.organization_id,
            'audit_log',
            'Auto-generated Reference Number',
            'System auto-generated reference number for transaction: ' || NEW.transaction_number,
            jsonb_build_object(
                'transaction_id', NEW.id,
                'auto_generated_reference', NEW.reference_number,
                'reason', 'Missing reference number',
                'timestamp', CURRENT_TIMESTAMP,
                'smart_code', 'HERA.AUDIT.AUTO.REFERENCE.v1'
            )
        );
    END IF;

    -- 🔐 ENFORCE: Smart code pattern validation
    IF NEW.metadata->>'smart_code' IS NULL OR 
       NOT (NEW.metadata->>'smart_code' ~ '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v[0-9]+$') THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid or missing smart_code. Must follow pattern HERA.{INDUSTRY}.{MODULE}.{TYPE}.v{VERSION}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to universal_transactions
DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON universal_transactions;
CREATE TRIGGER trigger_enforce_transaction_standards
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_standards();

-- ===============================================
-- 2. Transaction Lines GL Account Enforcement
-- ===============================================

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

    -- 🔐 ENFORCE: Line must reference a GL account (either by code or entity_id)
    IF NEW.gl_account_code IS NULL AND NEW.entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Transaction line must reference a GL account via gl_account_code or entity_id';
    END IF;

    -- 🔐 ENFORCE: If gl_account_code provided, it must exist in organization's COA
    IF NEW.gl_account_code IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM core_entities 
            WHERE organization_id = transaction_org_id
              AND entity_type = 'gl_account'
              AND entity_code = NEW.gl_account_code
              AND status = 'active'
        ) INTO gl_account_exists;
        
        IF NOT gl_account_exists THEN
            RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: GL account code % does not exist in organization COA', NEW.gl_account_code;
        END IF;
    END IF;

    -- 🔐 ENFORCE: If entity_id provided, it must be a GL account in same organization
    IF NEW.entity_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM core_entities 
            WHERE id = NEW.entity_id
              AND organization_id = transaction_org_id
              AND entity_type = 'gl_account'
              AND status = 'active'
        ) INTO entity_is_gl_account;
        
        IF NOT entity_is_gl_account THEN
            RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Entity % is not a valid GL account in organization %', NEW.entity_id, transaction_org_id;
        END IF;
    END IF;

    -- 🔐 ENFORCE: Sync entity_id and gl_account_code if one is missing
    IF NEW.entity_id IS NULL AND NEW.gl_account_code IS NOT NULL THEN
        SELECT id INTO NEW.entity_id
        FROM core_entities 
        WHERE organization_id = transaction_org_id
          AND entity_type = 'gl_account'
          AND entity_code = NEW.gl_account_code
          AND status = 'active'
        LIMIT 1;
    END IF;

    IF NEW.gl_account_code IS NULL AND NEW.entity_id IS NOT NULL THEN
        SELECT entity_code INTO NEW.gl_account_code
        FROM core_entities 
        WHERE id = NEW.entity_id
          AND organization_id = transaction_org_id
          AND entity_type = 'gl_account'
          AND status = 'active';
    END IF;

    -- 🔐 ENFORCE: Smart code pattern for line items
    IF NEW.metadata->>'smart_code' IS NULL THEN
        NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
            'smart_code', 
            'HERA.GL.LINE.' || 
            CASE WHEN NEW.gl_account_code ~ '^1' THEN 'ASSET'
                 WHEN NEW.gl_account_code ~ '^2' THEN 'LIABILITY'
                 WHEN NEW.gl_account_code ~ '^3' THEN 'EQUITY'
                 WHEN NEW.gl_account_code ~ '^4' THEN 'REVENUE'
                 WHEN NEW.gl_account_code ~ '^5' THEN 'EXPENSE'
                 ELSE 'UNKNOWN'
            END || '.' || NEW.gl_account_code || '.v1'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to universal_transaction_lines
DROP TRIGGER IF EXISTS trigger_enforce_line_gl_accounts ON universal_transaction_lines;
CREATE TRIGGER trigger_enforce_line_gl_accounts
    BEFORE INSERT OR UPDATE ON universal_transaction_lines
    FOR EACH ROW EXECUTE FUNCTION enforce_transaction_line_gl_accounts();

-- ===============================================
-- 3. COA Creation Enforcement
-- ===============================================

CREATE OR REPLACE FUNCTION enforce_coa_standards()
RETURNS TRIGGER AS $$
BEGIN
    -- 🔐 ENFORCE: GL accounts must have proper account codes
    IF NEW.entity_type = 'gl_account' THEN
        -- Account code format validation (7 digits)
        IF NEW.entity_code IS NULL OR NOT (NEW.entity_code ~ '^[1-5][0-9]{6}$') THEN
            RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: GL account code must be 7 digits starting with 1-5 (account type)';
        END IF;
        
        -- Auto-assign smart code based on account type
        IF NEW.metadata->>'smart_code' IS NULL THEN
            NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
                'smart_code',
                'HERA.COA.ACCOUNT.' ||
                CASE WHEN NEW.entity_code ~ '^1' THEN 'ASSET'
                     WHEN NEW.entity_code ~ '^2' THEN 'LIABILITY'
                     WHEN NEW.entity_code ~ '^3' THEN 'EQUITY'
                     WHEN NEW.entity_code ~ '^4' THEN 'REVENUE'
                     WHEN NEW.entity_code ~ '^5' THEN 'EXPENSE'
                     ELSE 'UNKNOWN'
                END || '.' || NEW.entity_code || '.v1'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to core_entities for GL account creation
DROP TRIGGER IF EXISTS trigger_enforce_coa_standards ON core_entities;
CREATE TRIGGER trigger_enforce_coa_standards
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW 
    WHEN (NEW.entity_type = 'gl_account')
    EXECUTE FUNCTION enforce_coa_standards();

-- ===============================================
-- 4. Document Number Uniqueness Enforcement
-- ===============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_number_org 
ON universal_transactions (organization_id, transaction_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reference_number_org_type 
ON universal_transactions (organization_id, transaction_type, reference_number) 
WHERE reference_number IS NOT NULL;

-- ===============================================
-- 5. Audit Log for Enforcement Actions
-- ===============================================

CREATE OR REPLACE FUNCTION log_enforcement_action(
    p_organization_id UUID,
    p_action TEXT,
    p_details JSONB,
    p_severity TEXT DEFAULT 'INFO'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_name,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        'enforcement_log',
        'Transaction Enforcement Action',
        p_action,
        jsonb_build_object(
            'action', p_action,
            'details', p_details,
            'severity', p_severity,
            'timestamp', CURRENT_TIMESTAMP,
            'smart_code', 'HERA.ENFORCEMENT.LOG.' || UPPER(p_severity) || '.v1'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 6. Enforcement Status Function
-- ===============================================

CREATE OR REPLACE FUNCTION check_organization_enforcement_readiness(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
    coa_count INTEGER;
    required_accounts TEXT[];
    missing_accounts TEXT[];
    account_code TEXT;
    result JSONB;
BEGIN
    -- Count total GL accounts
    SELECT COUNT(*) INTO coa_count
    FROM core_entities 
    WHERE organization_id = p_organization_id 
      AND entity_type = 'gl_account'
      AND status = 'active';
    
    -- Check for required account categories
    required_accounts := ARRAY['1100000', '2100000', '4110000', '5130000']; -- Cash, AP, Revenue, Expenses
    missing_accounts := ARRAY[]::TEXT[];
    
    FOREACH account_code IN ARRAY required_accounts
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = p_organization_id 
              AND entity_type = 'gl_account'
              AND entity_code = account_code
              AND status = 'active'
        ) THEN
            missing_accounts := array_append(missing_accounts, account_code);
        END IF;
    END LOOP;
    
    result := jsonb_build_object(
        'organization_id', p_organization_id,
        'coa_exists', coa_count > 0,
        'total_accounts', coa_count,
        'enforcement_ready', coa_count > 0 AND array_length(missing_accounts, 1) IS NULL,
        'missing_required_accounts', missing_accounts,
        'last_checked', CURRENT_TIMESTAMP,
        'smart_code', 'HERA.ENFORCEMENT.STATUS.CHECK.v1'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;