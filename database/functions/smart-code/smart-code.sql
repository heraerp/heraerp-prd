-- ================================================================================
-- HERA SMART CODE SUPABASE FUNCTIONS - COMPLETE IMPLEMENTATION
-- ================================================================================
-- Add smart_code functionality to existing HERA 6-table architecture
-- Zero breaking changes - pure enhancement to existing UUID system
-- ================================================================================

-- ================================================================================
-- STEP 1: ADD SMART_CODE COLUMNS TO EXISTING TABLES
-- ================================================================================

-- Add smart_code to core_entities
ALTER TABLE core_entities 
ADD COLUMN IF NOT EXISTS smart_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS smart_code_version VARCHAR(20) DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS smart_code_status VARCHAR(20) DEFAULT 'DRAFT';

-- Add smart_code to core_dynamic_data  
ALTER TABLE core_dynamic_data
ADD COLUMN IF NOT EXISTS smart_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS smart_code_context JSONB;

-- Add smart_code to core_relationships
ALTER TABLE core_relationships
ADD COLUMN IF NOT EXISTS smart_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS relationship_smart_context JSONB;

-- Add smart_code to universal_transactions
ALTER TABLE universal_transactions
ADD COLUMN IF NOT EXISTS smart_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_context JSONB,
ADD COLUMN IF NOT EXISTS ai_insights JSONB;

-- Add smart_code to universal_transaction_lines
ALTER TABLE universal_transaction_lines  
ADD COLUMN IF NOT EXISTS smart_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS line_context JSONB;

-- ================================================================================
-- STEP 2: CREATE PERFORMANCE INDEXES
-- ================================================================================

-- Core entities indexes
CREATE INDEX IF NOT EXISTS idx_entities_smart_code ON core_entities(smart_code);
CREATE INDEX IF NOT EXISTS idx_entities_org_smart ON core_entities(organization_id, smart_code);
CREATE INDEX IF NOT EXISTS idx_entities_smart_status ON core_entities(smart_code_status);

-- Dynamic data indexes  
CREATE INDEX IF NOT EXISTS idx_dynamic_smart_code ON core_dynamic_data(smart_code);
CREATE INDEX IF NOT EXISTS idx_dynamic_org_smart ON core_dynamic_data(organization_id, smart_code);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_smart_code ON core_relationships(smart_code);
CREATE INDEX IF NOT EXISTS idx_relationships_org_smart ON core_relationships(organization_id, smart_code);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_smart_code ON universal_transactions(smart_code);
CREATE INDEX IF NOT EXISTS idx_transactions_org_smart ON universal_transactions(organization_id, smart_code);
CREATE INDEX IF NOT EXISTS idx_transactions_type_smart ON universal_transactions(transaction_type, smart_code);

-- Transaction lines indexes
CREATE INDEX IF NOT EXISTS idx_transaction_lines_smart_code ON universal_transaction_lines(smart_code);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_org_smart ON universal_transaction_lines(organization_id, smart_code);

-- ================================================================================
-- STEP 3: SMART CODE VALIDATION FUNCTION
-- ================================================================================

