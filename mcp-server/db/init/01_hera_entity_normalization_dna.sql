-- ================================================================================================
-- HERA Entity Normalization DNA for Postgres/Supabase
-- ================================================================================================
-- Purpose: Prevent duplicate entities through intelligent normalization and fuzzy matching
-- Version: 1.0
-- 
-- This is a rerunnable script that implements:
-- 1. Smart code constraints with NOT VALID
-- 2. RLS policies using hera_current_org_id()
-- 3. Entity normalization trigger (hera_normalize_entity_biu)
-- 4. Review queue tables for potential duplicates
-- 5. rpc_entities_resolve_and_upsert function for atomic resolution
-- 6. Helpful indexes including trigram GIN for fuzzy matching
-- ================================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ================================================================================================
-- PART 1: Smart Code Constraints (NOT VALID)
-- ================================================================================================

-- Add smart code constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_smart_code_format' 
        AND conrelid = 'core_entities'::regclass
    ) THEN
        ALTER TABLE core_entities 
        ADD CONSTRAINT chk_smart_code_format 
        CHECK (smart_code ~ '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v[0-9]+$') 
        NOT VALID;
    END IF;
END $$;

-- Add organization_id requirement
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_organization_id_required' 
        AND conrelid = 'core_entities'::regclass
    ) THEN
        ALTER TABLE core_entities 
        ADD CONSTRAINT chk_organization_id_required 
        CHECK (organization_id IS NOT NULL) 
        NOT VALID;
    END IF;
END $$;

-- ================================================================================================
-- PART 2: RLS Policies
-- ================================================================================================

-- Ensure RLS is enabled
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "entities_org_isolation" ON core_entities;
DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
DROP POLICY IF EXISTS "relationships_org_isolation" ON core_relationships;
DROP POLICY IF EXISTS "transactions_org_isolation" ON universal_transactions;
DROP POLICY IF EXISTS "transaction_lines_org_isolation" ON universal_transaction_lines;

-- Create new RLS policies using hera_current_org_id()
CREATE POLICY "entities_org_isolation" ON core_entities
    FOR ALL
    USING (organization_id = hera_current_org_id())
    WITH CHECK (organization_id = hera_current_org_id());

CREATE POLICY "dynamic_data_org_isolation" ON core_dynamic_data
    FOR ALL
    USING (organization_id = hera_current_org_id())
    WITH CHECK (organization_id = hera_current_org_id());

CREATE POLICY "relationships_org_isolation" ON core_relationships
    FOR ALL
    USING (organization_id = hera_current_org_id())
    WITH CHECK (organization_id = hera_current_org_id());

CREATE POLICY "transactions_org_isolation" ON universal_transactions
    FOR ALL
    USING (organization_id = hera_current_org_id())
    WITH CHECK (organization_id = hera_current_org_id());

CREATE POLICY "transaction_lines_org_isolation" ON universal_transaction_lines
    FOR ALL
    USING (organization_id = hera_current_org_id())
    WITH CHECK (organization_id = hera_current_org_id());

-- ================================================================================================
-- PART 3: Normalization Functions
-- ================================================================================================

-- Drop and recreate normalization function
DROP FUNCTION IF EXISTS hera_normalize_text(text);
CREATE OR REPLACE FUNCTION hera_normalize_text(input_text text)
RETURNS text AS $$
BEGIN
    -- Normalize text for consistent matching:
    -- 1. Convert to lowercase
    -- 2. Remove accents
    -- 3. Replace multiple spaces with single space
    -- 4. Trim whitespace
    -- 5. Remove common suffixes like LLC, Inc, Ltd
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    LOWER(UNACCENT(input_text)),
                    '\s+(llc|inc|ltd|limited|corporation|corp|company|co)\.?$', 
                    '', 
                    'gi'
                ),
                '[^a-z0-9\s]', 
                ' ', 
                'g'
            ),
            '\s+', 
            ' ', 
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================================================================
-- PART 4: Entity Normalization Trigger
-- ================================================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_normalize_entity ON core_entities;
DROP FUNCTION IF EXISTS hera_normalize_entity_biu();

-- Create trigger function
CREATE OR REPLACE FUNCTION hera_normalize_entity_biu()
RETURNS TRIGGER AS $$
DECLARE
    v_normalized_name text;
    v_existing_id uuid;
