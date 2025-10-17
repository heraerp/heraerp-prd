-- HERA Actor Validation Functions
-- ================================
-- Implements v2.2 actor validation and hardening triggers

-- Actor validation trigger function
CREATE OR REPLACE FUNCTION hera_validate_actor_stamping()
RETURNS TRIGGER AS $$
DECLARE
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Enforce non-null created_by on INSERT
    IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
        RAISE EXCEPTION 'HERA_AUDIT_VIOLATION: created_by cannot be NULL (table: %, Architecture v2.2)', TG_TABLE_NAME
            USING HINT = 'All writes must include p_actor_user_id parameter';
    END IF;
    
    -- Enforce non-null updated_by on INSERT/UPDATE
    IF NEW.updated_by IS NULL THEN
        RAISE EXCEPTION 'HERA_AUDIT_VIOLATION: updated_by cannot be NULL (table: %, Architecture v2.2)', TG_TABLE_NAME
            USING HINT = 'All writes must include p_actor_user_id parameter';
    END IF;
    
    -- Validate actor is a USER entity (for created_by)
    IF TG_OP = 'INSERT' AND NOT EXISTS (
        SELECT 1 FROM core_entities 
        WHERE id = NEW.created_by 
        AND entity_type = 'USER'
        AND organization_id = v_platform_org_id
    ) THEN
        RAISE EXCEPTION 'HERA_AUDIT_VIOLATION: created_by must reference valid USER entity (table: %)', TG_TABLE_NAME
            USING HINT = 'Use resolve_user_identity_v1() to get valid actor user ID';
    END IF;
    
    -- Validate actor is a USER entity (for updated_by)
    IF NOT EXISTS (
        SELECT 1 FROM core_entities 
        WHERE id = NEW.updated_by 
        AND entity_type = 'USER'
        AND organization_id = v_platform_org_id
    ) THEN
        RAISE EXCEPTION 'HERA_AUDIT_VIOLATION: updated_by must reference valid USER entity (table: %)', TG_TABLE_NAME
            USING HINT = 'Use resolve_user_identity_v1() to get valid actor user ID';
    END IF;
    
    -- For tables with organization_id, validate membership
    IF TG_TABLE_NAME != 'core_organizations' AND 
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = TG_TABLE_NAME 
               AND column_name = 'organization_id') THEN
        
        -- Check membership for created_by (INSERT only)
        IF TG_OP = 'INSERT' AND NOT EXISTS (
            SELECT 1 FROM core_relationships
            WHERE source_entity_id = NEW.created_by
            AND target_entity_id = NEW.organization_id
            AND relationship_type = 'USER_MEMBER_OF_ORG'
        ) THEN
            RAISE EXCEPTION 'HERA_MEMBERSHIP_VIOLATION: created_by actor (%) not member of organization (%) for table %', 
                NEW.created_by, NEW.organization_id, TG_TABLE_NAME;
        END IF;
        
        -- Check membership for updated_by
        IF NOT EXISTS (
            SELECT 1 FROM core_relationships
            WHERE source_entity_id = NEW.updated_by
            AND target_entity_id = NEW.organization_id
            AND relationship_type = 'USER_MEMBER_OF_ORG'
        ) THEN
            RAISE EXCEPTION 'HERA_MEMBERSHIP_VIOLATION: updated_by actor (%) not member of organization (%) for table %', 
                NEW.updated_by, NEW.organization_id, TG_TABLE_NAME;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organization ID validation trigger
CREATE OR REPLACE FUNCTION hera_validate_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip validation for core_organizations table
    IF TG_TABLE_NAME = 'core_organizations' THEN
        RETURN NEW;
    END IF;
    
    -- Enforce organization_id presence
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_GUARDRAIL_VIOLATION: organization_id cannot be NULL (table: %)', TG_TABLE_NAME
            USING HINT = 'All Sacred Six writes must include organization_id for multi-tenant isolation';
    END IF;
    
    -- Validate organization exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM core_organizations
        WHERE id = NEW.organization_id
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'HERA_ORGANIZATION_INVALID: organization (%) not found or inactive (table: %)', 
            NEW.organization_id, TG_TABLE_NAME;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Smart code validation trigger
