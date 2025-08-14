-- ================================================================================
-- HERA PHASE 1: AUTHENTICATION INTEGRATION SQL SCHEMA & TESTS
-- Universal 6-Table Architecture with Native Authentication Support
-- FIXED: Proper SQL syntax without dollar quoting issues
-- ================================================================================

-- ================================================================================
-- PRE-FLIGHT: DIAGNOSE EXISTING SCHEMA
-- ================================================================================

-- Diagnostic: Show all HERA table structures
SELECT 
    'HERA Tables Schema Analysis' as analysis_type,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines')
ORDER BY table_name, ordinal_position;

-- Check field types for auth integration
SELECT 
    'Field Types Check' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines')
AND column_name IN ('created_by', 'updated_by', 'id', 'organization_id')
ORDER BY table_name, column_name;

-- ================================================================================
-- STEP 1: VERIFY CORE 6-TABLE SCHEMA EXISTS
-- ================================================================================

-- Check if all required tables exist
SELECT 
    CASE 
        WHEN COUNT(*) = 6 THEN 'All 6 HERA tables exist'
        ELSE 'Missing tables: ' || (6 - COUNT(*))::TEXT
    END as table_check
FROM information_schema.tables 
WHERE table_name IN ('core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines');

-- ================================================================================
-- STEP 2: ENHANCE EXISTING TABLES FOR AUTHENTICATION
-- ================================================================================

-- Add auth columns to core_organizations if they don't exist
ALTER TABLE core_organizations 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS auth_settings JSONB DEFAULT '{}';

-- Add auth columns to core_entities if they don't exist
ALTER TABLE core_entities 
ADD COLUMN IF NOT EXISTS auth_user_id UUID,
ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Add auth columns to universal_transactions if they don't exist
ALTER TABLE universal_transactions 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET;

-- ================================================================================
-- STEP 3: CREATE AUTHENTICATION-SPECIFIC INDEXES
-- ================================================================================

-- Create indexes for auth performance
CREATE INDEX IF NOT EXISTS idx_entities_auth_user_id ON core_entities(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_entities_type_auth ON core_entities(entity_type, auth_user_id) WHERE entity_type = 'user';
CREATE INDEX IF NOT EXISTS idx_dynamic_data_auth_fields ON core_dynamic_data(entity_id, field_name) WHERE field_name IN ('email', 'role', 'permissions');
CREATE INDEX IF NOT EXISTS idx_transactions_auth_tracking ON universal_transactions(transaction_type, source_entity_id) WHERE transaction_type IN ('user_login', 'user_logout', 'password_change');

-- ================================================================================
-- STEP 4: CREATE HELPER FUNCTIONS (WITHOUT DOLLAR QUOTING)
-- ================================================================================

-- Function to create test organization
CREATE OR REPLACE FUNCTION create_test_organization(
    p_org_name TEXT,
    p_org_type TEXT
) RETURNS UUID AS '
DECLARE
    v_org_id UUID;
    v_creator_value TEXT;
BEGIN
    v_creator_value := gen_random_uuid()::TEXT;
    
    INSERT INTO core_organizations (
        organization_name,
        organization_type,
        status,
        settings,
        created_by,
        updated_by
    ) VALUES (
        p_org_name,
        p_org_type,
        ''active'',
        ''{"test_mode": true}''::JSONB,
        v_creator_value,
        v_creator_value
    )
    RETURNING id INTO v_org_id;
    
    RETURN v_org_id;
END;
' LANGUAGE plpgsql;

-- Function to create user entity from auth
CREATE OR REPLACE FUNCTION create_user_entity(
    p_auth_user_id UUID,
    p_organization_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_role TEXT DEFAULT 'user'
) RETURNS UUID AS '
DECLARE
    v_user_entity_id UUID;
    v_entity_code TEXT;
BEGIN
    v_entity_code := ''USER-'' || UPPER(SUBSTRING(p_email FROM 1 FOR 3)) || ''-'' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        auth_user_id,
        status,
        created_by,
        updated_by
    ) VALUES (
        p_organization_id,
        ''user'',
        p_full_name,
        v_entity_code,
        p_auth_user_id,
        ''active'',
        p_auth_user_id::TEXT,
        p_auth_user_id::TEXT
    )
    RETURNING id INTO v_user_entity_id;
    
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value,
        created_by,
        updated_by
    ) VALUES 
    (p_organization_id, v_user_entity_id, ''email'', ''text'', p_email, p_auth_user_id::TEXT, p_auth_user_id::TEXT),
    (p_organization_id, v_user_entity_id, ''role'', ''text'', p_role, p_auth_user_id::TEXT, p_auth_user_id::TEXT),
    (p_organization_id, v_user_entity_id, ''permissions'', ''json'', ''[]'', p_auth_user_id::TEXT, p_auth_user_id::TEXT);
    
    INSERT INTO core_relationships (
        organization_id,
        source_entity_id,
        target_entity_id,
        relationship_type,
        relationship_strength,
        created_by,
        updated_by
    ) VALUES (
        p_organization_id,
        v_user_entity_id,
        p_organization_id,
        ''member_of'',
        1.0,
        p_auth_user_id::TEXT,
        p_auth_user_id::TEXT
    );
    
    RETURN v_user_entity_id;
