/* ============================================================
   HERA • Transaction Query (v1) — Full Projection
   Signature: hera_txn_query_v1(p_org_id uuid, p_filters jsonb DEFAULT '{}')
   Behavior:
     - Honors filters.include_deleted (means: include status='voided')
     - Supports filters: transaction_type, transaction_status, smart_code, date_from, date_to
     - Pagination: limit (default 100), offset (default 0)
     - Returns full header fields (no lines) for each item
   Response:
     { success, action:'QUERY', data: { items: [...], limit, offset, total } }
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

  /* 2) Page of results with FULL PROJECTION */
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
