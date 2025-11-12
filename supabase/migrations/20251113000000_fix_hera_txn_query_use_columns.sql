-- ========================================
-- Fix: hera_txn_query_v1 - Use Actual Table Columns
-- ========================================
-- Issue: RPC was extracting entity_id, description, etc. from line_data JSON
-- Fix: Use actual table columns (entity_id, description, quantity, unit_amount, line_amount)
-- Impact: Customer transaction history will now show actual service names
-- Created: 2025-11-13
-- ========================================

-- Replace the function with corrected column references
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
  -- flags & filters (match old response; include_lines default TRUE like old fn)
  v_include_deleted boolean := COALESCE((p_filters->>'include_deleted')::boolean, false);
  v_include_lines   boolean := COALESCE((p_filters->>'include_lines')::boolean, true);

  v_txn_type        text    := NULLIF(p_filters->>'transaction_type','');
  v_status          text    := NULLIF(p_filters->>'transaction_status','');
  v_smart_code      text    := NULLIF(p_filters->>'smart_code','');

  v_source_entity_id uuid;
  v_target_entity_id uuid;

  v_date_from       timestamptz := (p_filters->>'date_from')::timestamptz;
  v_date_to         timestamptz := (p_filters->>'date_to')::timestamptz;

  v_limit  int := GREATEST(COALESCE((p_filters->>'limit')::int, 100), 1);
  v_offset int := GREATEST(COALESCE((p_filters->>'offset')::int, 0), 0);

  v_items jsonb := '[]'::jsonb;
  v_total bigint := 0;

  v_err_detail  text;
  v_err_hint    text;
  v_err_context text;
