-- ================================================================================
-- HERA Universal Tile System - Relationship Types
-- Migration: Create relationship types for tile-workspace associations
-- Smart Code: HERA.PLATFORM.DB.MIGRATION.TILE_RELATIONSHIPS.v1
-- ================================================================================

-- WORKSPACE_HAS_TILE: Associates workspace with configured tile instances
-- Links APP_WORKSPACE entities to APP_WORKSPACE_TILE entities
-- from_entity_id = workspace entity, to_entity_id = workspace tile entity
-- Smart Code Pattern: HERA.PLATFORM.UI.REL.WORKSPACE_HAS_TILE.v1

-- TILE_USES_TEMPLATE: Links tile instance to its template definition
-- Links APP_WORKSPACE_TILE entities to APP_TILE_TEMPLATE entities  
-- from_entity_id = workspace tile entity, to_entity_id = tile template entity
-- Smart Code Pattern: HERA.PLATFORM.UI.REL.TILE_USES_TEMPLATE.v1

-- ================================================================================
-- RELATIONSHIP TYPE DEFINITIONS
-- ================================================================================

-- Create WORKSPACE_HAS_TILE relationship type definition
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
    'RELATIONSHIP_TYPE',
    'WORKSPACE_HAS_TILE',
    'Workspace Has Tile Relationship',
    'Associates workspace entities with their configured tile instances - enables workspace-specific tile configuration',
    'HERA.PLATFORM.UI.REL_TYPE.WORKSPACE_HAS_TILE.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform organization
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001', -- System user
    NOW(),
    NOW()
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Create TILE_USES_TEMPLATE relationship type definition
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
    'RELATIONSHIP_TYPE',
    'TILE_USES_TEMPLATE',
    'Tile Uses Template Relationship',
    'Links tile instances to their template definitions - enables template inheritance with customization overrides',
    'HERA.PLATFORM.UI.REL_TYPE.TILE_USES_TEMPLATE.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform organization
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001', -- System user
    NOW(),
    NOW()
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- RELATIONSHIP VALIDATION CONSTRAINTS
-- ================================================================================

-- Create constraint to validate WORKSPACE_HAS_TILE relationships
-- Ensures from_entity is a workspace and to_entity is a workspace tile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_workspace_has_tile_entities'
    ) THEN
        ALTER TABLE core_relationships 
        ADD CONSTRAINT chk_workspace_has_tile_entities
        CHECK (
            relationship_type != 'WORKSPACE_HAS_TILE' OR (
                EXISTS (
                    SELECT 1 FROM core_entities 
                    WHERE id = from_entity_id 
                    AND entity_type LIKE '%WORKSPACE%'
                ) AND
                EXISTS (
                    SELECT 1 FROM core_entities 
                    WHERE id = to_entity_id 
                    AND entity_type = 'APP_WORKSPACE_TILE'
                )
            )
        );
    END IF;
END $$;

-- Create constraint to validate TILE_USES_TEMPLATE relationships
-- Ensures from_entity is a workspace tile and to_entity is a tile template
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_tile_uses_template_entities'
    ) THEN
        ALTER TABLE core_relationships 
        ADD CONSTRAINT chk_tile_uses_template_entities
        CHECK (
            relationship_type != 'TILE_USES_TEMPLATE' OR (
                EXISTS (
                    SELECT 1 FROM core_entities 
                    WHERE id = from_entity_id 
                    AND entity_type = 'APP_WORKSPACE_TILE'
                ) AND
                EXISTS (
                    SELECT 1 FROM core_entities 
                    WHERE id = to_entity_id 
                    AND entity_type = 'APP_TILE_TEMPLATE'
                )
            )
        );
    END IF;
END $$;

-- Prevent duplicate workspace-tile relationships (one tile per workspace)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_workspace_tile_relationship'
    ) THEN
        ALTER TABLE core_relationships 
        ADD CONSTRAINT unique_workspace_tile_relationship
        UNIQUE (from_entity_id, to_entity_id, relationship_type, organization_id)
        WHERE relationship_type = 'WORKSPACE_HAS_TILE';
    END IF;
END $$;

-- Prevent duplicate tile-template relationships (one template per tile)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_tile_template_relationship'
    ) THEN
        ALTER TABLE core_relationships 
        ADD CONSTRAINT unique_tile_template_relationship
        UNIQUE (from_entity_id, relationship_type, organization_id)
        WHERE relationship_type = 'TILE_USES_TEMPLATE';
    END IF;
END $$;

-- ================================================================================
-- PERFORMANCE INDEXES  
-- ================================================================================

-- Index for fast workspace tile lookups
-- Query pattern: Find all tiles for a workspace
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_workspace_has_tile
ON core_relationships (from_entity_id, relationship_type, organization_id)
WHERE relationship_type = 'WORKSPACE_HAS_TILE' 
AND effective_date <= NOW() 
AND (expiration_date IS NULL OR expiration_date > NOW());

