-- ========================================
-- HERA Transaction Query v1
-- ========================================
-- Function: public.hera_txn_query_v1(uuid, jsonb)
-- Purpose: High-performance transaction querying with flexible filtering
-- Status: ✅ Production Deployed
-- Created: 2025-01-12
-- Version: 1.0 (Backward Compatible)
-- ========================================

-- FEATURES:
-- ✅ 9 filter parameters (type, status, smart_code, entities, dates, etc.)
-- ✅ Optional line loading (include_lines flag)
-- ✅ Backward compatible (default include_lines: true)
-- ✅ Safe UUID parsing (invalid UUIDs gracefully ignored)
-- ✅ Multi-tenant isolation (organization boundary enforced)
-- ✅ Enhanced error handling (stacked diagnostics)
-- ✅ Optimized performance (composite indexes, single JOIN)

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
  v_include_deleted boolean := COALESCE((p_filters->>'include_deleted')::boolean, false);  -- include voided?
  v_include_lines   boolean := COALESCE((p_filters->>'include_lines')::boolean, true);     -- default TRUE (old behavior)

  v_txn_type        text    := NULLIF(p_filters->>'transaction_type','');
  v_status          text    := NULLIF(p_filters->>'transaction_status','');
  v_smart_code      text    := NULLIF(p_filters->>'smart_code','');

  -- extra entity filters (do not change response shape)
  v_source_entity_id uuid;
  v_target_entity_id uuid;

  v_date_from       timestamptz := (p_filters->>'date_from')::timestamptz; -- inclusive
  v_date_to         timestamptz := (p_filters->>'date_to')::timestamptz;   -- exclusive

  -- pagination (same outward contract)
  v_limit  int := GREATEST(COALESCE((p_filters->>'limit')::int, 100), 1);
  v_offset int := GREATEST(COALESCE((p_filters->>'offset')::int, 0), 0);

  v_items jsonb := '[]'::jsonb;
  v_total bigint := 0;

  -- diagnostics
  v_err_detail  text;
  v_err_hint    text;
  v_err_context text;
BEGIN
  -- Safe UUID parsing (ignore invalids)
  BEGIN v_source_entity_id := (p_filters->>'source_entity_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN v_source_entity_id := NULL; END;
  BEGIN v_target_entity_id := (p_filters->>'target_entity_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN v_target_entity_id := NULL; END;

  /* 1) Count (unchanged contract) */
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
      AND (v_date_to          IS NULL OR t.transaction_date   <  v_date_to) -- exclusive upper bound (same semantics)
  )
  SELECT COUNT(*)::bigint INTO v_total FROM base;

  /* 2) Page (headers) + lines when requested; response shape identical to old */
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
               -- EXACT same "lines" key as old function
               'lines', COALESCE(la.lines, '[]'::jsonb)
             )),
             '[]'::jsonb
           )
    INTO v_items
    FROM page p
    LEFT JOIN lines_agg la ON la.transaction_id = p.id;

  ELSE
    -- No lines (exactly like the old "fast path")
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

-- Security: Grant execute to authenticated users and service role
REVOKE ALL ON FUNCTION public.hera_txn_query_v1(uuid,jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hera_txn_query_v1(uuid,jsonb) TO authenticated, service_role;

-- ========================================
-- DEPLOYMENT NOTES
-- ========================================
-- 1. Deploy to Supabase:
--    psql $DATABASE_URL -f database/functions/hera_txn_query_v1.sql
--
-- 2. Verify deployment:
--    psql $DATABASE_URL -c "\df hera_txn_query_v1"
--
-- 3. Run test suite:
--    bash database/tests/run-txn-query-test.sh <org-uuid>
--
-- 4. Performance validation:
--    EXPLAIN ANALYZE SELECT hera_txn_query_v1('org-uuid', '{"limit": 100}');
--
-- ========================================
-- REQUIRED INDEXES (MUST exist for performance)
-- ========================================
-- CREATE INDEX IF NOT EXISTS idx_ut_org_txn_date
--   ON universal_transactions (organization_id, transaction_date DESC);
--
-- CREATE INDEX IF NOT EXISTS idx_ut_org_status
--   ON universal_transactions (organization_id, transaction_status)
--   WHERE transaction_status <> 'voided';
--
-- CREATE INDEX IF NOT EXISTS idx_ut_org_smart_code
--   ON universal_transactions (organization_id, smart_code);
--
-- CREATE INDEX IF NOT EXISTS idx_ut_org_source
--   ON universal_transactions (organization_id, source_entity_id);
--
-- CREATE INDEX IF NOT EXISTS idx_ut_org_target
--   ON universal_transactions (organization_id, target_entity_id);
--
-- CREATE INDEX IF NOT EXISTS idx_utl_org_txn_line
--   ON universal_transaction_lines (organization_id, transaction_id, line_number);
-- ========================================
