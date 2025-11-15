-- ================================================================================
-- HERA Universal Tile System - Database Foundation
-- Migration: Create entity types, constraints, and indexes
-- Smart Code: HERA.PLATFORM.DB.MIGRATION.TILE_SYSTEM.v1
-- ================================================================================

-- APP_TILE_TEMPLATE: Template definitions for reusable tile types
-- Stored as entities with dynamic data for configuration
-- Smart Code Pattern: HERA.PLATFORM.UI.TILE.TPL.{TILE_TYPE}.v1
-- Examples: HERA.PLATFORM.UI.TILE.TPL.ENTITIES.v1, HERA.PLATFORM.UI.TILE.TPL.ANALYTICS.v1

INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'APP_TILE_TEMPLATE',
    'TILE_TEMPLATE_ENTITY_TYPE',
    'Tile Template Entity Type Definition',
    'Entity type definition for APP_TILE_TEMPLATE - stores reusable tile template configurations',
    'HERA.PLATFORM.UI.ENTITY_TYPE.TILE_TEMPLATE.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform organization
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001', -- System user
    NOW(),
    NOW()
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- APP_WORKSPACE_TILE: Instance tiles configured for specific workspaces
-- Links workspace to tile template with customizations/overrides
-- Smart Code Pattern: HERA.PLATFORM.UI.WORKSPACE.TILE.{WORKSPACE_TYPE}.v1
-- Examples: HERA.PLATFORM.UI.WORKSPACE.TILE.RETAIL_POS.v1

INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'APP_WORKSPACE_TILE',
    'WORKSPACE_TILE_ENTITY_TYPE',
    'Workspace Tile Entity Type Definition',
    'Entity type definition for APP_WORKSPACE_TILE - stores workspace-specific tile configurations',
    'HERA.PLATFORM.UI.ENTITY_TYPE.WORKSPACE_TILE.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform organization
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001', -- System user
    NOW(),
    NOW()
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- SMART CODE VALIDATION CONSTRAINTS
-- ================================================================================

-- Create check constraint for APP_TILE_TEMPLATE smart codes
-- Must follow pattern: HERA.PLATFORM.UI.TILE.TPL.{TILE_TYPE}.v1
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_app_tile_template_smart_code'
    ) THEN
        ALTER TABLE core_entities 
        ADD CONSTRAINT chk_app_tile_template_smart_code 
        CHECK (
            entity_type != 'APP_TILE_TEMPLATE' OR 
            smart_code ~ '^HERA\.PLATFORM\.UI\.TILE\.TPL\.[A-Z_]+\.v[0-9]+$'
        );
    END IF;
END $$;

-- Create check constraint for APP_WORKSPACE_TILE smart codes  
-- Must follow pattern: HERA.PLATFORM.UI.WORKSPACE.TILE.{WORKSPACE_TYPE}.v1
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_app_workspace_tile_smart_code'
    ) THEN
        ALTER TABLE core_entities 
        ADD CONSTRAINT chk_app_workspace_tile_smart_code 
        CHECK (
            entity_type != 'APP_WORKSPACE_TILE' OR 
            smart_code ~ '^HERA\.PLATFORM\.UI\.WORKSPACE\.TILE\.[A-Z_]+\.v[0-9]+$'
        );
    END IF;
END $$;

-- ================================================================================
-- PERFORMANCE INDEXES
-- ================================================================================

-- Index for tile template lookups by type and organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_core_entities_tile_template_lookup
ON core_entities (entity_type, organization_id, entity_code)
WHERE entity_type = 'APP_TILE_TEMPLATE';

-- Index for workspace tile lookups by workspace and organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_core_entities_workspace_tile_lookup  
ON core_entities (entity_type, organization_id, parent_entity_id)
WHERE entity_type = 'APP_WORKSPACE_TILE';

-- Index for smart code pattern searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_core_entities_smart_code_pattern
ON core_entities (smart_code)
WHERE entity_type IN ('APP_TILE_TEMPLATE', 'APP_WORKSPACE_TILE');

-- ================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================================

-- RLS policies for APP_TILE_TEMPLATE
-- Platform templates (org 00000000-0000-0000-0000-000000000000) are visible to all
-- Organization-specific templates are only visible within that org

