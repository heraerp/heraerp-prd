-- HERA V2 API - Transaction CRUD Functions
-- Event-sourced CRUD: Create (txn-emit exists) + Read + Query + Reverse
-- Sacred Six tables only - no schema changes

-- ================================================
-- UTILITY FUNCTIONS
-- ================================================

-- Validate smart code format (UPPERCASE, 6+ segments, .V#)
CREATE OR REPLACE FUNCTION hera_validate_smart_code(p_code text)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT p_code ~ '^HERA\.[A-Z0-9]+(\.[A-Z0-9]+){4,}\.V[0-9]+$';
$$;

-- Assert a transaction belongs to organization (security)
CREATE OR REPLACE FUNCTION hera_assert_txn_org(p_org_id uuid, p_transaction_id uuid)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT organization_id INTO v_org_id
    FROM universal_transactions
    WHERE id = p_transaction_id;

    IF v_org_id IS NULL OR v_org_id <> p_org_id THEN
        RAISE EXCEPTION 'ORG_MISMATCH: transaction % not in organization %', p_transaction_id, p_org_id
        USING ERRCODE = 'P0001';
    END IF;
END;
$$;

-- ================================================
-- 1) READ (header + lines as JSON)
-- ================================================
CREATE OR REPLACE FUNCTION hera_txn_read_v1(
    p_org_id UUID,
    p_transaction_id UUID,
    p_include_lines BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_header JSONB;
    v_lines JSONB;
BEGIN
    -- Security check: ensure transaction belongs to organization
    PERFORM hera_assert_txn_org(p_org_id, p_transaction_id);

    -- Get transaction header
    SELECT jsonb_build_object(
        'id', t.id,
        'organization_id', t.organization_id,
        'transaction_type', t.transaction_type,
        'transaction_code', t.transaction_code,
        'transaction_date', t.transaction_date,
        'source_entity_id', t.source_entity_id,
        'target_entity_id', t.target_entity_id,
        'total_amount', t.total_amount,
        'currency', t.currency,
        'smart_code', t.smart_code,
        'reference', t.reference,
        'description', t.description,
        'status', t.status,
        'business_context', t.business_context,
        'metadata', t.metadata,
        'ai_confidence', t.ai_confidence,
        'ai_insights', t.ai_insights,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'version', t.version
    ) INTO v_header
    FROM universal_transactions t
    WHERE t.id = p_transaction_id
      AND t.organization_id = p_org_id;

    IF v_header IS NULL THEN
        RAISE EXCEPTION 'TXN_NOT_FOUND: Transaction % not found', p_transaction_id;
    END IF;

    -- Get transaction lines if requested
    IF p_include_lines THEN
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', l.id,
                    'line_number', l.line_number,
                    'line_type', l.line_type,
                    'line_entity_id', l.line_entity_id,
                    'quantity', l.quantity,
                    'unit_price', l.unit_price,
                    'line_amount', l.line_amount,
                    'discount_amount', l.discount_amount,
                    'tax_amount', l.tax_amount,
                    'total_amount', l.total_amount,
                    'currency', l.currency,
                    'dr_cr', l.dr_cr,
                    'smart_code', l.smart_code,
                    'description', l.description,
                    'status', l.status,
                    'metadata', l.metadata,
                    'ai_confidence', l.ai_confidence,
                    'created_at', l.created_at,
                    'updated_at', l.updated_at,
                    'version', l.version
                ) ORDER BY l.line_number
            ),
            '[]'::jsonb
        ) INTO v_lines
        FROM universal_transaction_lines l
        WHERE l.organization_id = p_org_id
          AND l.transaction_id = p_transaction_id
        ORDER BY l.line_number;

        v_header := v_header || jsonb_build_object('lines', v_lines);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_header
    );
END;
$$;