CREATE OR REPLACE FUNCTION hera_validate_smart_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if table doesn't have smart_code column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND column_name = 'smart_code'
    ) THEN
        RETURN NEW;
    END IF;
    
    -- Enforce smart_code presence for tables that have it
    IF NEW.smart_code IS NULL THEN
        RAISE EXCEPTION 'HERA_GUARDRAIL_VIOLATION: smart_code cannot be NULL (table: %)', TG_TABLE_NAME
            USING HINT = 'Use HERA smart code pattern: HERA.MODULE.TYPE.SUBTYPE.V#';
    END IF;
    
    -- Validate smart_code pattern
    IF NOT (NEW.smart_code ~ '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$') THEN
        RAISE EXCEPTION 'HERA_GUARDRAIL_VIOLATION: smart_code pattern invalid (%) for table %', 
            NEW.smart_code, TG_TABLE_NAME
            USING HINT = 'Must match pattern: HERA.MODULE.TYPE.SUBTYPE.V# (all UPPERCASE)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable hardening triggers function
CREATE OR REPLACE FUNCTION hera_enable_hardening_triggers()
RETURNS VOID AS $$
DECLARE
    v_table_name TEXT;
    v_tables TEXT[] := ARRAY[
        'core_entities',
        'universal_transactions', 
        'universal_transaction_lines',
        'core_relationships',
        'core_dynamic_data',
        'core_organizations'
    ];
BEGIN
    FOREACH v_table_name IN ARRAY v_tables LOOP
        -- Drop existing triggers to avoid conflicts
        EXECUTE format('DROP TRIGGER IF EXISTS trg_actor_stamping ON %I', v_table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_organization_validation ON %I', v_table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_smart_code_validation ON %I', v_table_name);
        
        -- Create actor stamping trigger
        EXECUTE format('
            CREATE TRIGGER trg_actor_stamping
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION hera_validate_actor_stamping()', v_table_name);
        
        -- Create organization validation trigger (skip for core_organizations)
        IF v_table_name != 'core_organizations' THEN
            EXECUTE format('
                CREATE TRIGGER trg_organization_validation
                BEFORE INSERT OR UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION hera_validate_organization_id()', v_table_name);
        END IF;
        
        -- Create smart code validation trigger
        EXECUTE format('
            CREATE TRIGGER trg_smart_code_validation
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION hera_validate_smart_code()', v_table_name);
        
        RAISE NOTICE 'Enabled hardening triggers for table: %', v_table_name;
    END LOOP;
    
    RAISE NOTICE 'All hardening triggers enabled successfully';
END;
$$ LANGUAGE plpgsql;

-- Disable hardening triggers function (for rollback)
CREATE OR REPLACE FUNCTION hera_disable_hardening_triggers()
RETURNS VOID AS $$
DECLARE
    v_table_name TEXT;
    v_tables TEXT[] := ARRAY[
        'core_entities',
        'universal_transactions', 
        'universal_transaction_lines',
        'core_relationships',
        'core_dynamic_data',
        'core_organizations'
    ];
BEGIN
    FOREACH v_table_name IN ARRAY v_tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_actor_stamping ON %I', v_table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_organization_validation ON %I', v_table_name);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_smart_code_validation ON %I', v_table_name);
        
        RAISE NOTICE 'Disabled hardening triggers for table: %', v_table_name;
    END LOOP;
    
    RAISE NOTICE 'All hardening triggers disabled successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_enable_hardening_triggers() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_disable_hardening_triggers() TO authenticated;

-- Add function documentation
COMMENT ON FUNCTION hera_validate_actor_stamping() IS 'Validates actor stamping compliance on all Sacred Six tables';
COMMENT ON FUNCTION hera_validate_organization_id() IS 'Validates organization_id presence and validity';
COMMENT ON FUNCTION hera_validate_smart_code() IS 'Validates smart_code pattern compliance';
COMMENT ON FUNCTION hera_enable_hardening_triggers() IS 'Enables all HERA v2.2 hardening triggers';
COMMENT ON FUNCTION hera_disable_hardening_triggers() IS 'Disables all hardening triggers for rollback';