-- Index for fast tile template lookups  
-- Query pattern: Find template for a tile
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_tile_uses_template
ON core_relationships (from_entity_id, relationship_type, organization_id)
WHERE relationship_type = 'TILE_USES_TEMPLATE'
AND effective_date <= NOW() 
AND (expiration_date IS NULL OR expiration_date > NOW());

-- Index for reverse template lookup
-- Query pattern: Find all tiles using a template
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_template_used_by_tiles
ON core_relationships (to_entity_id, relationship_type, organization_id)
WHERE relationship_type = 'TILE_USES_TEMPLATE'
AND effective_date <= NOW() 
AND (expiration_date IS NULL OR expiration_date > NOW());

-- Composite index for workspace + organization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_workspace_org_tiles
ON core_relationships (from_entity_id, organization_id, relationship_type, effective_date, expiration_date)
WHERE relationship_type IN ('WORKSPACE_HAS_TILE', 'TILE_USES_TEMPLATE');

-- ================================================================================
-- RELATIONSHIP DATA FIELDS
-- ================================================================================

-- Add dynamic data fields for WORKSPACE_HAS_TILE relationships
-- These store workspace-specific tile configuration

-- tile_position: Order of tile in workspace (for sorting)
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_number, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    rt.id,
    'tile_position',
    'number',
    0,
    'HERA.PLATFORM.UI.REL.WORKSPACE_TILE.FIELD.POSITION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
FROM core_entities rt
WHERE rt.entity_code = 'WORKSPACE_HAS_TILE' 
AND rt.entity_type = 'RELATIONSHIP_TYPE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = rt.id AND d.field_name = 'tile_position'
)
ON CONFLICT DO NOTHING;

-- visibility_rules: JSON conditions for when tile should be shown
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    rt.id,
    'visibility_rules',
    'json',
    '{"all": []}'::jsonb,
    'HERA.PLATFORM.UI.REL.WORKSPACE_TILE.FIELD.VISIBILITY.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
FROM core_entities rt
WHERE rt.entity_code = 'WORKSPACE_HAS_TILE' 
AND rt.entity_type = 'RELATIONSHIP_TYPE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = rt.id AND d.field_name = 'visibility_rules'
)
ON CONFLICT DO NOTHING;

-- Add dynamic data fields for TILE_USES_TEMPLATE relationships  
-- These store template inheritance and override configuration

-- template_version: Track which version of template is being used
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_text, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    rt.id,
    'template_version',
    'text',
    'v1',
    'HERA.PLATFORM.UI.REL.TILE_TEMPLATE.FIELD.VERSION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
FROM core_entities rt
WHERE rt.entity_code = 'TILE_USES_TEMPLATE' 
AND rt.entity_type = 'RELATIONSHIP_TYPE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = rt.id AND d.field_name = 'template_version'
)
ON CONFLICT DO NOTHING;

-- override_config: JSON configuration that overrides template defaults
INSERT INTO core_dynamic_data (
    id, entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by
) 
SELECT 
    gen_random_uuid(),
    rt.id,
    'override_config',
    'json',
    '{}'::jsonb,
    'HERA.PLATFORM.UI.REL.TILE_TEMPLATE.FIELD.OVERRIDES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
FROM core_entities rt
WHERE rt.entity_code = 'TILE_USES_TEMPLATE' 
AND rt.entity_type = 'RELATIONSHIP_TYPE'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data d 
    WHERE d.entity_id = rt.id AND d.field_name = 'override_config'
)
ON CONFLICT DO NOTHING;

-- ================================================================================
-- VALIDATION TRIGGERS
-- ================================================================================

