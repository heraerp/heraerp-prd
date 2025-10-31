-- ============================================================================
-- FIX: hera_txn_crud_v1 - Pass filters correctly to hera_txn_query_v1
-- Date: 2025-10-31
-- Issue: Date filters not working in daily sales report
-- Root Cause: Orchestrator extracting filters from p_payload.filters, but
--             client sends filters directly in p_payload
-- ============================================================================

-- ❌ CURRENT (WRONG) - Line 64 and 128:
/*
v_filters := COALESCE(p_payload->'filters', '{}'::jsonb);  -- Line 64

ELSIF v_action = 'query' THEN
  v_resp := hera_txn_query_v1(p_organization_id, v_filters);  -- Line 128
  v_ok := true;
*/

-- ✅ FIXED:
/*
-- Remove the v_filters extraction line (line 64)
-- OR change line 128 to:

ELSIF v_action = 'query' THEN
  -- Pass p_payload directly as filters (date_from, date_to are at root level)
  v_resp := hera_txn_query_v1(p_organization_id, p_payload);
  v_ok := true;
*/

-- ============================================================================
-- COMPLETE FIXED FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.hera_txn_crud_v1(
  p_action            text,
  p_actor_user_id     uuid,
  p_organization_id   uuid,
  p_payload           jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_action text := lower(trim(p_action));
  v_header jsonb;
  v_lines  jsonb;
  v_txn_id uuid;
  v_patch   jsonb;
  v_reason  text;
  v_reversal_date timestamptz;
  v_resp   jsonb;
  v_ok     boolean := false;
  v_guard  jsonb := '[]'::jsonb;
  v_sc_regex text := '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';
  v_header_org uuid;
  v_header_sc  text;
BEGIN
  -- Extract common fields
  v_header := COALESCE(p_payload->'header', '{}'::jsonb);
  v_lines  := COALESCE(p_payload->'lines', '[]'::jsonb);
  v_patch   := COALESCE(p_payload->'patch', '{}'::jsonb);
  v_reason  := COALESCE((p_payload->>'reason')::text, NULL);
  v_reversal_date := COALESCE((p_payload->>'reversal_date')::timestamptz, now());
  v_txn_id := NULLIF(p_payload->>'transaction_id','')::uuid;

  -- Guardrail: org_id
  IF v_header ? 'organization_id' THEN
    v_header_org := (v_header->>'organization_id')::uuid;
    IF v_header_org IS NULL OR v_header_org <> p_organization_id THEN
      v_guard := v_guard || jsonb_build_object(
        'code','ORG-FILTER-REQUIRED',
        'msg','organization_id missing/mismatch on header'
      );
    END IF;
  ELSIF v_action IN ('create','emit') THEN
    v_guard := v_guard || jsonb_build_object(
      'code','ORG-FILTER-REQUIRED',
      'msg','header.organization_id is required for create/emit'
    );
  END IF;

  -- Guardrail: Smart Code
  IF v_action IN ('create','emit','update') THEN
    v_header_sc := v_header->>'smart_code';
    IF v_header_sc IS NULL OR v_header_sc !~ v_sc_regex THEN
      v_guard := v_guard || jsonb_build_object(
        'code','SMARTCODE-PRESENT',
        'msg','smart_code missing/invalid on header',
        'pattern', v_sc_regex
      );
    END IF;
  END IF;

  IF jsonb_array_length(v_guard) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', upper(v_action),
      'error', 'guardrail_violations',
      'violations', v_guard
    );
  END IF;

  -- Route by action
  IF v_action = 'create' THEN
    v_resp := hera_txn_create_v1(v_header, v_lines, p_actor_user_id);
    v_txn_id := NULLIF(v_resp->>'transaction_id','')::uuid;
    IF v_txn_id IS NOT NULL THEN
      PERFORM hera_txn_validate_v1(p_organization_id, v_txn_id);
    END IF;
    v_ok := true;

  ELSIF v_action = 'read' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for read'; END IF;
    v_resp := hera_txn_read_v1(
      p_organization_id,
      v_txn_id,
      COALESCE((p_payload->>'include_lines')::boolean, true),
      COALESCE((p_payload->>'include_deleted')::boolean, false)
    );
    v_ok := true;

  ELSIF v_action = 'query' THEN
    -- ✅ FIX: Pass p_payload directly (filters are at root level, not in p_payload.filters)
    v_resp := hera_txn_query_v1(p_organization_id, p_payload);
    v_ok := true;

  ELSIF v_action = 'update' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for update'; END IF;
    v_resp := hera_txn_update_v1(p_organization_id, v_txn_id, v_patch, p_actor_user_id);
    v_ok := true;

  ELSIF v_action = 'delete' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for delete'; END IF;
    v_resp := hera_txn_delete_v1(p_organization_id, v_txn_id);
    v_ok := true;

  ELSIF v_action = 'emit' THEN
    v_resp := hera_txn_emit_v1(
      p_organization_id,
      v_header->>'transaction_type',
      v_header->>'smart_code',
      v_header->>'transaction_code',
      COALESCE((v_header->>'transaction_date')::timestamptz, now()),
      NULLIF(v_header->>'source_entity_id','')::uuid,
      NULLIF(v_header->>'target_entity_id','')::uuid,
      COALESCE((v_header->>'total_amount')::numeric, 0),
      COALESCE(v_header->>'transaction_status','pending'),
      v_header->>'reference_number',
      v_header->>'external_reference',
      COALESCE(v_header->'business_context','{}'::jsonb),
      COALESCE(v_header->'metadata','{}'::jsonb),
      p_actor_user_id
    );
    v_ok := true;

  ELSIF v_action = 'reverse' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for reverse'; END IF;
    v_resp := hera_txn_reverse_v1(p_organization_id, v_txn_id, v_reversal_date, v_reason, p_actor_user_id);
    v_ok := true;

  ELSIF v_action = 'void' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for void'; END IF;
    v_resp := hera_txn_void_v1(p_organization_id, v_txn_id, v_reason, p_actor_user_id);
    v_ok := true;

  ELSIF v_action = 'validate' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for validate'; END IF;
    v_resp := hera_txn_validate_v1(p_organization_id, v_txn_id);
    v_ok := true;

  ELSE
    RAISE EXCEPTION 'Unknown action: %', v_action;
  END IF;

  RETURN jsonb_build_object(
    'success', v_ok,
    'action', upper(v_action),
    'transaction_id', v_txn_id,
    'data', v_resp
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'action', upper(v_action),
    'error', SQLERRM
  );
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.hera_txn_crud_v1(text,uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_txn_crud_v1(text,uuid,uuid,jsonb) TO authenticated, service_role;

-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================

/*
1. Copy the entire CREATE OR REPLACE FUNCTION statement above
2. Go to Supabase Dashboard → SQL Editor
3. Paste and run the SQL
4. Verify deployment with the query below
5. Test in the application (daily sales report)
*/

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check if function exists and has correct structure
SELECT
  proname AS function_name,
  prosrc LIKE '%hera_txn_query_v1(p_organization_id, p_payload)%' AS has_correct_query_call,
  prosrc NOT LIKE '%v_filters%' AS removed_filters_variable
FROM pg_proc
WHERE proname = 'hera_txn_crud_v1';

-- Expected output:
-- function_name        | has_correct_query_call | removed_filters_variable
-- ---------------------|------------------------|-------------------------
-- hera_txn_crud_v1     | true                   | true (optional)

-- ============================================================================
-- ROOT CAUSE ANALYSIS
-- ============================================================================

/*
Problem:
  - Daily sales report was getting transactions from wrong dates (Oct 28-31 instead of just Oct 31)
  - Date filters (date_from, date_to) were being sent but ignored

Client Code (useUniversalTransactionV1.ts):
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    date_from: '2025-10-31T00:00:00.000Z',
    date_to: '2025-10-31T23:59:59.999Z',
    ...
  }

Old Orchestrator Code (WRONG):
  v_filters := COALESCE(p_payload->'filters', '{}'::jsonb);  -- Looks for p_payload.filters
  v_resp := hera_txn_query_v1(p_organization_id, v_filters);  -- Passes empty object!

Query Function (hera_txn_query_v1):
  v_date_from := (p_filters->>'date_from')::timestamptz;  -- Gets NULL because filters are empty
  v_date_to := (p_filters->>'date_to')::timestamptz;      -- Gets NULL because filters are empty
  -- When NULL, the WHERE clause doesn't filter by date!

New Orchestrator Code (FIXED):
  v_resp := hera_txn_query_v1(p_organization_id, p_payload);  -- Pass p_payload directly

Result:
  - date_from and date_to are now passed correctly
  - Query function receives filters at the right level
  - Daily sales report shows only transactions for the selected date
*/

-- ============================================================================
-- TEST THE FIX
-- ============================================================================

/*
After deployment, verify the fix:

1. Go to /salon/reports/sales/daily
2. Select a specific date (e.g., Oct 31, 2025)
3. Check browser console logs:
   - Should see: "requested_date_from: 2025-10-31T00:00:00.000Z"
   - Should see: "requested_date_to: 2025-10-31T23:59:59.999Z"
   - Should see: "dates_match_filter: true"
4. Verify only transactions from that date are shown
5. Change to a different date and verify results update correctly
*/
