-- ========================================
-- HERA Transaction CRUD v1 - Fix QUERY Delegation
-- ========================================
-- Purpose: Fix filter passing from hera_txn_crud_v1 to hera_txn_query_v1
-- Issue: Client sends filters nested in p_payload.filters but query expects root level
-- Date: 2025-01-12
-- ========================================

-- Find and update only the QUERY action handling in hera_txn_crud_v1
-- This assumes the function exists and only needs the QUERY section fixed

-- Since we can't selectively update a function, we need to see the full function
-- Let's create a helper comment for manual fix:

/*
MANUAL FIX REQUIRED IN hera_txn_crud_v1:

CHANGE THIS:
  ELSIF v_action = 'query' THEN
    v_resp := hera_txn_query_v1(p_organization_id, p_payload);
    v_ok := true;

TO THIS:
  ELSIF v_action = 'query' THEN
    -- ✅ FIX: Extract filters from p_payload.filters (client sends nested)
    v_resp := hera_txn_query_v1(
      p_organization_id,
      COALESCE(p_payload->'filters', p_payload)  -- Try nested first, fallback to root
    );
    v_ok := true;

EXPLANATION:
- Client sends: { filters: { source_entity_id: '...', limit: 10 } }
- hera_txn_query_v1 expects: { source_entity_id: '...', limit: 10 }
- COALESCE handles both nested (new) and root-level (legacy) formats
*/

-- Since the function body is large and we don't have the full definition here,
-- let's create a verification query instead:

-- Verification: Test if the fix is needed
DO $$
DECLARE
  v_test_result jsonb;
  v_test_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Test with nested filters (how client sends it)
  BEGIN
    v_test_result := hera_txn_crud_v1(
      'query',
      NULL,  -- Actor not required for QUERY
      v_test_org_id,
      '{"filters": {"limit": 1, "include_lines": false}}'::jsonb
    );

    IF v_test_result->>'success' = 'true' THEN
      RAISE NOTICE '✅ QUERY delegation working with nested filters';
    ELSE
      RAISE NOTICE '❌ QUERY delegation NOT working: %', v_test_result->>'error';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ QUERY delegation ERROR: %', SQLERRM;
  END;
END $$;

COMMENT ON FUNCTION hera_txn_crud_v1 IS 'HERA Transaction CRUD Orchestrator v1 - VERIFY: QUERY should extract p_payload.filters before delegating to hera_txn_query_v1';