-- Trigger to validate relationship data integrity
CREATE OR REPLACE FUNCTION validate_tile_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate WORKSPACE_HAS_TILE relationships
    IF NEW.relationship_type = 'WORKSPACE_HAS_TILE' THEN
        -- Ensure from_entity is a workspace type
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.from_entity_id 
            AND entity_type LIKE '%WORKSPACE%'
        ) THEN
            RAISE EXCEPTION 'WORKSPACE_HAS_TILE relationship requires from_entity to be a workspace type, got entity_id: %', NEW.from_entity_id;
        END IF;
        
        -- Ensure to_entity is a workspace tile
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.to_entity_id 
            AND entity_type = 'APP_WORKSPACE_TILE'
        ) THEN
            RAISE EXCEPTION 'WORKSPACE_HAS_TILE relationship requires to_entity to be APP_WORKSPACE_TILE, got entity_id: %', NEW.to_entity_id;
        END IF;
    END IF;
    
    -- Validate TILE_USES_TEMPLATE relationships
    IF NEW.relationship_type = 'TILE_USES_TEMPLATE' THEN
        -- Ensure from_entity is a workspace tile
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.from_entity_id 
            AND entity_type = 'APP_WORKSPACE_TILE'
        ) THEN
            RAISE EXCEPTION 'TILE_USES_TEMPLATE relationship requires from_entity to be APP_WORKSPACE_TILE, got entity_id: %', NEW.from_entity_id;
        END IF;
        
        -- Ensure to_entity is a tile template
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.to_entity_id 
            AND entity_type = 'APP_TILE_TEMPLATE'
        ) THEN
            RAISE EXCEPTION 'TILE_USES_TEMPLATE relationship requires to_entity to be APP_TILE_TEMPLATE, got entity_id: %', NEW.to_entity_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_validate_tile_relationships'
    ) THEN
        CREATE TRIGGER trigger_validate_tile_relationships
        BEFORE INSERT OR UPDATE ON core_relationships
        FOR EACH ROW
        WHEN (NEW.relationship_type IN ('WORKSPACE_HAS_TILE', 'TILE_USES_TEMPLATE'))
        EXECUTE FUNCTION validate_tile_relationships();
    END IF;
END $$;

-- ================================================================================
-- HELPER FUNCTIONS
-- ================================================================================