BEGIN
    -- Only process on INSERT or UPDATE of entity_name
    IF TG_OP = 'UPDATE' AND OLD.entity_name = NEW.entity_name THEN
        RETURN NEW;
    END IF;
    
    -- Generate normalized name
    v_normalized_name := hera_normalize_text(NEW.entity_name);
    
    -- Store normalized name in dynamic data
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_value_text,
        organization_id,
        smart_code,
        created_by,
        updated_by
    ) VALUES (
        NEW.id,
        'normalized_name',
        v_normalized_name,
        NEW.organization_id,
        'HERA.SYSTEM.NORMALIZATION.NAME.v1',
        NEW.created_by,
        NEW.updated_by
    )
    ON CONFLICT (entity_id, field_name) 
    DO UPDATE SET 
        field_value_text = EXCLUDED.field_value_text,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by;
    
    -- Check for potential duplicates using fuzzy matching
    SELECT id INTO v_existing_id
    FROM core_entities e
    WHERE e.organization_id = NEW.organization_id
      AND e.entity_type = NEW.entity_type
      AND e.id != NEW.id
      AND e.status != 'deleted'
      AND similarity(e.entity_name, NEW.entity_name) > 0.8
    LIMIT 1;
    
    -- If potential duplicate found, create review queue entry
    IF v_existing_id IS NOT NULL THEN
        INSERT INTO core_dynamic_data (
            entity_id,
            field_name,
            field_value_text,
            organization_id,
            smart_code,
            metadata,
            created_by,
            updated_by
        ) VALUES (
            NEW.id,
            'potential_duplicate_of',
            v_existing_id::text,
            NEW.organization_id,
            'HERA.SYSTEM.DUPLICATE.REVIEW.v1',
            jsonb_build_object(
                'similarity_score', similarity(
                    (SELECT entity_name FROM core_entities WHERE id = v_existing_id),
                    NEW.entity_name
                ),
                'detection_method', 'fuzzy_match',
                'detected_at', NOW()
            ),
            NEW.created_by,
            NEW.updated_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_normalize_entity
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION hera_normalize_entity_biu();

-- ================================================================================================
-- PART 5: Review Queue View
-- ================================================================================================

-- Create view for duplicate review queue
CREATE OR REPLACE VIEW vw_duplicate_review_queue AS
SELECT 
    e1.id as entity_id,
    e1.entity_type,
    e1.entity_name,
    e1.entity_code,
    e2.id as potential_duplicate_id,
    e2.entity_name as potential_duplicate_name,
    e2.entity_code as potential_duplicate_code,
    (dd.metadata->>'similarity_score')::numeric as similarity_score,
    dd.created_at as detected_at,
    e1.organization_id
FROM core_dynamic_data dd
JOIN core_entities e1 ON dd.entity_id = e1.id
JOIN core_entities e2 ON dd.field_value_text::uuid = e2.id
WHERE dd.field_name = 'potential_duplicate_of'
  AND dd.smart_code = 'HERA.SYSTEM.DUPLICATE.REVIEW.v1'
  AND e1.status != 'deleted'
  AND e2.status != 'deleted'
ORDER BY dd.created_at DESC;

-- Grant permissions on view
GRANT SELECT ON vw_duplicate_review_queue TO authenticated;
GRANT SELECT ON vw_duplicate_review_queue TO service_role;

-- ================================================================================================
-- PART 6: Entity Resolution Function
-- ================================================================================================

-- Drop and recreate the main resolution function
DROP FUNCTION IF EXISTS rpc_entities_resolve_and_upsert(uuid, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION rpc_entities_resolve_and_upsert(
    p_org_id uuid,
    p_entity_type text,
    p_entity_name text,
    p_entity_code text DEFAULT NULL,
    p_smart_code text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS TABLE (
    entity_id uuid,
    is_new boolean,
    matched_by text,
    confidence_score numeric
) AS $$
DECLARE
    v_normalized_name text;
    v_existing_id uuid;
    v_new_id uuid;
    v_matched_by text;
    v_confidence numeric;
    v_entity_code text;
    v_smart_code text;
BEGIN
    -- Validate inputs
    IF p_org_id IS NULL OR p_entity_type IS NULL OR p_entity_name IS NULL THEN
        RAISE EXCEPTION 'org_id, entity_type, and entity_name are required';
    END IF;
    
    -- Normalize the entity name
    v_normalized_name := hera_normalize_text(p_entity_name);
    
    -- Generate entity_code if not provided
    v_entity_code := COALESCE(
        p_entity_code, 
        UPPER(p_entity_type) || '-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')
    );
    
    -- Generate smart_code if not provided
    v_smart_code := COALESCE(
        p_smart_code,
        'HERA.UNIVERSAL.' || UPPER(p_entity_type) || '.ENTITY.MASTER.v1'
    );
    
    -- Try exact match on entity_code first (highest confidence)
    IF p_entity_code IS NOT NULL THEN
        SELECT e.id INTO v_existing_id
        FROM core_entities e
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND e.entity_code = p_entity_code
          AND e.status != 'deleted'
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'entity_code';
            v_confidence := 1.0;
        END IF;
    END IF;
    
    -- Try normalized name match
    IF v_existing_id IS NULL THEN
        SELECT e.id INTO v_existing_id
        FROM core_entities e
        JOIN core_dynamic_data dd ON e.id = dd.entity_id
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND e.status != 'deleted'
          AND dd.field_name = 'normalized_name'
          AND dd.field_value_text = v_normalized_name
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'normalized_name';
            v_confidence := 0.95;
        END IF;
    END IF;
    
    -- Try fuzzy match as last resort
    IF v_existing_id IS NULL THEN
        SELECT e.id, similarity(e.entity_name, p_entity_name) INTO v_existing_id, v_confidence
        FROM core_entities e
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND e.status != 'deleted'
          AND similarity(e.entity_name, p_entity_name) > 0.85
        ORDER BY similarity(e.entity_name, p_entity_name) DESC
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'fuzzy_match';
        END IF;
    END IF;
    
    -- If no match found, create new entity
    IF v_existing_id IS NULL THEN
        INSERT INTO core_entities (
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            metadata
        ) VALUES (
            p_org_id,
            p_entity_type,
            p_entity_name,
            v_entity_code,
            v_smart_code,
            p_metadata
        )
        RETURNING id INTO v_new_id;
        
        RETURN QUERY
        SELECT v_new_id, true, 'created'::text, 1.0::numeric;
    ELSE
        -- Update existing entity if needed
        IF p_metadata IS NOT NULL THEN
            UPDATE core_entities
            SET metadata = metadata || p_metadata,
                updated_at = NOW()
            WHERE id = v_existing_id;
        END IF;
        
        RETURN QUERY
        SELECT v_existing_id, false, v_matched_by, v_confidence;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_entities_resolve_and_upsert TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_entities_resolve_and_upsert TO service_role;

-- ================================================================================================
-- PART 7: Helpful Indexes
-- ================================================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_entities_normalized_lookup 
ON core_entities(organization_id, entity_type, status) 
WHERE status != 'deleted';

CREATE INDEX IF NOT EXISTS idx_entities_name_trgm 
ON core_entities USING gin(entity_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_dynamic_normalized_name 
ON core_dynamic_data(organization_id, field_name, field_value_text) 
WHERE field_name = 'normalized_name';

CREATE INDEX IF NOT EXISTS idx_dynamic_duplicate_review 
ON core_dynamic_data(organization_id, field_name) 
WHERE field_name = 'potential_duplicate_of';

-- ================================================================================================
-- PART 8: Utility Functions
-- ================================================================================================

-- Function to merge duplicate entities
CREATE OR REPLACE FUNCTION rpc_entities_merge_duplicates(
    p_org_id uuid,
    p_master_id uuid,
    p_duplicate_id uuid,
    p_merge_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_relationships_moved integer;
    v_transactions_moved integer;
    v_dynamic_data_moved integer;
BEGIN
    -- Validate both entities exist and belong to the organization
    IF NOT EXISTS (
        SELECT 1 FROM core_entities 
        WHERE id = p_master_id 
        AND organization_id = p_org_id 
        AND status != 'deleted'
    ) THEN
        RAISE EXCEPTION 'Master entity not found or deleted';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM core_entities 
        WHERE id = p_duplicate_id 
        AND organization_id = p_org_id 
        AND status != 'deleted'
    ) THEN
        RAISE EXCEPTION 'Duplicate entity not found or deleted';
    END IF;
    
    -- Move relationships
    UPDATE core_relationships
    SET from_entity_id = p_master_id
    WHERE from_entity_id = p_duplicate_id
    AND organization_id = p_org_id;
    GET DIAGNOSTICS v_relationships_moved = ROW_COUNT;
    
    UPDATE core_relationships
    SET to_entity_id = p_master_id
    WHERE to_entity_id = p_duplicate_id
    AND organization_id = p_org_id;
    GET DIAGNOSTICS v_relationships_moved = v_relationships_moved + ROW_COUNT;
    
    -- Move transactions
    UPDATE universal_transactions
    SET from_entity_id = p_master_id
    WHERE from_entity_id = p_duplicate_id
    AND organization_id = p_org_id;
    GET DIAGNOSTICS v_transactions_moved = ROW_COUNT;
    
    UPDATE universal_transactions
    SET to_entity_id = p_master_id
    WHERE to_entity_id = p_duplicate_id
    AND organization_id = p_org_id;
    GET DIAGNOSTICS v_transactions_moved = v_transactions_moved + ROW_COUNT;
    
    -- Move dynamic data (avoiding duplicates)
    INSERT INTO core_dynamic_data (
        entity_id, field_name, field_value_text, field_value_number, 
        field_value_boolean, field_value_date, organization_id, smart_code
    )
    SELECT 
        p_master_id, field_name, field_value_text, field_value_number,
        field_value_boolean, field_value_date, organization_id, smart_code
    FROM core_dynamic_data
    WHERE entity_id = p_duplicate_id
    AND organization_id = p_org_id
    ON CONFLICT (entity_id, field_name) DO NOTHING;
    GET DIAGNOSTICS v_dynamic_data_moved = ROW_COUNT;
    
    -- Mark duplicate as merged
    UPDATE core_entities
    SET status = 'merged',
        metadata = metadata || jsonb_build_object(
            'merged_into', p_master_id,
            'merged_at', NOW(),
            'merge_metadata', p_merge_metadata
        )
    WHERE id = p_duplicate_id;
    
    -- Create relationship to track merge
    INSERT INTO core_relationships (
        from_entity_id, to_entity_id, relationship_type,
        organization_id, smart_code, metadata
    ) VALUES (
        p_duplicate_id, p_master_id, 'merged_into',
        p_org_id, 'HERA.SYSTEM.MERGE.RELATIONSHIP.v1',
        jsonb_build_object(
            'merge_date', NOW(),
            'relationships_moved', v_relationships_moved,
            'transactions_moved', v_transactions_moved,
            'dynamic_data_moved', v_dynamic_data_moved
        )
    );
    
    -- Return summary
    v_result := jsonb_build_object(
        'success', true,
        'master_id', p_master_id,
        'duplicate_id', p_duplicate_id,
        'relationships_moved', v_relationships_moved,
        'transactions_moved', v_transactions_moved,
        'dynamic_data_moved', v_dynamic_data_moved,
        'merged_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_entities_merge_duplicates TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_entities_merge_duplicates TO service_role;

-- ================================================================================================
-- PART 9: Initial Data Normalization
-- ================================================================================================

-- Normalize existing entities (run once)
DO $$
DECLARE
    v_entity record;
    v_normalized_name text;
BEGIN
    -- Add normalized names for existing entities that don't have them
    FOR v_entity IN 
        SELECT e.* 
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd 
            ON e.id = dd.entity_id 
            AND dd.field_name = 'normalized_name'
        WHERE dd.id IS NULL
        AND e.status != 'deleted'
        LIMIT 1000  -- Process in batches
    LOOP
        v_normalized_name := hera_normalize_text(v_entity.entity_name);
        
        INSERT INTO core_dynamic_data (
            entity_id, field_name, field_value_text,
            organization_id, smart_code
        ) VALUES (
            v_entity.id, 'normalized_name', v_normalized_name,
            v_entity.organization_id, 'HERA.SYSTEM.NORMALIZATION.NAME.v1'
        ) ON CONFLICT (entity_id, field_name) DO NOTHING;
    END LOOP;
END $$;

-- ================================================================================================
-- VERIFICATION QUERIES (commented out, for testing)
-- ================================================================================================

/*
-- Check if normalization is working
SELECT 
    e.entity_name,
    dd.field_value_text as normalized_name,
    e.entity_type,
    e.organization_id
FROM core_entities e
JOIN core_dynamic_data dd ON e.id = dd.entity_id
WHERE dd.field_name = 'normalized_name'
ORDER BY e.created_at DESC
LIMIT 10;

-- Check for potential duplicates
SELECT * FROM vw_duplicate_review_queue;

-- Test the resolution function
SELECT * FROM rpc_entities_resolve_and_upsert(
    '84a3654b-907b-472a-ac8f-a1ffb6fb711b'::uuid,
    'customer',
    'ABC Company LLC'
);
*/