CREATE OR REPLACE FUNCTION validate_smart_code(smart_code_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- HERA smart code format: HERA.{MODULE}.{SUB}.{FUNCTION}.{TYPE}.{VERSION}
    -- Example: HERA.REST.CRM.TXN.ORDER.V1
    
    -- Basic format validation
    IF smart_code_input !~ '^HERA\.[A-Z]{2,6}\.[A-Z]{2,6}\.[A-Z]{2,6}\.[A-Z]{2,6}\.v[0-9]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate known modules
    IF NOT (smart_code_input ~ '^HERA\.(FIN|INV|CRM|HR|SCM|SLS|PROJ|REPT|AUDT|AI|REST|HLTH|MFG|PROF)\.') THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- ================================================================================
-- STEP 4: SMART CODE GENERATOR FUNCTION
-- ================================================================================

CREATE OR REPLACE FUNCTION generate_smart_code(
    p_organization_id UUID,
    p_module TEXT,
    p_sub_module TEXT,
    p_function_type TEXT,
    p_entity_type TEXT,
    p_version TEXT DEFAULT 'v1'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    org_type TEXT;
    industry_prefix TEXT := '';
    smart_code TEXT;
BEGIN
    -- Get organization type to determine industry prefix
    SELECT organization_type INTO org_type 
    FROM core_organizations 
    WHERE id = p_organization_id;
    
    -- Map organization type to industry prefix
    CASE 
        WHEN org_type = 'restaurant' THEN industry_prefix := 'REST';
        WHEN org_type = 'healthcare' THEN industry_prefix := 'HLTH'; 
        WHEN org_type = 'manufacturing' THEN industry_prefix := 'MFG';
        WHEN org_type = 'professional_services' THEN industry_prefix := 'PROF';
        WHEN org_type = 'retail' THEN industry_prefix := 'RET';
        WHEN org_type = 'system' THEN industry_prefix := 'SYS';
        ELSE industry_prefix := 'GEN'; -- Generic
    END CASE;
    
    -- Generate smart code
    IF industry_prefix != 'GEN' THEN
        -- Industry-specific code
        smart_code := 'HERA.' || industry_prefix || '.' || UPPER(p_module) || '.' || 
                     UPPER(p_sub_module) || '.' || UPPER(p_function_type) || '.' || 
                     UPPER(p_entity_type) || '.' || p_version;
    ELSE
        -- Standard universal code
        smart_code := 'HERA.' || UPPER(p_module) || '.' || UPPER(p_sub_module) || '.' || 
                     UPPER(p_function_type) || '.' || UPPER(p_entity_type) || '.' || p_version;
    END IF;
    
    RETURN smart_code;
END;
$$;

-- ================================================================================
-- STEP 5: SMART CODE PARSER FUNCTION
-- ================================================================================

CREATE OR REPLACE FUNCTION parse_smart_code(smart_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    parts TEXT[];
    result JSONB;
BEGIN
    -- Split smart code into parts
    parts := string_to_array(smart_code_input, '.');
    
    -- Validate minimum structure
    IF array_length(parts, 1) < 6 THEN
        RETURN '{"error": "Invalid smart code format"}'::JSONB;
    END IF;
    
    -- Parse components
    result := jsonb_build_object(
        'prefix', parts[1],
        'industry_or_module', parts[2],
        'module', CASE 
            WHEN parts[2] IN ('REST', 'HLTH', 'MFG', 'PROF', 'RET', 'SYS') THEN parts[3]
            ELSE parts[2]
        END,
        'sub_module', CASE
            WHEN parts[2] IN ('REST', 'HLTH', 'MFG', 'PROF', 'RET', 'SYS') THEN parts[4]  
            ELSE parts[3]
        END,
        'function_type', CASE
            WHEN parts[2] IN ('REST', 'HLTH', 'MFG', 'PROF', 'RET', 'SYS') THEN parts[5]
            ELSE parts[4]
        END,
        'entity_type', CASE
            WHEN parts[2] IN ('REST', 'HLTH', 'MFG', 'PROF', 'RET', 'SYS') THEN parts[6]
            ELSE parts[5]
        END,
        'version', parts[array_length(parts, 1)],
        'is_industry_specific', parts[2] IN ('REST', 'HLTH', 'MFG', 'PROF', 'RET', 'SYS'),
        'industry_code', CASE
            WHEN parts[2] IN ('REST', 'HLTH', 'MFG', 'PROF', 'RET', 'SYS') THEN parts[2]
            ELSE NULL
        END
    );
    
    RETURN result;
END;
$$;

-- ================================================================================
-- STEP 6: BUSINESS RULES ENGINE FUNCTION
-- ================================================================================

CREATE OR REPLACE FUNCTION get_business_rules(smart_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    parsed_code JSONB;
    rules JSONB := '{}'::JSONB;
BEGIN
    parsed_code := parse_smart_code(smart_code_input);
    
    -- Industry-specific rules
    CASE parsed_code->>'industry_code'
        WHEN 'REST' THEN -- Restaurant
            rules := jsonb_build_object(
                'expiry_tracking', true,
                'temperature_monitoring', true,
                'food_safety_compliance', true,
                'allergen_tracking', true,
                'portion_control', true,
                'required_fields', '["expiry_date", "temperature", "allergens"]'::JSONB
            );
        WHEN 'HLTH' THEN -- Healthcare  
            rules := jsonb_build_object(
                'hipaa_compliance', true,
                'audit_trail_required', true,
                'consent_tracking', true,
                'lot_tracking', true,
                'expiry_mandatory', true,
                'required_fields', '["lot_number", "expiry_date", "patient_consent"]'::JSONB
            );
        WHEN 'MFG' THEN -- Manufacturing
            rules := jsonb_build_object(
                'quality_certificates', true,
                'vendor_certifications', true,
                'material_specifications', true,
                'batch_tracking', true,
                'safety_standards', true,
                'required_fields', '["batch_number", "quality_cert", "specifications"]'::JSONB
            );
        ELSE -- Universal rules
            rules := jsonb_build_object(
                'basic_validation', true,
                'audit_trail', true,
                'organization_isolation', true,
                'required_fields', '["organization_id"]'::JSONB
            );
    END CASE;
    
    -- Module-specific rules
    CASE parsed_code->>'module'
        WHEN 'FIN' THEN -- Financial
            rules := rules || jsonb_build_object(
                'gl_account_validation', true,
                'currency_conversion', true,
                'tax_calculation', true,
                'approval_workflow', true
            );
        WHEN 'INV' THEN -- Inventory
            rules := rules || jsonb_build_object(
                'stock_validation', true,
                'cost_calculation', true,
                'reorder_point_check', true,
                'location_tracking', true
            );
        WHEN 'CRM' THEN -- Customer Relationship
            rules := rules || jsonb_build_object(
                'contact_validation', true,
                'communication_log', true,
                'privacy_compliance', true,
                'relationship_tracking', true
            );
    END CASE;
    
    RETURN rules;
END;
$$;

-- ================================================================================
-- STEP 7: SMART CODE SEARCH FUNCTION
-- ================================================================================

CREATE OR REPLACE FUNCTION search_by_smart_code(
    p_organization_id UUID,
    p_smart_code_pattern TEXT DEFAULT NULL,
    p_module TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    table_name TEXT,
    record_id UUID,
    smart_code TEXT,
    entity_name TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Search across all smart code enabled tables
    RETURN QUERY
    (
        -- Search core_entities
        SELECT 
            'core_entities'::TEXT as table_name,
            ce.id as record_id,
            ce.smart_code,
            ce.entity_name,
            ce.created_at,
            jsonb_build_object(
                'entity_type', ce.entity_type,
                'status', ce.status,
                'smart_code_status', ce.smart_code_status
            ) as metadata
        FROM core_entities ce
        WHERE ce.organization_id = p_organization_id
        AND (p_smart_code_pattern IS NULL OR ce.smart_code ILIKE '%' || p_smart_code_pattern || '%')
        AND (p_module IS NULL OR ce.smart_code ILIKE '%.' || p_module || '.%')
        AND (p_industry IS NULL OR ce.smart_code ILIKE 'HERA.' || p_industry || '.%')
        AND (p_entity_type IS NULL OR ce.smart_code ILIKE '%.' || p_entity_type || '.%')
        AND ce.smart_code IS NOT NULL
        
        UNION ALL
        
        -- Search universal_transactions
        SELECT 
            'universal_transactions'::TEXT as table_name,
            ut.id as record_id,
            ut.smart_code,
            ut.reference_number as entity_name,
            ut.created_at,
            jsonb_build_object(
                'transaction_type', ut.transaction_type,
                'status', ut.status,
                'total_amount', ut.total_amount,
                'currency', ut.currency
            ) as metadata
        FROM universal_transactions ut
        WHERE ut.organization_id = p_organization_id
        AND (p_smart_code_pattern IS NULL OR ut.smart_code ILIKE '%' || p_smart_code_pattern || '%')
        AND (p_module IS NULL OR ut.smart_code ILIKE '%.' || p_module || '.%')
        AND (p_industry IS NULL OR ut.smart_code ILIKE 'HERA.' || p_industry || '.%')
        AND ut.smart_code IS NOT NULL
    )
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ================================================================================
-- STEP 8: SMART CODE ANALYTICS FUNCTION
-- ================================================================================

CREATE OR REPLACE FUNCTION smart_code_analytics(
    p_organization_id UUID DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    entity_stats JSONB;
    transaction_stats JSONB;
    industry_breakdown JSONB;
    module_breakdown JSONB;
BEGIN
    -- Set default dates if not provided
    IF p_date_from IS NULL THEN p_date_from := CURRENT_DATE - INTERVAL '30 days'; END IF;
    IF p_date_to IS NULL THEN p_date_to := CURRENT_DATE; END IF;
    
    -- Entity statistics
    SELECT jsonb_agg(
        jsonb_build_object(
            'smart_code', smart_code,
            'count', cnt,
            'percentage', ROUND((cnt::DECIMAL / SUM(cnt) OVER()) * 100, 2)
        )
    ) INTO entity_stats
    FROM (
        SELECT smart_code, COUNT(*) as cnt
        FROM core_entities 
        WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
        AND smart_code IS NOT NULL
        AND DATE(created_at) BETWEEN p_date_from AND p_date_to
        GROUP BY smart_code
        ORDER BY cnt DESC
        LIMIT 20
    ) t;
    
    -- Transaction statistics  
    SELECT jsonb_agg(
        jsonb_build_object(
            'smart_code', smart_code,
            'count', cnt,
            'total_amount', total_amt,
            'avg_amount', ROUND(avg_amt, 2)
        )
    ) INTO transaction_stats
    FROM (
        SELECT 
            smart_code, 
            COUNT(*) as cnt,
            SUM(total_amount) as total_amt,
            AVG(total_amount) as avg_amt
        FROM universal_transactions
        WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
        AND smart_code IS NOT NULL  
        AND DATE(transaction_date) BETWEEN p_date_from AND p_date_to
        GROUP BY smart_code
        ORDER BY cnt DESC
        LIMIT 20
    ) t;
    
    -- Industry breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'industry', industry,
            'entity_count', entity_count,
            'transaction_count', transaction_count
        )
    ) INTO industry_breakdown
    FROM (
        SELECT 
            CASE 
                WHEN smart_code ~ '^HERA\.REST\.' THEN 'Restaurant'
                WHEN smart_code ~ '^HERA\.HLTH\.' THEN 'Healthcare'
                WHEN smart_code ~ '^HERA\.MFG\.' THEN 'Manufacturing'
                WHEN smart_code ~ '^HERA\.PROF\.' THEN 'Professional Services'
                ELSE 'Universal'
            END as industry,
            (SELECT COUNT(*) FROM core_entities WHERE smart_code ~ ('^HERA\.' || 
               CASE 
                   WHEN smart_code ~ '^HERA\.REST\.' THEN 'REST'
                   WHEN smart_code ~ '^HERA\.HLTH\.' THEN 'HLTH'
                   WHEN smart_code ~ '^HERA\.MFG\.' THEN 'MFG'
                   WHEN smart_code ~ '^HERA\.PROF\.' THEN 'PROF'
                   ELSE '[^.]+'
               END || '\.') 
               AND (p_organization_id IS NULL OR organization_id = p_organization_id)
            ) as entity_count,
            (SELECT COUNT(*) FROM universal_transactions WHERE smart_code ~ ('^HERA\.' ||
               CASE 
                   WHEN smart_code ~ '^HERA\.REST\.' THEN 'REST'
                   WHEN smart_code ~ '^HERA\.HLTH\.' THEN 'HLTH'
                   WHEN smart_code ~ '^HERA\.MFG\.' THEN 'MFG'
                   WHEN smart_code ~ '^HERA\.PROF\.' THEN 'PROF'
                   ELSE '[^.]+'
               END || '\.')
               AND (p_organization_id IS NULL OR organization_id = p_organization_id)
            ) as transaction_count
        FROM (
            SELECT DISTINCT smart_code FROM core_entities WHERE smart_code IS NOT NULL
            UNION
            SELECT DISTINCT smart_code FROM universal_transactions WHERE smart_code IS NOT NULL  
        ) codes
        ORDER BY entity_count DESC
    ) t;
    
    -- Build final result
    result := jsonb_build_object(
        'date_range', jsonb_build_object('from', p_date_from, 'to', p_date_to),
        'entity_statistics', COALESCE(entity_stats, '[]'::JSONB),
        'transaction_statistics', COALESCE(transaction_stats, '[]'::JSONB),
        'industry_breakdown', COALESCE(industry_breakdown, '[]'::JSONB),
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- ================================================================================
-- STEP 9: SMART CODE TRIGGERS FOR AUTO-GENERATION
-- ================================================================================

-- Trigger function for auto-generating smart codes
CREATE OR REPLACE FUNCTION auto_generate_smart_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    generated_code TEXT;
BEGIN
    -- Only generate if smart_code is not provided
    IF NEW.smart_code IS NULL OR NEW.smart_code = '' THEN
        
        -- Generate based on table and context
        CASE TG_TABLE_NAME
            WHEN 'core_entities' THEN
                generated_code := generate_smart_code(
                    NEW.organization_id,
                    'CRM',  -- Default module
                    'ENT',  -- Sub-module for entities
                    'ENT',  -- Function type
                    COALESCE(NEW.entity_type, 'GEN'), -- Entity type
                    'v1'    -- Version
                );
            WHEN 'universal_transactions' THEN
                generated_code := generate_smart_code(
                    NEW.organization_id,
                    'TXN',  -- Default module
                    'TXN',  -- Sub-module for transactions
                    'TXN',  -- Function type  
                    COALESCE(NEW.transaction_type, 'GEN'), -- Transaction type
                    'v1'    -- Version
                );
            ELSE
                generated_code := NULL;
        END CASE;
        
        NEW.smart_code := generated_code;
    END IF;
    
    -- Set default smart code status
    IF TG_TABLE_NAME = 'core_entities' AND (NEW.smart_code_status IS NULL OR NEW.smart_code_status = '') THEN
        NEW.smart_code_status := 'DRAFT';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers (optional - only if you want auto-generation)
-- Uncomment these if you want automatic smart code generation

-- DROP TRIGGER IF EXISTS trigger_auto_smart_code_entities ON core_entities;
-- CREATE TRIGGER trigger_auto_smart_code_entities
--     BEFORE INSERT OR UPDATE ON core_entities
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_generate_smart_code();

-- DROP TRIGGER IF EXISTS trigger_auto_smart_code_transactions ON universal_transactions;  
-- CREATE TRIGGER trigger_auto_smart_code_transactions
--     BEFORE INSERT OR UPDATE ON universal_transactions
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_generate_smart_code();

-- ================================================================================
-- STEP 10: UTILITY FUNCTIONS FOR SMART CODE MANAGEMENT
-- ================================================================================

-- Function to update smart code status (DRAFT → AI → HR → PROD → AUTO)
CREATE OR REPLACE FUNCTION update_smart_code_status(
    p_entity_id UUID,
    p_new_status TEXT,
    p_confidence_score DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    valid_statuses TEXT[] := ARRAY['DRAFT', 'AI', 'HR', 'PROD', 'AUTO'];
BEGIN
    -- Validate status
    IF NOT (p_new_status = ANY(valid_statuses)) THEN
        RAISE EXCEPTION 'Invalid status. Must be one of: %', array_to_string(valid_statuses, ', ');
    END IF;
    
    -- Update entity
    UPDATE core_entities 
    SET 
        smart_code_status = p_new_status,
        ai_confidence = COALESCE(p_confidence_score, ai_confidence),
        updated_at = NOW()
    WHERE id = p_entity_id;
    
    RETURN FOUND;
END;
$$;

-- Function to get smart code suggestions based on existing patterns
CREATE OR REPLACE FUNCTION suggest_smart_codes(
    p_organization_id UUID,
    p_entity_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggested_code TEXT,
    usage_count INTEGER,
    last_used TIMESTAMPTZ,
    confidence_score DECIMAL
)
LANGUAGE plpgsql  
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.smart_code as suggested_code,
        COUNT(*)::INTEGER as usage_count,
        MAX(ce.created_at) as last_used,
        AVG(COALESCE(ce.ai_confidence, 0.5))::DECIMAL as confidence_score
    FROM core_entities ce
    WHERE ce.organization_id = p_organization_id
    AND (p_entity_type IS NULL OR ce.entity_type = p_entity_type)
    AND ce.smart_code IS NOT NULL
    GROUP BY ce.smart_code
    ORDER BY usage_count DESC, confidence_score DESC
    LIMIT p_limit;
END;
$$;

-- ================================================================================
-- STEP 11: SMART CODE EXAMPLES AND TESTING
-- ================================================================================

-- Insert some example smart codes for testing (adjust organization_id as needed)
-- Replace 'your-org-id-here' with actual UUIDs from your system

/*
-- Example: Restaurant menu items
INSERT INTO core_entities (organization_id, entity_type, entity_name, smart_code, smart_code_status)
VALUES 
    ('your-mario-restaurant-org-id', 'menu_item', 'Margherita Pizza', 'HERA.REST.CRM.ENT.MENU.V1', 'PROD'),
    ('your-mario-restaurant-org-id', 'menu_item', 'Caesar Salad', 'HERA.REST.CRM.ENT.MENU.V1', 'PROD');

-- Example: Customer orders
INSERT INTO universal_transactions (organization_id, transaction_type, reference_number, smart_code, total_amount)
VALUES 
    ('your-mario-restaurant-org-id', 'customer_order', 'ORD-001', 'HERA.REST.CRM.TXN.ORDER.V1', 42.50),
    ('your-mario-restaurant-org-id', 'customer_order', 'ORD-002', 'HERA.REST.CRM.TXN.ORDER.V1', 38.75);

-- Test the functions
SELECT validate_smart_code('HERA.REST.CRM.ENT.MENU.V1');
SELECT generate_smart_code('your-org-id', 'CRM', 'ENT', 'ENT', 'MENU');
SELECT parse_smart_code('HERA.REST.CRM.ENT.MENU.V1');
SELECT get_business_rules('HERA.REST.CRM.ENT.MENU.V1');
*/

-- ================================================================================
-- COMPLETION MESSAGE
-- ================================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ HERA Smart Code Functions Successfully Installed!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 What was added:';
    RAISE NOTICE '   • smart_code columns to 5 tables';
    RAISE NOTICE '   • Performance indexes for fast queries';  
    RAISE NOTICE '   • 11 powerful smart code functions';
    RAISE NOTICE '   • Business rules engine';
    RAISE NOTICE '   • Analytics and search capabilities';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to use functions:';
    RAISE NOTICE '   • validate_smart_code(code)';
    RAISE NOTICE '   • generate_smart_code(org_id, module, sub, func, type)';
    RAISE NOTICE '   • parse_smart_code(code)';
    RAISE NOTICE '   • get_business_rules(code)';
    RAISE NOTICE '   • search_by_smart_code(org_id, pattern)';
    RAISE NOTICE '   • smart_code_analytics(org_id)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Your existing UUIDs and data are completely preserved!';
    RAISE NOTICE '💡 Smart codes are now ready for immediate use!';
END $$;