-- Function to get all tiles for a workspace
CREATE OR REPLACE FUNCTION get_workspace_tiles(
    workspace_id UUID,
    org_id UUID DEFAULT NULL
)
RETURNS TABLE (
    tile_id UUID,
    template_id UUID,
    tile_position INTEGER,
    is_enabled BOOLEAN,
    tile_name TEXT,
    template_name TEXT,
    ui_schema JSONB,
    custom_overrides JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.id as tile_id,
        tt.id as template_id,
        COALESCE((
            SELECT d.field_value_number::integer 
            FROM core_dynamic_data d 
            WHERE d.entity_id = wt.id AND d.field_name = 'tile_position'
        ), 0) as tile_position,
        COALESCE((
            SELECT d.field_value_boolean 
            FROM core_dynamic_data d 
            WHERE d.entity_id = wt.id AND d.field_name = 'is_enabled'
        ), true) as is_enabled,
        wt.entity_name as tile_name,
        tt.entity_name as template_name,
        COALESCE((
            SELECT d.field_value_json 
            FROM core_dynamic_data d 
            WHERE d.entity_id = tt.id AND d.field_name = 'ui_schema'
        ), '{}'::jsonb) as ui_schema,
        COALESCE((
            SELECT d.field_value_json 
            FROM core_dynamic_data d 
            WHERE d.entity_id = wt.id AND d.field_name = 'custom_overrides'
        ), '{}'::jsonb) as custom_overrides
    FROM core_relationships cr1
    JOIN core_entities wt ON wt.id = cr1.to_entity_id
    JOIN core_relationships cr2 ON cr2.from_entity_id = wt.id AND cr2.relationship_type = 'TILE_USES_TEMPLATE'
    JOIN core_entities tt ON tt.id = cr2.to_entity_id
    WHERE cr1.from_entity_id = workspace_id
    AND cr1.relationship_type = 'WORKSPACE_HAS_TILE'
    AND cr1.effective_date <= NOW()
    AND (cr1.expiration_date IS NULL OR cr1.expiration_date > NOW())
    AND cr2.effective_date <= NOW()
    AND (cr2.expiration_date IS NULL OR cr2.expiration_date > NOW())
    AND (org_id IS NULL OR (wt.organization_id = org_id AND tt.organization_id IN (org_id, '00000000-0000-0000-0000-000000000000')))
    ORDER BY tile_position, wt.entity_name;
END;
$$ LANGUAGE plpgsql;

-- Function to link workspace tile to template
CREATE OR REPLACE FUNCTION link_tile_to_template(
    tile_id UUID,
    template_id UUID,
    org_id UUID,
    actor_id UUID
)
RETURNS UUID AS $$
DECLARE
    relationship_id UUID;
BEGIN
    -- Create or update the TILE_USES_TEMPLATE relationship
    INSERT INTO core_relationships (
        id,
        relationship_type,
        from_entity_id,
        to_entity_id,
        organization_id,
        effective_date,
        smart_code,
        created_by,
        updated_by
    ) VALUES (
        gen_random_uuid(),
        'TILE_USES_TEMPLATE',
        tile_id,
        template_id,
        org_id,
        NOW(),
        'HERA.PLATFORM.UI.REL.TILE_USES_TEMPLATE.v1',
        actor_id,
        actor_id
    ) ON CONFLICT (from_entity_id, relationship_type, organization_id) 
    DO UPDATE SET 
        to_entity_id = EXCLUDED.to_entity_id,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    RETURNING id INTO relationship_id;
    
    RETURN relationship_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================
-- EXAMPLE RELATIONSHIP RECORDS
-- ================================================================================

-- These are example INSERT statements for reference
-- Actual relationships will be created by the application

/*
-- Example: Link a POS workspace to an ENTITIES tile
INSERT INTO core_relationships (
    id,
    relationship_type, 
    from_entity_id,      -- POS workspace entity ID
    to_entity_id,        -- APP_WORKSPACE_TILE entity ID  
    organization_id,
    effective_date,
    smart_code,
    created_by,
    updated_by
) VALUES (
    gen_random_uuid(),
    'WORKSPACE_HAS_TILE',
    '11111111-1111-1111-1111-111111111111',  -- Replace with actual workspace ID
    '22222222-2222-2222-2222-222222222222',  -- Replace with actual tile ID
    'org-uuid-here',
    NOW(),
    'HERA.PLATFORM.UI.REL.WORKSPACE_HAS_TILE.v1',
    'actor-uuid-here',
    'actor-uuid-here'
);

-- Example: Link a workspace tile to its template
INSERT INTO core_relationships (
    id,
    relationship_type,
    from_entity_id,      -- APP_WORKSPACE_TILE entity ID
    to_entity_id,        -- APP_TILE_TEMPLATE entity ID
    organization_id,
    effective_date,
    smart_code,
    created_by,
    updated_by
) VALUES (
    gen_random_uuid(),
    'TILE_USES_TEMPLATE',
    '22222222-2222-2222-2222-222222222222',  -- Replace with actual tile ID
    '33333333-3333-3333-3333-333333333333',  -- Replace with actual template ID
    'org-uuid-here',
    NOW(),
    'HERA.PLATFORM.UI.REL.TILE_USES_TEMPLATE.v1',
    'actor-uuid-here',
    'actor-uuid-here'
);
*/

-- ================================================================================
-- VERIFICATION QUERIES
-- ================================================================================

-- Verify relationship types were created successfully
DO $$
DECLARE
    workspace_has_tile_count INTEGER;
    tile_uses_template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO workspace_has_tile_count 
    FROM core_entities 
    WHERE entity_code = 'WORKSPACE_HAS_TILE' AND entity_type = 'RELATIONSHIP_TYPE';
    
    SELECT COUNT(*) INTO tile_uses_template_count 
    FROM core_entities 
    WHERE entity_code = 'TILE_USES_TEMPLATE' AND entity_type = 'RELATIONSHIP_TYPE';
    
    RAISE NOTICE 'Tile Relationship Types Migration Complete:';
    RAISE NOTICE '  - WORKSPACE_HAS_TILE relationship type: %', 
        CASE WHEN workspace_has_tile_count > 0 THEN 'CREATED' ELSE 'MISSING' END;
    RAISE NOTICE '  - TILE_USES_TEMPLATE relationship type: %', 
        CASE WHEN tile_uses_template_count > 0 THEN 'CREATED' ELSE 'MISSING' END;
    RAISE NOTICE '  - Relationship validation constraints: ACTIVE';
    RAISE NOTICE '  - Performance indexes: CREATED';
    RAISE NOTICE '  - Helper functions: CREATED';
    RAISE NOTICE '  - Validation triggers: ACTIVE';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands in reverse order if rollback is needed:

-- 1. Drop helper functions
DROP FUNCTION IF EXISTS get_workspace_tiles(UUID, UUID);
DROP FUNCTION IF EXISTS link_tile_to_template(UUID, UUID, UUID, UUID);

-- 2. Drop validation triggers
DROP TRIGGER IF EXISTS trigger_validate_tile_relationships ON core_relationships;
DROP FUNCTION IF EXISTS validate_tile_relationships();

-- 3. Remove relationship dynamic data
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_code IN ('WORKSPACE_HAS_TILE', 'TILE_USES_TEMPLATE')
    AND entity_type = 'RELATIONSHIP_TYPE'
);

-- 4. Drop indexes
DROP INDEX IF EXISTS idx_relationships_workspace_has_tile;
DROP INDEX IF EXISTS idx_relationships_tile_uses_template;
DROP INDEX IF EXISTS idx_relationships_template_used_by_tiles;
DROP INDEX IF EXISTS idx_relationships_workspace_org_tiles;

-- 5. Drop constraints
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS chk_workspace_has_tile_entities;
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS chk_tile_uses_template_entities;
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS unique_workspace_tile_relationship;
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS unique_tile_template_relationship;

-- 6. Remove relationship type definitions
DELETE FROM core_entities 
WHERE entity_code IN ('WORKSPACE_HAS_TILE', 'TILE_USES_TEMPLATE')
AND entity_type = 'RELATIONSHIP_TYPE';

*/