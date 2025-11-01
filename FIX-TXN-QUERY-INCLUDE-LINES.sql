/* ============================================================
   FIX: hera_txn_query_v1 - Add support for include_lines parameter

   ISSUE: Service Analytics showing no data because transaction lines
          are not being returned by the QUERY action, even though
          include_lines: true is being passed.

   ROOT CAUSE: hera_txn_query_v1 function ignores include_lines parameter
               and only returns transaction headers (no lines).

   SOLUTION: Update function to fetch and return transaction lines when
             include_lines = true.
   ============================================================ */

CREATE OR REPLACE FUNCTION public.hera_txn_query_v1(
  p_org_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  -- flags & filters
  v_include_deleted boolean := COALESCE((p_filters->>'include_deleted')::boolean, false);  -- "include voided"
  v_include_lines   boolean := COALESCE((p_filters->>'include_lines')::boolean, true);     -- ✅ NEW: include lines
  v_txn_type        text    := NULLIF(p_filters->>'transaction_type','');
  v_status          text    := NULLIF(p_filters->>'transaction_status','');
  v_smart_code      text    := NULLIF(p_filters->>'smart_code','');
  v_date_from       timestamptz := (p_filters->>'date_from')::timestamptz; -- inclusive
  v_date_to         timestamptz := (p_filters->>'date_to')::timestamptz;   -- exclusive

  -- pagination
  v_limit  int := GREATEST(COALESCE((p_filters->>'limit')::int, 100), 1);
  v_offset int := GREATEST(COALESCE((p_filters->>'offset')::int, 0), 0);

  v_items jsonb := '[]'::jsonb;
  v_total bigint := 0;

  -- diagnostics
  v_err_detail  text;
  v_err_hint    text;
  v_err_context text;
BEGIN
  /* 1) Count (for UI pagination) */
  WITH base AS (
    SELECT 1
    FROM universal_transactions t
    WHERE t.organization_id = p_org_id
      AND (v_include_deleted OR t.transaction_status <> 'voided')
      AND (v_txn_type   IS NULL OR t.transaction_type  = v_txn_type)
      AND (v_status     IS NULL OR t.transaction_status = v_status)
      AND (v_smart_code IS NULL OR t.smart_code = v_smart_code)
      AND (v_date_from  IS NULL OR t.transaction_date >= v_date_from)
      AND (v_date_to    IS NULL OR t.transaction_date <  v_date_to)
  )
  SELECT COUNT(*)::bigint INTO v_total FROM base;

  /* 2) Page of results with FULL PROJECTION + LINES (if requested) */
  IF v_include_lines THEN
    -- ✅ NEW: Fetch transactions WITH their lines
    WITH page AS (
      SELECT
        t.id,
        t.organization_id,
        t.transaction_type,
        t.transaction_code,
        t.transaction_date,
        t.source_entity_id,
        t.target_entity_id,
        t.total_amount,
        t.transaction_status,
        t.reference_number,
        t.external_reference,
        t.smart_code,
        t.smart_code_status,
        t.ai_confidence,
        t.ai_classification,
        t.ai_insights,
        t.business_context,
        t.metadata,
        t.approval_required,
        t.approved_by,
        t.approved_at,
        t.transaction_currency_code,
        t.base_currency_code,
        t.exchange_rate,
        t.exchange_rate_date,
        t.exchange_rate_type,
        t.fiscal_year,
        t.fiscal_period,
        t.fiscal_period_entity_id,
        t.posting_period_code,
        t.created_at,
        t.updated_at,
        t.created_by,
        t.updated_by,
        t.version
      FROM universal_transactions t
      WHERE t.organization_id = p_org_id
        AND (v_include_deleted OR t.transaction_status <> 'voided')
        AND (v_txn_type   IS NULL OR t.transaction_type  = v_txn_type)
        AND (v_status     IS NULL OR t.transaction_status = v_status)
        AND (v_smart_code IS NULL OR t.smart_code = v_smart_code)
        AND (v_date_from  IS NULL OR t.transaction_date >= v_date_from)
        AND (v_date_to    IS NULL OR t.transaction_date <  v_date_to)
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT v_limit OFFSET v_offset
    ),
    lines_agg AS (
      SELECT
        l.transaction_id,
        jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'line_number', l.line_number,
            'line_type', l.line_type,
            'entity_id', l.entity_id,
            'description', l.description,
            'quantity', l.quantity,
            'unit_amount', l.unit_amount,
            'line_amount', l.line_amount,
            'discount_amount', l.discount_amount,
            'tax_amount', l.tax_amount,
            'smart_code', l.smart_code,
            'line_data', l.line_data,
            'created_at', l.created_at,
            'updated_at', l.updated_at
          ) ORDER BY l.line_number
        ) AS lines
      FROM universal_transaction_lines l
      WHERE l.transaction_id IN (SELECT id FROM page)
        AND l.organization_id = p_org_id
      GROUP BY l.transaction_id
    )
    SELECT COALESCE(
             jsonb_agg(jsonb_build_object(
               'id', p.id,
               'organization_id', p.organization_id,
               'transaction_type', p.transaction_type,
               'transaction_code', p.transaction_code,
               'transaction_date', p.transaction_date,
               'source_entity_id', p.source_entity_id,
               'target_entity_id', p.target_entity_id,
               'total_amount', p.total_amount,
               'transaction_status', p.transaction_status,
               'reference_number', p.reference_number,
               'external_reference', p.external_reference,
               'smart_code', p.smart_code,
               'smart_code_status', p.smart_code_status,
               'ai_confidence', p.ai_confidence,
               'ai_classification', p.ai_classification,
               'ai_insights', p.ai_insights,
               'business_context', p.business_context,
               'metadata', p.metadata,
               'approval_required', p.approval_required,
               'approved_by', p.approved_by,
               'approved_at', p.approved_at,
               'transaction_currency_code', p.transaction_currency_code,
               'base_currency_code', p.base_currency_code,
               'exchange_rate', p.exchange_rate,
               'exchange_rate_date', p.exchange_rate_date,
               'exchange_rate_type', p.exchange_rate_type,
               'fiscal_year', p.fiscal_year,
               'fiscal_period', p.fiscal_period,
               'fiscal_period_entity_id', p.fiscal_period_entity_id,
               'posting_period_code', p.posting_period_code,
               'created_at', p.created_at,
               'updated_at', p.updated_at,
               'created_by', p.created_by,
               'updated_by', p.updated_by,
               'version', p.version,
               'lines', COALESCE(la.lines, '[]'::jsonb)  -- ✅ NEW: Include lines
             )),
             '[]'::jsonb
           )
    INTO v_items
    FROM page p
    LEFT JOIN lines_agg la ON la.transaction_id = p.id;

  ELSE
    -- ✅ ORIGINAL: Fetch transactions WITHOUT lines (faster)
    WITH page AS (
      SELECT
        t.id,
        t.organization_id,
        t.transaction_type,
        t.transaction_code,
        t.transaction_date,
        t.source_entity_id,
        t.target_entity_id,
        t.total_amount,
        t.transaction_status,
        t.reference_number,
        t.external_reference,
        t.smart_code,
        t.smart_code_status,
        t.ai_confidence,
        t.ai_classification,
        t.ai_insights,
        t.business_context,
        t.metadata,
        t.approval_required,
        t.approved_by,
        t.approved_at,
        t.transaction_currency_code,
        t.base_currency_code,
        t.exchange_rate,
        t.exchange_rate_date,
        t.exchange_rate_type,
        t.fiscal_year,
        t.fiscal_period,
        t.fiscal_period_entity_id,
        t.posting_period_code,
        t.created_at,
        t.updated_at,
        t.created_by,
        t.updated_by,
        t.version
      FROM universal_transactions t
      WHERE t.organization_id = p_org_id
        AND (v_include_deleted OR t.transaction_status <> 'voided')
        AND (v_txn_type   IS NULL OR t.transaction_type  = v_txn_type)
        AND (v_status     IS NULL OR t.transaction_status = v_status)
        AND (v_smart_code IS NULL OR t.smart_code = v_smart_code)
        AND (v_date_from  IS NULL OR t.transaction_date >= v_date_from)
        AND (v_date_to    IS NULL OR t.transaction_date <  v_date_to)
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT v_limit OFFSET v_offset
    )
    SELECT COALESCE(
             jsonb_agg(jsonb_build_object(
               'id', p.id,
               'organization_id', p.organization_id,
               'transaction_type', p.transaction_type,
               'transaction_code', p.transaction_code,
               'transaction_date', p.transaction_date,
               'source_entity_id', p.source_entity_id,
               'target_entity_id', p.target_entity_id,
               'total_amount', p.total_amount,
               'transaction_status', p.transaction_status,
               'reference_number', p.reference_number,
               'external_reference', p.external_reference,
               'smart_code', p.smart_code,
               'smart_code_status', p.smart_code_status,
               'ai_confidence', p.ai_confidence,
               'ai_classification', p.ai_classification,
               'ai_insights', p.ai_insights,
               'business_context', p.business_context,
               'metadata', p.metadata,
               'approval_required', p.approval_required,
               'approved_by', p.approved_by,
               'approved_at', p.approved_at,
               'transaction_currency_code', p.transaction_currency_code,
               'base_currency_code', p.base_currency_code,
               'exchange_rate', p.exchange_rate,
               'exchange_rate_date', p.exchange_rate_date,
               'exchange_rate_type', p.exchange_rate_type,
               'fiscal_year', p.fiscal_year,
               'fiscal_period', p.fiscal_period,
               'fiscal_period_entity_id', p.fiscal_period_entity_id,
               'posting_period_code', p.posting_period_code,
               'created_at', p.created_at,
               'updated_at', p.updated_at,
               'created_by', p.created_by,
               'updated_by', p.updated_by,
               'version', p.version
             )),
             '[]'::jsonb
           )
    INTO v_items
    FROM page p;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action',  'QUERY',
    'data', jsonb_build_object(
      'items',  v_items,
      'limit',  v_limit,
      'offset', v_offset,
      'total',  v_total
    )
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS
    v_err_detail  = PG_EXCEPTION_DETAIL,
    v_err_hint    = PG_EXCEPTION_HINT,
    v_err_context = PG_EXCEPTION_CONTEXT;

  RETURN jsonb_build_object(
    'success', false,
    'action', 'QUERY',
    'error',  SQLSTATE || ': ' || SQLERRM,
    'error_detail', NULLIF(v_err_detail,''),
    'error_hint',   NULLIF(v_err_hint,''),
    'error_context', v_err_context
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.hera_txn_query_v1(uuid,jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hera_txn_query_v1(uuid,jsonb) TO authenticated, service_role;

/* ============================================================
   DEPLOYMENT INSTRUCTIONS
   ============================================================

   1. Copy this entire SQL script
   2. Go to Supabase Dashboard → SQL Editor
   3. Paste and run the SQL
   4. Test in the application (/salon/dashboard)
   5. Check browser console for debug logs showing lines data

   ============================================================
   VERIFICATION QUERY
   ============================================================ */

-- Check if function was updated correctly
SELECT
  proname AS function_name,
  prosrc LIKE '%v_include_lines%' AS has_include_lines_variable,
  prosrc LIKE '%LEFT JOIN lines_agg%' AS has_lines_join
FROM pg_proc
WHERE proname = 'hera_txn_query_v1';

-- Expected output:
-- function_name        | has_include_lines_variable | has_lines_join
-- ---------------------|----------------------------|----------------
-- hera_txn_query_v1    | true                       | true

/* ============================================================
   TESTING
   ============================================================

   After deployment:

   1. Go to /salon/dashboard
   2. Open browser console
   3. Look for debug log: "[useSalonDashboard] Service Analytics Debug:"
   4. Check that sampleTransactionWithLines shows:
      - linesCount: > 0 (not 0 anymore!)
      - sampleLines: array with actual line data
   5. Service Analytics should now display service data

   ============================================================ */
