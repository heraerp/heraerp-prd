-- =========================================================
-- FIX: hera_txn_create_v1 - Exclude payment/commission from total
-- Issue: Payment lines were being included in total_amount calculation
--        causing totals to be 2x the actual customer-facing amount
-- =========================================================
BEGIN;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.hera_txn_create_v1(jsonb, jsonb, uuid);

-- Re-create with corrected total calculation
CREATE OR REPLACE FUNCTION public.hera_txn_create_v1(
  p_header jsonb,
  p_lines  jsonb,
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_org          uuid := (p_header->>'organization_id')::uuid;
  v_txn_id       uuid;
  v_now          timestamptz := now();
  v_total        numeric := 0;

  -- status normalization (default 'pending')
  v_status       text := COALESCE(NULLIF(TRIM(LOWER(p_header->>'transaction_status')),''), 'pending');

  -- smart-code handling
  v_hdr_sc_raw   text := NULLIF(p_header->>'smart_code','');
  v_hdr_sc       text;  -- normalized header smart code ('.Vn' -> '.vN')
  v_sc_regex     constant text := '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';
BEGIN
  -- Validate inputs
  IF p_header IS NULL OR jsonb_typeof(p_header) <> 'object' THEN
    RAISE EXCEPTION 'hera_txn_create_v1: p_header must be an object';
  END IF;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'hera_txn_create_v1: header.organization_id is required';
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN
    RAISE EXCEPTION 'hera_txn_create_v1: p_lines must be an array';
  END IF;

  -- Normalize header smart_code (allow uppercase .Vn -> .vN)
  IF v_hdr_sc_raw IS NOT NULL THEN
    v_hdr_sc := REGEXP_REPLACE(v_hdr_sc_raw, '\.V([0-9]+)$', '.v\1');
  END IF;

  -- Insert header (total set later)
  INSERT INTO universal_transactions(
    organization_id, transaction_type, transaction_code, transaction_date,
    source_entity_id, target_entity_id, total_amount, transaction_status,
    reference_number, external_reference, smart_code, smart_code_status,
    ai_confidence, ai_classification, ai_insights,
    business_context, metadata,
    approval_required, approved_by, approved_at,
    transaction_currency_code, base_currency_code, exchange_rate,
    fiscal_year, fiscal_period,
    created_at, updated_at, created_by, updated_by, version
  ) VALUES (
    v_org,
    NULLIF(p_header->>'transaction_type',''),
    NULLIF(p_header->>'transaction_code',''),
    COALESCE(NULLIF(p_header->>'transaction_date','')::timestamptz, v_now),
    NULLIF(p_header->>'source_entity_id','')::uuid,
    NULLIF(p_header->>'target_entity_id','')::uuid,
    0,                                        -- will set after calculating from lines
    v_status,                                 -- ✅ normalized status
    NULLIF(p_header->>'reference_number',''),
    NULLIF(p_header->>'external_reference',''),
    v_hdr_sc,                                 -- normalized header smart_code (or NULL)
    'DRAFT',
    0, NULL, '{}'::jsonb,
    COALESCE(p_header->'business_context','{}'::jsonb),
    COALESCE(p_header->'metadata','{}'::jsonb),
    COALESCE(NULLIF(p_header->>'approval_required','')::boolean, false),
    NULLIF(p_header->>'approved_by','')::uuid,
    NULLIF(p_header->>'approved_at','')::timestamptz,
    NULLIF(p_header->>'transaction_currency_code',''),
    NULLIF(p_header->>'base_currency_code',''),
    NULLIF(p_header->>'exchange_rate','')::numeric,
    NULLIF(p_header->>'fiscal_year','')::int,
    NULLIF(p_header->>'fiscal_period','')::int,
    v_now, v_now, p_actor_user_id, p_actor_user_id, 1
  )
  RETURNING id INTO v_txn_id;

  -- Parse and normalize line data
  WITH src AS (
    SELECT
      COALESCE(NULLIF(x.elem->>'line_number','')::int, ROW_NUMBER() OVER (ORDER BY x.ord)) AS line_number,
      NULLIF(x.elem->>'entity_id','')::uuid                                             AS entity_id,
      COALESCE(NULLIF(x.elem->>'line_type',''),'generic')                                AS line_type,
      NULLIF(x.elem->>'description','')                                                 AS description,
      COALESCE(NULLIF(x.elem->>'quantity','')::numeric, 1)                               AS quantity,
      COALESCE(NULLIF(x.elem->>'unit_amount','')::numeric, 0)                            AS unit_amount,
      COALESCE(NULLIF(x.elem->>'line_amount','')::numeric,
               COALESCE(NULLIF(x.elem->>'quantity','')::numeric,1)
               * COALESCE(NULLIF(x.elem->>'unit_amount','')::numeric,0))                 AS line_amount,
      COALESCE(NULLIF(x.elem->>'discount_amount','')::numeric, 0)                        AS discount_amount,
      COALESCE(NULLIF(x.elem->>'tax_amount','')::numeric, 0)                             AS tax_amount,
      NULLIF(x.elem->>'smart_code','')                                                  AS line_sc_raw,
      COALESCE(x.elem, '{}'::jsonb)                                                     AS line_data
    FROM jsonb_array_elements(p_lines) WITH ORDINALITY AS x(elem, ord)
  ),
  normalized AS (
    SELECT
      line_number, entity_id, line_type, description, quantity, unit_amount,
      line_amount, discount_amount, tax_amount, line_data,
      CASE
        WHEN line_sc_raw ~ v_sc_regex THEN line_sc_raw
        ELSE
          CASE
            WHEN v_hdr_sc IS NOT NULL THEN
              REGEXP_REPLACE(v_hdr_sc, '\.v[0-9]+$', '.LINE.GENERIC.v1')
            ELSE
              'HERA.GENERIC.LINE.ITEM.v1'
          END
      END AS line_sc
    FROM src
  )
  -- ✅ FIX: Calculate total BEFORE inserting, excluding payment and commission lines
  SELECT COALESCE(SUM(line_amount - discount_amount + tax_amount), 0)
  INTO v_total
  FROM normalized
  WHERE line_type NOT IN ('payment', 'commission');  -- ← Exclude payment/commission from total

  -- Insert all lines (including payment lines for audit trail)
  INSERT INTO universal_transaction_lines(
    organization_id, transaction_id, line_number, entity_id, line_type,
    description, quantity, unit_amount, line_amount,
    discount_amount, tax_amount,
    smart_code, smart_code_status, ai_confidence, ai_classification, ai_insights,
    line_data, created_at, updated_at, created_by, updated_by, version
  )
  SELECT
    v_org, v_txn_id,
    n.line_number, n.entity_id, n.line_type,
    n.description, n.quantity, n.unit_amount, n.line_amount,
    n.discount_amount, n.tax_amount,
    n.line_sc, 'DRAFT', 0, NULL, '{}'::jsonb,
    n.line_data, v_now, v_now, p_actor_user_id, p_actor_user_id, 1
  FROM normalized n;

  -- Update header with calculated total
  UPDATE universal_transactions
     SET total_amount = ROUND(COALESCE(v_total, 0)::numeric, 2),
         updated_at   = v_now
   WHERE id = v_txn_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_txn_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.hera_txn_create_v1(jsonb, jsonb, uuid) TO anon, authenticated, service_role;

COMMIT;

-- =========================================================
-- EXPLANATION OF FIX
-- =========================================================
-- BEFORE: Summed ALL lines including payments
--   Service: 450.00 + Tax: 22.50 + Payment: 472.50 = 945.00 ❌
--
-- AFTER: Sums only customer-facing lines (excludes payment/commission)
--   Service: 450.00 + Tax: 22.50 = 472.50 ✅
--
-- Payment lines are still inserted for audit trail, but not included in total
-- Commission lines are still inserted for tracking, but not included in total
-- =========================================================