END;
' LANGUAGE plpgsql;

-- Function to track user login
CREATE OR REPLACE FUNCTION track_user_login(
    p_user_entity_id UUID,
    p_organization_id UUID,
    p_session_id TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
) RETURNS UUID AS '
DECLARE
    v_transaction_id UUID;
BEGIN
    UPDATE core_entities 
    SET 
        last_login_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_user_entity_id;
    
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        transaction_number,
        transaction_date,
        source_entity_id,
        total_amount,
        currency,
        status,
        session_id,
        user_agent,
        ip_address,
        metadata,
        created_by,
        updated_by
    ) VALUES (
        p_organization_id,
        ''user_login'',
        ''LOGIN-'' || TO_CHAR(NOW(), ''YYYYMMDD-HH24MISS'') || ''-'' || SUBSTRING(p_session_id FROM 1 FOR 8),
        NOW(),
        p_user_entity_id,
        0,
        ''USD'',
        ''completed'',
        p_session_id,
        p_user_agent,
        p_ip_address,
        ''{"login_type": "standard", "timestamp": "'' || NOW()::TEXT || ''"}''::JSONB,
        p_user_entity_id::TEXT,
        p_user_entity_id::TEXT
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
' LANGUAGE plpgsql;

-- Simple function to get user auth context as JSONB (no type conflicts)
CREATE OR REPLACE FUNCTION get_user_auth_context_json(
    p_auth_user_id UUID
) RETURNS JSONB AS '
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        ''user_entity_id'', e.id,
        ''organization_id'', e.organization_id,
        ''organization_name'', o.organization_name,
        ''user_name'', e.entity_name,
        ''email'', dd_email.field_value,
        ''role'', dd_role.field_value,
        ''permissions'', dd_perms.field_value_json,
        ''last_login'', e.last_login_at,
        ''login_count'', e.login_count
    ) INTO v_result
    FROM core_entities e
    JOIN core_organizations o ON e.organization_id = o.id
    LEFT JOIN core_dynamic_data dd_email ON e.id = dd_email.entity_id AND dd_email.field_name = ''email''
    LEFT JOIN core_dynamic_data dd_role ON e.id = dd_role.entity_id AND dd_role.field_name = ''role''
    LEFT JOIN core_dynamic_data dd_perms ON e.id = dd_perms.entity_id AND dd_perms.field_name = ''permissions''
    WHERE e.auth_user_id = p_auth_user_id
    AND e.entity_type = ''user''
    AND e.status = ''active''
    LIMIT 1;
    
    RETURN COALESCE(v_result, ''{}''::JSONB);
END;
' LANGUAGE plpgsql;

-- ================================================================================
-- STEP 5: CREATE TEST DATA AND VERIFY INTEGRATION
-- ================================================================================

-- Simple test without temp tables - just direct execution and output
SELECT 'Starting HERA Auth Integration Tests...' as test_status;

-- Test 1: Create test organization and user data
DO $do$
DECLARE
    v_test_org_id UUID;
    v_test_user_id UUID;
    v_auth_user_id UUID := gen_random_uuid();
    v_login_transaction_id UUID;
