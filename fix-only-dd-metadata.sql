-- ============================================================================
-- Fix ONLY dd.metadata References (core_dynamic_data)
-- ============================================================================
-- CORRECT ANALYSIS:
-- - core_entities HAS metadata column -> KEEP e.metadata ✅
-- - core_dynamic_data does NOT have metadata column -> REMOVE dd.metadata ❌
-- ============================================================================

-- Quick test to verify our understanding
DO $$
BEGIN
    -- This should work (entities has metadata)
    PERFORM metadata FROM core_entities LIMIT 1;
    RAISE NOTICE 'core_entities.metadata exists ✅';
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'core_entities.metadata does NOT exist ❌';
END $$;

DO $$
BEGIN
    -- This should fail (dynamic data doesn't have metadata)
    PERFORM metadata FROM core_dynamic_data LIMIT 1;
    RAISE NOTICE 'core_dynamic_data.metadata exists ✅';
EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'core_dynamic_data.metadata does NOT exist ❌ (this is expected)';
END $$;