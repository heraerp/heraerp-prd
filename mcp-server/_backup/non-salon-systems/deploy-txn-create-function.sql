-- =========================================================
-- Deploy hera_txn_create_v1 to Supabase
-- Copy this entire file and run in Supabase SQL Editor
-- =========================================================

-- Drop old version if exists
DROP FUNCTION IF EXISTS public.hera_txn_create_v1(jsonb, jsonb, uuid);

-- Create transaction with header and lines
CREATE OR REPLACE FUNCTION public.hera_txn_create_v1(
  p_header jsonb,
  p_lines  jsonb,
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org          uuid := (p_header->>'organization_id')::uuid;
  v_txn_id       uuid;
  v_now          timestamptz := now();
  v_total        numeric := 0;
  v_status       text := COALESCE(NULLIF(TRIM(LOWER(p_header->>'transaction_status')),''), 'pending');
  v_hdr_sc_raw   text := NULLIF(p_header->>'smart_code','');
  v_hdr_sc       text;
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

  -- Generate transaction ID
  v_txn_id := gen_random_uuid();

  -- Insert header (total will be set after lines)
  INSERT INTO universal_transactions(
    id,
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    source_entity_id,
    target_entity_id,
    total_amount,
    transaction_status,
    reference_number,
    external_reference,
    smart_code,
    smart_code_status,
    ai_confidence,
    ai_classification,
    ai_insights,
    business_context,
    metadata,
    approval_required,
    approved_by,
    approved_at,
    transaction_currency_code,
    base_currency_code,
    exchange_rate,
    fiscal_year,
    fiscal_period,
    created_at,
    updated_at,
    created_by,
    updated_by,
    version
  ) VALUES (
    v_txn_id,
    v_org,
    NULLIF(p_header->>'transaction_type',''),
    NULLIF(p_header->>'transaction_code',''),
    COALESCE(NULLIF(p_header->>'transaction_date','')::timestamptz, v_now),
    NULLIF(p_header->>'source_entity_id','')::uuid,
    NULLIF(p_header->>'target_entity_id','')::uuid,
    0,  -- Will update after inserting lines
    v_status,
    NULLIF(p_header->>'reference_number',''),
    NULLIF(p_header->>'external_reference',''),
    v_hdr_sc,
    'DRAFT',
    0,
    NULL,
    '{}'::jsonb,
    COALESCE(p_header->'business_context','{}'::jsonb),
    COALESCE(p_header->'metadata','{}'::jsonb),
    COALESCE(NULLIF(p_header->>'approval_required','')::boolean, false),
    NULLIF(p_header->>'approved_by','')::uuid,
    NULLIF(p_header->>'approved_at','')::timestamptz,
    COALESCE(NULLIF(p_header->>'transaction_currency_code',''), 'AED'),
    COALESCE(NULLIF(p_header->>'base_currency_code',''), 'AED'),
    COALESCE(NULLIF(p_header->>'exchange_rate','')::numeric, 1.0),
    COALESCE(NULLIF(p_header->>'fiscal_year','')::int, EXTRACT(YEAR FROM v_now)::int),
    COALESCE(NULLIF(p_header->>'fiscal_period','')::int, EXTRACT(MONTH FROM v_now)::int),
    v_now,
    v_now,
    p_actor_user_id,
    p_actor_user_id,
    1
  );

  -- Insert lines and calculate total
  WITH src AS (
    SELECT
      COALESCE(NULLIF(x.elem->>'line_number','')::int, ROW_NUMBER() OVER (ORDER BY x.ord)) AS line_number,
      NULLIF(x.elem->>'entity_id','')::uuid AS entity_id,
      COALESCE(NULLIF(x.elem->>'line_type',''),'generic') AS line_type,
      NULLIF(x.elem->>'description','') AS description,
      COALESCE(NULLIF(x.elem->>'quantity','')::numeric, 1) AS quantity,
      COALESCE(NULLIF(x.elem->>'unit_amount','')::numeric, 0) AS unit_amount,
      COALESCE(
        NULLIF(x.elem->>'line_amount','')::numeric,
        COALESCE(NULLIF(x.elem->>'quantity','')::numeric,1) * COALESCE(NULLIF(x.elem->>'unit_amount','')::numeric,0)
      ) AS line_amount,
      COALESCE(NULLIF(x.elem->>'discount_amount','')::numeric, 0) AS discount_amount,
      COALESCE(NULLIF(x.elem->>'tax_amount','')::numeric, 0) AS tax_amount,
      NULLIF(x.elem->>'smart_code','') AS line_sc_raw,
      COALESCE(x.elem, '{}'::jsonb) AS line_data
    FROM jsonb_array_elements(p_lines) WITH ORDINALITY AS x(elem, ord)
  ),
  normalized AS (
    SELECT
      line_number,
      entity_id,
      line_type,
      description,
      quantity,
      unit_amount,
      line_amount,
      discount_amount,
      tax_amount,
      line_data,
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
  ),
  ins AS (
    INSERT INTO universal_transaction_lines(
      id,
      organization_id,
      transaction_id,
      line_number,
      entity_id,
      line_type,
      description,
      quantity,
      unit_amount,
      line_amount,
      discount_amount,
      tax_amount,
      smart_code,
      smart_code_status,
      ai_confidence,
      ai_classification,
      ai_insights,
      line_data,
      created_at,
      updated_at,
      created_by,
      updated_by,
      version
    )
    SELECT
      gen_random_uuid(),
      v_org,
      v_txn_id,
      n.line_number,
      n.entity_id,
      n.line_type,
      n.description,
      n.quantity,
      n.unit_amount,
      n.line_amount,
      n.discount_amount,
      n.tax_amount,
      n.line_sc,
      'DRAFT',
      0,
      NULL,
      '{}'::jsonb,
      n.line_data,
      v_now,
      v_now,
      p_actor_user_id,
      p_actor_user_id,
      1
    FROM normalized n
    RETURNING line_amount, discount_amount, tax_amount
  )
  SELECT COALESCE(SUM(line_amount - discount_amount + tax_amount), 0)
  INTO v_total
  FROM ins;

  -- Update header with calculated total
  UPDATE universal_transactions
  SET total_amount = ROUND(COALESCE(v_total, 0)::numeric, 2),
      updated_at = v_now
  WHERE id = v_txn_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_txn_id);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.hera_txn_create_v1(jsonb, jsonb, uuid) TO authenticated, service_role;

-- Verify deployment
SELECT 'Function deployed successfully!' as status;