-- ================================================
-- 2) QUERY (headers with optional filters)
-- ================================================
CREATE OR REPLACE FUNCTION hera_txn_query_v1(
    p_org_id UUID,
    p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_source_entity_id UUID := (p_filters->>'source_entity_id')::UUID;
    v_target_entity_id UUID := (p_filters->>'target_entity_id')::UUID;
    v_transaction_type TEXT := NULLIF(p_filters->>'transaction_type', '');
    v_smart_code_like TEXT := NULLIF(p_filters->>'smart_code_like', '');
    v_date_from TIMESTAMPTZ := (p_filters->>'date_from')::TIMESTAMPTZ;
    v_date_to TIMESTAMPTZ := (p_filters->>'date_to')::TIMESTAMPTZ;
    v_limit INTEGER := GREATEST(COALESCE((p_filters->>'limit')::INTEGER, 100), 1);
    v_offset INTEGER := GREATEST(COALESCE((p_filters->>'offset')::INTEGER, 0), 0);
    v_results JSONB;
    v_total INTEGER;
BEGIN
    -- Build query with filters
    WITH filtered_transactions AS (
        SELECT t.*
        FROM universal_transactions t
        WHERE t.organization_id = p_org_id
          AND (v_source_entity_id IS NULL OR t.source_entity_id = v_source_entity_id)
          AND (v_target_entity_id IS NULL OR t.target_entity_id = v_target_entity_id)
          AND (v_transaction_type IS NULL OR t.transaction_type = v_transaction_type)
          AND (v_smart_code_like IS NULL OR t.smart_code ILIKE '%' || v_smart_code_like || '%')
          AND (v_date_from IS NULL OR t.transaction_date >= v_date_from)
          AND (v_date_to IS NULL OR t.transaction_date < v_date_to)
    ),
    paginated AS (
        SELECT * FROM filtered_transactions
        ORDER BY transaction_date DESC, created_at DESC
        LIMIT v_limit
        OFFSET v_offset
    )
    SELECT
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'organization_id', p.organization_id,
                'transaction_type', p.transaction_type,
                'transaction_code', p.transaction_code,
                'transaction_date', p.transaction_date,
                'source_entity_id', p.source_entity_id,
                'target_entity_id', p.target_entity_id,
                'total_amount', p.total_amount,
                'currency', p.currency,
                'smart_code', p.smart_code,
                'reference', p.reference,
                'description', p.description,
                'status', p.status,
                'business_context', p.business_context,
                'metadata', p.metadata,
                'ai_confidence', p.ai_confidence,
                'ai_insights', p.ai_insights,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'version', p.version
            )
        ),
        (SELECT COUNT(*) FROM filtered_transactions)
    INTO v_results, v_total
    FROM paginated p;

    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_results, '[]'::jsonb),
        'total', COALESCE(v_total, 0),
        'limit', v_limit,
        'offset', v_offset
    );
END;
$$;

-- ================================================
-- 3) REVERSAL (immutability: create reversing transaction)
-- ================================================
CREATE OR REPLACE FUNCTION hera_txn_reverse_v1(
    p_org_id UUID,
    p_original_txn_id UUID,
    p_reason TEXT,
    p_reversal_smart_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reversal_id UUID := gen_random_uuid();
    v_original_header RECORD;
    v_lines_count INTEGER;
BEGIN
    -- Validate inputs
    PERFORM hera_assert_txn_org(p_org_id, p_original_txn_id);

    IF NOT hera_validate_smart_code(p_reversal_smart_code) THEN
        RAISE EXCEPTION 'INVALID_SMART_CODE: %', p_reversal_smart_code
        USING ERRCODE = 'P0001';
    END IF;

    IF LENGTH(TRIM(p_reason)) < 1 THEN
        RAISE EXCEPTION 'REVERSAL_REASON_REQUIRED'
        USING ERRCODE = 'P0001';
    END IF;

    -- Get original transaction
    SELECT * INTO v_original_header
    FROM universal_transactions
    WHERE id = p_original_txn_id
      AND organization_id = p_org_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TXN_NOT_FOUND: Original transaction % not found', p_original_txn_id;
    END IF;

    -- Create reversing header (preserves immutability)
    INSERT INTO universal_transactions (
        id,
        organization_id,
        transaction_type,
        transaction_code,
        transaction_date,
        source_entity_id,
        target_entity_id,
        total_amount,
        currency,
        smart_code,
        reference,
        description,
        status,
        business_context,
        metadata,
        ai_confidence,
        created_at,
        updated_at,
        version
    ) VALUES (
        v_reversal_id,
        p_org_id,
        v_original_header.transaction_type,
        COALESCE(v_original_header.transaction_code, '') || '-REV',
        CURRENT_TIMESTAMP,
        v_original_header.source_entity_id,
        v_original_header.target_entity_id,
        CASE WHEN v_original_header.total_amount IS NOT NULL
             THEN -v_original_header.total_amount
             ELSE NULL END,
        v_original_header.currency,
        p_reversal_smart_code,
        COALESCE(v_original_header.reference, '') || ' (REVERSAL)',
        'REVERSAL: ' || p_reason,
        'REVERSAL',
        COALESCE(v_original_header.business_context, '{}'::jsonb),
        COALESCE(v_original_header.metadata, '{}'::jsonb) ||
        jsonb_build_object(
            'reversal_of', p_original_txn_id::text,
            'reversal_reason', p_reason,
            'reversal_date', CURRENT_TIMESTAMP::text
        ),
        v_original_header.ai_confidence,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        1
    );

    -- Create reversing lines (negate amounts, flip DR/CR)
    INSERT INTO universal_transaction_lines (
        id,
        organization_id,
        transaction_id,
        line_number,
        line_type,
        line_entity_id,
        quantity,
        unit_price,
        line_amount,
        discount_amount,
        tax_amount,
        total_amount,
        currency,
        dr_cr,
        smart_code,
        description,
        status,
        metadata,
        ai_confidence,
        created_at,
        updated_at,
        version
    )
    SELECT
        gen_random_uuid(),
        p_org_id,
        v_reversal_id,
        l.line_number,
        l.line_type,
        l.line_entity_id,
        -- Negate quantities
        CASE WHEN l.quantity IS NOT NULL THEN -l.quantity ELSE NULL END,
        l.unit_price, -- Keep unit price same
        -- Negate amounts
        CASE WHEN l.line_amount IS NOT NULL THEN -l.line_amount ELSE NULL END,
        CASE WHEN l.discount_amount IS NOT NULL THEN -l.discount_amount ELSE NULL END,
        CASE WHEN l.tax_amount IS NOT NULL THEN -l.tax_amount ELSE NULL END,
        CASE WHEN l.total_amount IS NOT NULL THEN -l.total_amount ELSE NULL END,
        l.currency,
        -- Flip DR/CR for financial lines
        CASE
            WHEN l.dr_cr IS NULL THEN NULL
            WHEN UPPER(l.dr_cr) = 'DR' THEN 'CR'
            WHEN UPPER(l.dr_cr) = 'CR' THEN 'DR'
            ELSE l.dr_cr
        END,
        l.smart_code,
        'REVERSAL: ' || COALESCE(l.description, ''),
        'REVERSAL',
        COALESCE(l.metadata, '{}'::jsonb) ||
        jsonb_build_object(
            'reversal_of', l.id::text,
            'original_line_number', l.line_number
        ),
        l.ai_confidence,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        1
    FROM universal_transaction_lines l
    WHERE l.organization_id = p_org_id
      AND l.transaction_id = p_original_txn_id
    ORDER BY l.line_number;

    -- Get count of lines created
    GET DIAGNOSTICS v_lines_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'reversal_transaction_id', v_reversal_id,
            'original_transaction_id', p_original_txn_id,
            'lines_reversed', v_lines_count,
            'reversal_reason', p_reason
        )
    );