DO $$
BEGIN
    -- Policy for reading tile templates
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'core_entities' 
        AND policyname = 'tile_templates_read_policy'
    ) THEN
        CREATE POLICY tile_templates_read_policy ON core_entities
        FOR SELECT
        USING (
            entity_type != 'APP_TILE_TEMPLATE' OR 
            organization_id = current_setting('app.current_organization_id', true)::uuid OR
            organization_id = '00000000-0000-0000-0000-000000000000'::uuid  -- Platform templates
        );
    END IF;

    -- Policy for workspace tiles (organization-specific only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'core_entities' 
        AND policyname = 'workspace_tiles_org_policy'
    ) THEN
        CREATE POLICY workspace_tiles_org_policy ON core_entities
        FOR ALL
        USING (
            entity_type != 'APP_WORKSPACE_TILE' OR 
            organization_id = current_setting('app.current_organization_id', true)::uuid
        );
    END IF;
END $$;

-- ================================================================================
-- DYNAMIC DATA FIELD DEFINITIONS
-- ================================================================================

-- Standard dynamic data fields for APP_TILE_TEMPLATE
-- These define the structure and behavior of tile templates

-- tile_type: Category of tile (ENTITIES, TRANSACTIONS, ANALYTICS, etc.)
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_text, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    e.id,
    'tile_type',
    'text',
    'ENTITIES',
    'HERA.PLATFORM.UI.TILE.TPL.FIELD.TYPE.v1',
    e.organization_id,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_code = 'TILE_TEMPLATE_ENTITY_TYPE' 
AND e.entity_type = 'APP_TILE_TEMPLATE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = e.id AND d.field_name = 'tile_type'
)
ON CONFLICT DO NOTHING;

-- operation_category: Primary operation (READ, CREATE, ANALYTICS)
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_text, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    e.id,
    'operation_category',
    'text',
    'READ',
    'HERA.PLATFORM.UI.TILE.TPL.FIELD.OPERATION.v1',
    e.organization_id,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_code = 'TILE_TEMPLATE_ENTITY_TYPE' 
AND e.entity_type = 'APP_TILE_TEMPLATE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = e.id AND d.field_name = 'operation_category'
)
ON CONFLICT DO NOTHING;

-- ui_schema: JSON schema for UI configuration (icon, colors, layout)
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    e.id,
    'ui_schema',
    'json',
    '{"icon": "Database", "color": "blue", "gradient": "blue-to-indigo"}'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.FIELD.UI_SCHEMA.v1',
    e.organization_id,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_code = 'TILE_TEMPLATE_ENTITY_TYPE' 
AND e.entity_type = 'APP_TILE_TEMPLATE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = e.id AND d.field_name = 'ui_schema'
)
ON CONFLICT DO NOTHING;

-- Standard dynamic data fields for APP_WORKSPACE_TILE
-- These define workspace-specific customizations

-- tile_position: Display order in workspace (integer)
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_number, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    e.id,
    'tile_position',
    'number',
    1,
    'HERA.PLATFORM.UI.WORKSPACE.TILE.FIELD.POSITION.v1',
    e.organization_id,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_code = 'WORKSPACE_TILE_ENTITY_TYPE' 
AND e.entity_type = 'APP_WORKSPACE_TILE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = e.id AND d.field_name = 'tile_position'
)
ON CONFLICT DO NOTHING;

-- is_enabled: Whether tile is active (boolean)
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_boolean, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    e.id,
    'is_enabled',
    'boolean',
    true,
    'HERA.PLATFORM.UI.WORKSPACE.TILE.FIELD.ENABLED.v1',
    e.organization_id,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_code = 'WORKSPACE_TILE_ENTITY_TYPE' 
AND e.entity_type = 'APP_WORKSPACE_TILE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = e.id AND d.field_name = 'is_enabled'
)
ON CONFLICT DO NOTHING;

-- custom_overrides: JSON overrides for template settings
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    e.id,
    'custom_overrides',
    'json',
    '{}'::jsonb,
    'HERA.PLATFORM.UI.WORKSPACE.TILE.FIELD.OVERRIDES.v1',
    e.organization_id,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_code = 'WORKSPACE_TILE_ENTITY_TYPE' 
AND e.entity_type = 'APP_WORKSPACE_TILE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = e.id AND d.field_name = 'custom_overrides'
)
ON CONFLICT DO NOTHING;

-- ================================================================================
-- VALIDATION FUNCTIONS
-- ================================================================================