BEGIN
    -- Create test organization
    SELECT create_test_organization('Test Restaurant Co', 'restaurant') INTO v_test_org_id;
    RAISE NOTICE 'Created test organization: %', v_test_org_id;
    
    -- Create test user entity
    SELECT create_user_entity(
        v_auth_user_id,
        v_test_org_id,
        'test@restaurant.com',
        'Test Owner',
        'owner'
    ) INTO v_test_user_id;
    RAISE NOTICE 'Created test user entity: %', v_test_user_id;
    
    -- Track login
    SELECT track_user_login(
        v_test_user_id,
        v_test_org_id,
        'test-session-123',
        'Mozilla/5.0 Test Browser',
        '192.168.1.1'::INET
    ) INTO v_login_transaction_id;
    RAISE NOTICE 'Created login transaction: %', v_login_transaction_id;
    
    RAISE NOTICE 'All test data created successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test data creation failed: %', SQLERRM;
        RAISE NOTICE 'This might indicate schema differences or missing columns';
END $do$;

-- ================================================================================
-- STEP 6: VERIFICATION QUERIES
-- ================================================================================

-- Test 2: Verify user entity creation
SELECT 
    'User Entities Verification' as test_name,
    COUNT(*) as user_count,
    jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'name', e.entity_name,
            'auth_user_id', e.auth_user_id,
            'organization', o.organization_name
        )
    ) as users_created
FROM core_entities e
JOIN core_organizations o ON e.organization_id = o.id
WHERE e.entity_type = 'user';

-- Test 3: Verify dynamic auth fields
SELECT 
    'Dynamic Auth Fields' as test_name,
    COUNT(*) as field_count,
    jsonb_agg(
        jsonb_build_object(
            'field_name', field_name,
            'field_value', field_value
        )
    ) as auth_fields
FROM core_dynamic_data 
WHERE field_name IN ('email', 'role', 'permissions');

-- Test 4: Verify user-organization relationships
SELECT 
    'User-Organization Relationships' as test_name,
    COUNT(*) as relationship_count,
    jsonb_agg(
        jsonb_build_object(
            'user_name', u.entity_name,
            'organization', o.organization_name,
            'relationship_type', r.relationship_type
        )
    ) as relationships
FROM core_entities u
JOIN core_relationships r ON u.id = r.source_entity_id
JOIN core_organizations o ON r.target_entity_id::UUID = o.id
WHERE u.entity_type = 'user' AND r.relationship_type = 'member_of';

-- Test 5: Verify login tracking
SELECT 
    'Login Tracking Verification' as test_name,
    COUNT(*) as login_count,
    jsonb_agg(
        jsonb_build_object(
            'transaction_number', t.transaction_number,
            'user_name', e.entity_name,
            'session_id', t.session_id,
            'ip_address', t.ip_address::TEXT
        )
    ) as login_transactions
FROM universal_transactions t
JOIN core_entities e ON t.source_entity_id = e.id
WHERE t.transaction_type = 'user_login';

-- Test 6: Test auth context function
SELECT 
    'Auth Context Function Test' as test_name,
    get_user_auth_context_json(
        (SELECT auth_user_id FROM core_entities WHERE entity_type = 'user' AND auth_user_id IS NOT NULL LIMIT 1)
    ) as auth_context;

-- ================================================================================
-- FINAL VALIDATION SUMMARY
-- ================================================================================

-- Show simple success message
SELECT 'HERA Auth Integration Tests Completed' as status;

-- Final integration summary
SELECT 
    'HERA Auth Integration Summary' as component,
    jsonb_build_object(
        'organizations_count', (SELECT COUNT(*) FROM core_organizations),
        'user_entities_count', (SELECT COUNT(*) FROM core_entities WHERE entity_type = 'user'),
        'auth_dynamic_fields', (SELECT COUNT(*) FROM core_dynamic_data WHERE field_name IN ('email', 'role', 'permissions')),
        'user_relationships', (SELECT COUNT(*) FROM core_relationships WHERE relationship_type = 'member_of'),
        'login_transactions', (SELECT COUNT(*) FROM universal_transactions WHERE transaction_type = 'user_login'),
        'auth_columns_added', (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name IN ('core_organizations', 'core_entities', 'universal_transactions')
            AND column_name IN ('auth_provider', 'auth_user_id', 'session_id', 'user_agent', 'ip_address')
        ),
        'indexes_created', (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%auth%'),
        'helper_functions', (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('create_user_entity', 'track_user_login', 'get_user_auth_context_json'))
    ) as summary;

-- Show enhanced schema
SELECT 
    'Enhanced Schema Verification' as verification_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('core_organizations', 'core_entities', 'universal_transactions')
AND column_name IN ('auth_provider', 'auth_user_id', 'session_id', 'user_agent', 'ip_address', 'last_login_at', 'login_count')
ORDER BY table_name, column_name;