END;
$$;

-- ================================================
-- OPTIONAL: Transaction validator function
-- ================================================
CREATE OR REPLACE FUNCTION hera_txn_validate_v1(
    p_org_id UUID,
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_errors TEXT[] := '{}';
    v_warnings TEXT[] := '{}';
    v_line_count INTEGER;
    v_duplicate_lines INTEGER;
    v_financial_imbalance NUMERIC;
BEGIN
    -- Check if transaction exists
    PERFORM hera_assert_txn_org(p_org_id, p_transaction_id);

    -- Check for duplicate line numbers
    SELECT COUNT(*) - COUNT(DISTINCT line_number) INTO v_duplicate_lines
    FROM universal_transaction_lines
    WHERE organization_id = p_org_id
      AND transaction_id = p_transaction_id;

    IF v_duplicate_lines > 0 THEN
        v_errors := v_errors || ('Duplicate line numbers found: ' || v_duplicate_lines::text);
    END IF;

    -- Check financial balance (if financial transaction)
    SELECT
        ABS(COALESCE(SUM(CASE WHEN UPPER(dr_cr) = 'DR' THEN total_amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN UPPER(dr_cr) = 'CR' THEN total_amount ELSE 0 END), 0))
    INTO v_financial_imbalance
    FROM universal_transaction_lines l
    JOIN universal_transactions t ON l.transaction_id = t.id
    WHERE l.organization_id = p_org_id
      AND l.transaction_id = p_transaction_id
      AND l.dr_cr IS NOT NULL
      AND (t.smart_code ILIKE '%.FIN.%' OR t.smart_code ILIKE '%.GL.%');

    IF v_financial_imbalance > 0.01 THEN
        v_errors := v_errors || ('Financial imbalance detected: ' || v_financial_imbalance::text);
    END IF;

    RETURN jsonb_build_object(
        'valid', array_length(v_errors, 1) IS NULL,
        'errors', v_errors,
        'warnings', v_warnings
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_validate_smart_code TO authenticated;
GRANT EXECUTE ON FUNCTION hera_assert_txn_org TO authenticated;
GRANT EXECUTE ON FUNCTION hera_txn_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_txn_query_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_txn_reverse_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_txn_validate_v1 TO authenticated;