BEGIN
  -- Safe UUID parsing
  BEGIN v_source_entity_id := (p_filters->>'source_entity_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN v_source_entity_id := NULL; END;
  BEGIN v_target_entity_id := (p_filters->>'target_entity_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN v_target_entity_id := NULL; END;

  /* 1) Count */
  WITH base AS (
    SELECT 1
    FROM universal_transactions t
    WHERE t.organization_id = p_org_id
      AND (v_include_deleted OR t.transaction_status <> 'voided')
      AND (v_txn_type         IS NULL OR t.transaction_type   = v_txn_type)
      AND (v_status           IS NULL OR t.transaction_status = v_status)
      AND (v_smart_code       IS NULL OR t.smart_code         = v_smart_code)
      AND (v_source_entity_id IS NULL OR t.source_entity_id   = v_source_entity_id)
      AND (v_target_entity_id IS NULL OR t.target_entity_id   = v_target_entity_id)
      AND (v_date_from        IS NULL OR t.transaction_date   >= v_date_from)
      AND (v_date_to          IS NULL OR t.transaction_date   <  v_date_to)
  )
  SELECT COUNT(*)::bigint INTO v_total FROM base;

  /* 2) Page (headers) + lines */
  IF v_include_lines THEN
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
        AND (v_txn_type         IS NULL OR t.transaction_type   = v_txn_type)
        AND (v_status           IS NULL OR t.transaction_status = v_status)
        AND (v_smart_code       IS NULL OR t.smart_code         = v_smart_code)
        AND (v_source_entity_id IS NULL OR t.source_entity_id   = v_source_entity_id)
        AND (v_target_entity_id IS NULL OR t.target_entity_id   = v_target_entity_id)
        AND (v_date_from        IS NULL OR t.transaction_date   >= v_date_from)
        AND (v_date_to          IS NULL OR t.transaction_date   <  v_date_to)
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT v_limit OFFSET v_offset
    ),
    lines_agg AS (
      SELECT
        l.transaction_id,
        jsonb_agg(
          jsonb_build_object(
            -- ✅ FIXED: Use actual table columns, not line_data JSON
            'id',              l.id,
            'line_number',     l.line_number,
            'line_type',       l.line_type,
            'entity_id',       l.entity_id,                    -- ✅ Use column directly
            'description',     l.description,                  -- ✅ Use column directly
            'quantity',        l.quantity,                     -- ✅ Use column directly
            'unit_amount',     l.unit_amount,                  -- ✅ Use column directly
            'line_amount',     l.line_amount,                  -- ✅ Use column directly
            'discount_amount', l.discount_amount,              -- ✅ Use column directly
            'tax_amount',      l.tax_amount,                   -- ✅ Use column directly
            'smart_code',      l.smart_code,
            'line_data',       COALESCE(l.line_data, '{}'::jsonb),
            'created_at',      l.created_at,
            'updated_at',      l.updated_at
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
               'lines', COALESCE(la.lines, '[]'::jsonb)
             ) ORDER BY p.transaction_date DESC, p.id DESC),
             '[]'::jsonb
           ) INTO v_items
    FROM page p
    LEFT JOIN lines_agg la ON la.transaction_id = p.id;
  ELSE
    -- Without lines (headers only)
    SELECT COALESCE(
             jsonb_agg(jsonb_build_object(
               'id', t.id,
               'organization_id', t.organization_id,
               'transaction_type', t.transaction_type,
               'transaction_code', t.transaction_code,
               'transaction_date', t.transaction_date,
               'source_entity_id', t.source_entity_id,
               'target_entity_id', t.target_entity_id,
               'total_amount', t.total_amount,
               'transaction_status', t.transaction_status,
               'reference_number', t.reference_number,
               'external_reference', t.external_reference,
               'smart_code', t.smart_code,
               'smart_code_status', t.smart_code_status,
               'ai_confidence', t.ai_confidence,
               'ai_classification', t.ai_classification,
               'ai_insights', t.ai_insights,
               'business_context', t.business_context,
               'metadata', t.metadata,
               'approval_required', t.approval_required,
               'approved_by', t.approved_by,
               'approved_at', t.approved_at,
               'transaction_currency_code', t.transaction_currency_code,
               'base_currency_code', t.base_currency_code,
               'exchange_rate', t.exchange_rate,
               'exchange_rate_date', t.exchange_rate_date,
               'exchange_rate_type', t.exchange_rate_type,
               'fiscal_year', t.fiscal_year,
               'fiscal_period', t.fiscal_period,
               'fiscal_period_entity_id', t.fiscal_period_entity_id,
               'posting_period_code', t.posting_period_code,
               'created_at', t.created_at,
               'updated_at', t.updated_at,
               'created_by', t.created_by,
               'updated_by', t.updated_by,
               'version', t.version
             ) ORDER BY t.transaction_date DESC, t.id DESC),
             '[]'::jsonb
           ) INTO v_items
    FROM universal_transactions t
    WHERE t.organization_id = p_org_id
      AND (v_include_deleted OR t.transaction_status <> 'voided')
      AND (v_txn_type         IS NULL OR t.transaction_type   = v_txn_type)
      AND (v_status           IS NULL OR t.transaction_status = v_status)
      AND (v_smart_code       IS NULL OR t.smart_code         = v_smart_code)
      AND (v_source_entity_id IS NULL OR t.source_entity_id   = v_source_entity_id)
      AND (v_target_entity_id IS NULL OR t.target_entity_id   = v_target_entity_id)
      AND (v_date_from        IS NULL OR t.transaction_date   >= v_date_from)
      AND (v_date_to          IS NULL OR t.transaction_date   <  v_date_to)
    ORDER BY t.transaction_date DESC, t.id DESC
    LIMIT v_limit OFFSET v_offset;
  END IF;

  RETURN jsonb_build_object(
    'items', v_items,
    'total', v_total,
    'limit', v_limit,
    'offset', v_offset
  );

EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS
      v_err_detail  = PG_EXCEPTION_DETAIL,
      v_err_hint    = PG_EXCEPTION_HINT,
      v_err_context = PG_EXCEPTION_CONTEXT;
    RETURN jsonb_build_object(
      'items', '[]'::jsonb,
      'total', 0,
      'limit', v_limit,
      'offset', v_offset,
      'error', jsonb_build_object(
        'message', SQLERRM,
        'code', SQLSTATE,
        'detail', v_err_detail,
        'hint', v_err_hint,
        'context', v_err_context
      )
    );
END;
$fn$;

-- Add comment
COMMENT ON FUNCTION public.hera_txn_query_v1 IS
'Transaction query v1 - FIXED to use actual table columns (entity_id, description, etc.) instead of line_data JSON';
