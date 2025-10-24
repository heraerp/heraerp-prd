-- =====================================================================
-- FIX: Support relationship_smart_code_map in hera_entities_crud_v1
-- =====================================================================
--
-- PROBLEM:
--   RPC uses single v_relationship_smart_code for ALL relationships
--   This causes NULL smart_code when creating relationships
--
-- SOLUTION:
--   Extract relationship_smart_code_map from p_options (JSON object)
--   Look up smart_code per relationship type from the map
--
-- USAGE:
--   p_options: {
--     relationship_smart_code_map: {
--       "STAFF_HAS_ROLE": "HERA.SALON.STAFF.REL.HAS_ROLE.V1",
--       "STAFF_MEMBER_OF": "HERA.SALON.STAFF.REL.MEMBER_OF.V1"
--     }
--   }
-- =====================================================================

-- Update the relationships section of hera_entities_crud_v1
-- Lines 267-304 in the original function

-- The key change is to extract smart_code from the map per relationship type:
--   v_rel_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');

-- Here's the updated section for the relationships handling:

/*
    -- Relationships
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
*/

-- Apply this change at line 268 in the original function
-- Change from:
--   v_relationship_smart_code := NULLIF(p_options->>'relationship_smart_code','');
-- To (inside the FOREACH loop):
--   v_relationship_smart_code := NULLIF(p_options->'relationship_smart_code_map'->>k, '');
