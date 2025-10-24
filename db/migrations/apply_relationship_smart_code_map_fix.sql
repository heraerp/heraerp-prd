-- =====================================================================
-- APPLY: Relationship Smart Code Map Fix for hera_entities_crud_v1
-- =====================================================================
--
-- This script applies the fix to support relationship_smart_code_map
-- which allows passing different smart_codes for different relationship types
--
-- CHANGE REQUIRED:
-- Inside the relationships processing loop (lines 267-304), change from:
--   v_relationship_smart_code (defined once at line 17)
-- To:
--   Extract smart_code per relationship type from the map
--
-- Line 17 (REMOVE or keep for backward compatibility):
--   v_relationship_smart_code text := NULLIF(p_options->>'relationship_smart_code','');
--
-- Inside FOREACH k IN ARRAY v_rel_types LOOP (around line 268):
--   ADD THIS LINE at the start of the loop:
--   v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');
--
-- =====================================================================

-- Find and replace in the relationships section:

-- OLD CODE (lines 267-275):
/*
    IF jsonb_typeof(p_relationships)='object' AND EXISTS (SELECT 1 FROM jsonb_object_keys(p_relationships) LIMIT 1) THEN
      SELECT array_agg(key) INTO v_rel_types FROM jsonb_object_keys(p_relationships) AS t(key);
      IF v_rel_types IS NOT NULL THEN
        FOREACH k IN ARRAY v_rel_types LOOP
          IF v_relationships_mode='UPSERT' THEN
*/

-- NEW CODE (add smart_code extraction inside loop):
/*
    IF jsonb_typeof(p_relationships)='object' AND EXISTS (SELECT 1 FROM jsonb_object_keys(p_relationships) LIMIT 1) THEN
      SELECT array_agg(key) INTO v_rel_types FROM jsonb_object_keys(p_relationships) AS t(key);
      IF v_rel_types IS NOT NULL THEN
        FOREACH k IN ARRAY v_rel_types LOOP
          -- ✅ FIX: Extract smart_code per relationship type from map
          v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');

          IF v_relationships_mode='UPSERT' THEN
*/

-- Full corrected section (lines 267-304):

CREATE OR REPLACE FUNCTION public.hera_entities_crud_v1(
  p_action            text,
  p_actor_user_id     uuid,
  p_organization_id   uuid,
  p_entity            jsonb DEFAULT '{}'::jsonb,
  p_dynamic           jsonb DEFAULT '{}'::jsonb,
  p_relationships     jsonb DEFAULT '{}'::jsonb,
  p_options           jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- Options / toggles
  v_action text := upper(coalesce(p_action,''));
  v_include_dyn bool := coalesce((p_options->>'include_dynamic')::bool, true);
  v_include_rel bool := coalesce((p_options->>'include_relationships')::bool, true);
  v_limit int := coalesce((p_options->>'limit')::int, 100);
  v_offset int := coalesce((p_options->>'offset')::int, 0);
  v_relationships_mode text := upper(coalesce(p_options->>'relationships_mode','UPSERT')); -- UPSERT|REPLACE
  v_emit_audit bool := coalesce((p_options->>'audit')::bool, false);
  -- ✅ CHANGED: v_relationship_smart_code now extracted per relationship type in loop
  v_relationship_smart_code text := NULL;
  v_allow_platform_identity bool := coalesce((p_options->>'allow_platform_identity')::bool, false);
  v_audit_actor_user_id uuid := NULLIF(p_options->>'audit_actor_user_id','')::uuid;
  v_system_actor_user_id uuid := NULLIF(p_options->>'system_actor_user_id','')::uuid;
  v_list_mode text := upper(coalesce(p_options->>'list_mode','FULL')); -- HEADERS | FULL

  -- [... rest of DECLARE section unchanged ...]

BEGIN
  -- [... all code before relationships section unchanged ...]

  -- ✅ FIXED: Relationships section with per-type smart_code extraction
  IF jsonb_typeof(p_relationships)='object' AND EXISTS (SELECT 1 FROM jsonb_object_keys(p_relationships) LIMIT 1) THEN
    SELECT array_agg(key) INTO v_rel_types FROM jsonb_object_keys(p_relationships) AS t(key);
    IF v_rel_types IS NOT NULL THEN
      FOREACH k IN ARRAY v_rel_types LOOP
        -- ✅ FIX: Extract smart_code per relationship type from map
        v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');

        IF v_relationships_mode='UPSERT' THEN
          FOR t_to IN SELECT value::uuid FROM jsonb_array_elements_text(coalesce(p_relationships->k,'[]'::jsonb))
          LOOP
            PERFORM public.hera_relationship_upsert_v1(
              p_organization_id, v_entity_id, t_to, k,
              v_relationship_smart_code, 'forward', 1.0,
              '{}'::jsonb, 'DRAFT', 0.0, NULL,
              '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
              true, now(), NULL, v_effective_actor
            );
          END LOOP;
        ELSE
          -- REPLACE: remove all then add targets
          DELETE FROM core_relationships
           WHERE organization_id=p_organization_id
             AND from_entity_id=v_entity_id
             AND relationship_type=k;
          FOR t_to IN SELECT value::uuid FROM jsonb_array_elements_text(coalesce(p_relationships->k,'[]'::jsonb))
          LOOP
            PERFORM public.hera_relationship_upsert_v1(
              p_organization_id, v_entity_id, t_to, k,
              v_relationship_smart_code, 'forward', 1.0,
              '{}'::jsonb, 'DRAFT', 0.0, NULL,
              '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
              true, now(), NULL, v_effective_actor
            );
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- [... rest of function unchanged ...]
END;
$$;

-- =====================================================================
-- SUMMARY OF CHANGES
-- =====================================================================
--
-- 1. Line 17: Changed v_relationship_smart_code initialization to NULL
--    (no longer extracting single value from p_options)
--
-- 2. Inside FOREACH k IN ARRAY v_rel_types LOOP (after line 268):
--    Added: v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');
--
-- This allows each relationship type to have its own smart_code from the map.
--
-- =====================================================================
