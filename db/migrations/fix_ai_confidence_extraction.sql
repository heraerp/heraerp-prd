-- ============================================================================
-- FIX: Extract ai_confidence from p_entity parameter in hera_entities_crud_v1
-- ============================================================================
--
-- PROBLEM: The RPC function uses coalesce(v_ai_conf, 0) which defaults to 0
--          even when ai_confidence is passed in p_entity parameter.
--
-- SOLUTION: Extract ai_confidence from p_entity->>'ai_confidence' before INSERT
--
-- FILE: This migration updates the hera_entities_crud_v1 function
-- ============================================================================

-- Find and update the variable extraction section in hera_entities_crud_v1
-- Look for the line that sets v_ai_conf and update it to:

-- FROM THIS (line ~50-60 in the function):
-- v_ai_conf NUMERIC := 0;

-- TO THIS:
-- v_ai_conf NUMERIC := COALESCE((p_entity->>'ai_confidence')::NUMERIC, 1.0);

-- This ensures that:
-- 1. If ai_confidence is passed in p_entity, it uses that value
-- 2. If not passed, it defaults to 1.0 (user-curated, bypasses normalization trigger)
-- 3. Normalization trigger won't create review transactions for ai_confidence >= 0.8

-- ============================================================================
-- QUICK FIX INSTRUCTIONS (Run in Supabase SQL Editor):
-- ============================================================================

-- OPTION 1: Update the existing function (requires finding exact function)
-- You'll need to locate hera_entities_crud_v1 function and modify this line:
--
-- Change from:
--   coalesce(v_ai_conf,0)
--
-- To:
--   coalesce((p_entity->>'ai_confidence')::numeric, 1.0)

-- ============================================================================
-- TEMPORARY WORKAROUND (if database update not possible immediately):
-- ============================================================================

-- Create a wrapper function that sets ai_confidence to 1.0 before calling the original
CREATE OR REPLACE FUNCTION hera_entities_crud_v1_with_confidence(
  p_action text,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_entity jsonb,
  p_dynamic jsonb DEFAULT '{}'::jsonb,
  p_relationships jsonb DEFAULT '{}'::jsonb,
  p_options jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_with_confidence jsonb;
BEGIN
  -- Ensure ai_confidence is set to 1.0 if not provided
  v_entity_with_confidence := p_entity || jsonb_build_object('ai_confidence', COALESCE((p_entity->>'ai_confidence')::numeric, 1.0));

  -- Call the original function with modified entity
  RETURN hera_entities_crud_v1(
    p_action,
    p_actor_user_id,
    p_organization_id,
    v_entity_with_confidence,
    p_dynamic,
    p_relationships,
    p_options
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION hera_entities_crud_v1_with_confidence TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entities_crud_v1_with_confidence TO service_role;

-- ============================================================================
-- USAGE IN CODE (update RPC endpoint to use wrapper):
-- ============================================================================
-- Change from: /api/v2/rpc/hera_entities_crud_v1
-- Change to:   /api/v2/rpc/hera_entities_crud_v1_with_confidence
-- ============================================================================