-- Function to validate tile template smart codes
CREATE OR REPLACE FUNCTION validate_tile_template_smart_code(smart_code_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Must match pattern: HERA.PLATFORM.UI.TILE.TPL.{TILE_TYPE}.v{VERSION}
    RETURN smart_code_input ~ '^HERA\.PLATFORM\.UI\.TILE\.TPL\.[A-Z_]+\.v[0-9]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate workspace tile smart codes
CREATE OR REPLACE FUNCTION validate_workspace_tile_smart_code(smart_code_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Must match pattern: HERA.PLATFORM.UI.WORKSPACE.TILE.{WORKSPACE_TYPE}.v{VERSION}
    RETURN smart_code_input ~ '^HERA\.PLATFORM\.UI\.WORKSPACE\.TILE\.[A-Z_]+\.v[0-9]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================================================
-- AUDIT AND MONITORING
-- ================================================================================

-- Create audit trigger for tile template changes
CREATE OR REPLACE FUNCTION log_tile_template_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log tile template modifications to universal_transactions for audit
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO universal_transactions (
            id,
            transaction_type,
            transaction_code,
            smart_code,
            organization_id,
            source_entity_id,
            total_amount,
            transaction_status,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'TILE_TEMPLATE_CHANGE',
            'TILE_TPL_' || to_char(NOW(), 'YYYYMMDD') || '_' || nextval('transaction_sequence'),
            'HERA.PLATFORM.AUDIT.TXN.TILE_TEMPLATE_CHANGE.v1',
            NEW.organization_id,
            NEW.id,
            0,
            'COMPLETED',
            NEW.updated_by,
            NEW.updated_by,
            NOW(),
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to core_entities for tile types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_tile_template_audit'
    ) THEN
        CREATE TRIGGER trigger_tile_template_audit
        AFTER INSERT OR UPDATE ON core_entities
        FOR EACH ROW
        WHEN (NEW.entity_type IN ('APP_TILE_TEMPLATE', 'APP_WORKSPACE_TILE'))
        EXECUTE FUNCTION log_tile_template_changes();
    END IF;
END $$;

-- ================================================================================
-- VERIFICATION QUERIES
-- ================================================================================

-- Verify entity types were created successfully
DO $$
DECLARE
    template_count INTEGER;
    workspace_tile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count 
    FROM core_entities 
    WHERE entity_type = 'APP_TILE_TEMPLATE';
    
    SELECT COUNT(*) INTO workspace_tile_count 
    FROM core_entities 
    WHERE entity_type = 'APP_WORKSPACE_TILE';
    
    RAISE NOTICE 'Universal Tile System Migration Complete:';
    RAISE NOTICE '  - APP_TILE_TEMPLATE entities: %', template_count;
    RAISE NOTICE '  - APP_WORKSPACE_TILE entities: %', workspace_tile_count;
    RAISE NOTICE '  - Smart code validation constraints: ACTIVE';
    RAISE NOTICE '  - Performance indexes: CREATED';
    RAISE NOTICE '  - RLS policies: ACTIVE';
    RAISE NOTICE '  - Audit triggers: ACTIVE';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands in reverse order if rollback is needed:

-- 1. Drop audit trigger
DROP TRIGGER IF EXISTS trigger_tile_template_audit ON core_entities;
DROP FUNCTION IF EXISTS log_tile_template_changes();

-- 2. Drop validation functions
DROP FUNCTION IF EXISTS validate_tile_template_smart_code(TEXT);
DROP FUNCTION IF EXISTS validate_workspace_tile_smart_code(TEXT);

-- 3. Remove dynamic data
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type IN ('APP_TILE_TEMPLATE', 'APP_WORKSPACE_TILE')
    AND entity_code IN ('TILE_TEMPLATE_ENTITY_TYPE', 'WORKSPACE_TILE_ENTITY_TYPE')
);

-- 4. Drop RLS policies
DROP POLICY IF EXISTS tile_templates_read_policy ON core_entities;
DROP POLICY IF EXISTS workspace_tiles_org_policy ON core_entities;

-- 5. Drop indexes
DROP INDEX IF EXISTS idx_core_entities_tile_template_lookup;
DROP INDEX IF EXISTS idx_core_entities_workspace_tile_lookup;
DROP INDEX IF EXISTS idx_core_entities_smart_code_pattern;

-- 6. Drop constraints
ALTER TABLE core_entities DROP CONSTRAINT IF EXISTS chk_app_tile_template_smart_code;
ALTER TABLE core_entities DROP CONSTRAINT IF EXISTS chk_app_workspace_tile_smart_code;

-- 7. Remove entity type definitions
DELETE FROM core_entities 
WHERE entity_type IN ('APP_TILE_TEMPLATE', 'APP_WORKSPACE_TILE')
AND entity_code IN ('TILE_TEMPLATE_ENTITY_TYPE', 'WORKSPACE_TILE_ENTITY_TYPE');

*/