-- HERA Transactions Post v2 with Actor Stamping & GL Validation
-- ==============================================================
-- Implements v2.2 "Authenticated Actor Everywhere" pattern

CREATE OR REPLACE FUNCTION hera_transactions_post_v2(
    p_transaction JSONB,       -- Transaction header
    p_lines JSONB[],          -- Transaction lines array
    p_actor_user_id UUID      -- ✅ REQUIRED: USER entity ID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
    v_org_id UUID;
    v_line JSONB;
    v_line_amount_total NUMERIC := 0;
    v_debit_total NUMERIC := 0;
    v_credit_total NUMERIC := 0;
    v_membership_check BOOLEAN := false;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_is_gl_transaction BOOLEAN := false;
    v_line_count INTEGER := 0;
BEGIN
    -- Input validation
    IF p_actor_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_ACTOR_REQUIRED',
            'message', 'p_actor_user_id cannot be null'
        );
    END IF;
    
    v_org_id := (p_transaction->>'organization_id')::UUID;
    
    IF v_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_GUARDRAIL_VIOLATION',
            'message', 'organization_id required in transaction'
        );
    END IF;
    
    -- ✅ Validate actor is a USER entity
    IF NOT EXISTS (
        SELECT 1 FROM core_entities
        WHERE id = p_actor_user_id
        AND entity_type = 'USER'
        AND organization_id = v_platform_org_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_ACTOR_INVALID',
            'message', 'Actor must be valid USER entity'
        );
    END IF;
    
    -- ✅ Membership enforcement
    SELECT EXISTS(
        SELECT 1 FROM core_relationships
        WHERE source_entity_id = p_actor_user_id
        AND target_entity_id = v_org_id
        AND relationship_type = 'USER_MEMBER_OF_ORG'
    ) INTO v_membership_check;
    
    IF NOT v_membership_check THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_MEMBERSHIP_DENIED',
            'message', format('Actor %s not member of organization %s', p_actor_user_id, v_org_id)
        );
    END IF;
    
    -- ✅ Validate smart_code pattern
    IF p_transaction->>'smart_code' IS NULL OR 
       NOT (p_transaction->>'smart_code' ~ '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_GUARDRAIL_VIOLATION',
            'message', 'smart_code must match pattern HERA.*.*.*.V#'
        );
    END IF;
    
    -- Check if this is a GL transaction
    v_is_gl_transaction := (p_transaction->>'smart_code' LIKE '%.GL.%');
    
    -- ✅ GL Balance validation for GL transactions
    IF v_is_gl_transaction AND p_lines IS NOT NULL THEN
        FOR i IN 1..array_length(p_lines, 1) LOOP
            v_line := p_lines[i];
            
            -- Use sign convention: positive = debit, negative = credit
            v_line_amount_total := v_line_amount_total + COALESCE((v_line->>'line_amount')::NUMERIC, 0);
            
            -- Legacy debit/credit support (if present)
            v_debit_total := v_debit_total + COALESCE((v_line->>'debit_amount')::NUMERIC, 0);
            v_credit_total := v_credit_total + COALESCE((v_line->>'credit_amount')::NUMERIC, 0);
        END LOOP;
        
        -- Validate balance using sign convention OR legacy debit/credit
        IF (v_debit_total > 0 OR v_credit_total > 0) THEN
            -- Legacy debit/credit validation
            IF ABS(v_debit_total - v_credit_total) > 0.01 THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error_code', 'HERA_GL_UNBALANCED',
                    'message', format('GL transaction unbalanced: Debits (%.2f) != Credits (%.2f)', v_debit_total, v_credit_total),
                    'debits', v_debit_total,
                    'credits', v_credit_total
                );
            END IF;
        ELSE
            -- Sign convention validation (should sum to zero)
            IF ABS(v_line_amount_total) > 0.01 THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error_code', 'HERA_GL_UNBALANCED',
                    'message', format('GL transaction unbalanced: Line amounts sum to %.2f (should be 0)', v_line_amount_total),
                    'line_total', v_line_amount_total
                );
            END IF;
        END IF;
    END IF;
    
    -- ✅ Insert transaction with actor stamping
    INSERT INTO universal_transactions (
        id,
        organization_id,
        transaction_type,
        transaction_number,
        transaction_date,
        reference_number,
        external_reference,
        source_entity_id,
        target_entity_id,
        total_amount,
        tax_amount,
        discount_amount,
        net_amount,
        currency,
        status,
        workflow_state,
        priority,
        department,
        project_code,
        cost_center,
        due_date,
        completed_date,
        description,
        notes,
        metadata,
        attachments,
        ai_insights,
        ai_risk_score,
        ai_anomaly_score,
        created_by,    -- ✅ Actor stamping
        updated_by,    -- ✅ Actor stamping
        created_at,
        updated_at,
        version,
        is_intercompany,
        intercompany_source_org,
        intercompany_target_org,
        intercompany_reference,
        elimination_required
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        p_transaction->>'transaction_type',
        p_transaction->>'transaction_number',
        COALESCE((p_transaction->>'transaction_date')::DATE, CURRENT_DATE),
        p_transaction->>'reference_number',
        p_transaction->>'external_reference',
        (p_transaction->>'source_entity_id')::UUID,
        (p_transaction->>'target_entity_id')::UUID,
        COALESCE((p_transaction->>'total_amount')::NUMERIC, 0.0000),
        COALESCE((p_transaction->>'tax_amount')::NUMERIC, 0.0000),
        COALESCE((p_transaction->>'discount_amount')::NUMERIC, 0.0000),
        COALESCE((p_transaction->>'net_amount')::NUMERIC, 
                 (COALESCE((p_transaction->>'total_amount')::NUMERIC, 0) - 
                  COALESCE((p_transaction->>'discount_amount')::NUMERIC, 0) + 
                  COALESCE((p_transaction->>'tax_amount')::NUMERIC, 0))),
        COALESCE(p_transaction->>'currency', 'USD'),
        COALESCE(p_transaction->>'status', 'draft'),
        p_transaction->>'workflow_state',
        COALESCE(p_transaction->>'priority', 'normal'),
        p_transaction->>'department',
        p_transaction->>'project_code',
        p_transaction->>'cost_center',
        (p_transaction->>'due_date')::DATE,
        (p_transaction->>'completed_date')::DATE,
        p_transaction->>'description',
        p_transaction->>'notes',
        COALESCE(p_transaction->'metadata', '{}'::jsonb),
        COALESCE(p_transaction->'attachments', '[]'::jsonb),
        COALESCE(p_transaction->'ai_insights', '{}'::jsonb),
        COALESCE((p_transaction->>'ai_risk_score')::NUMERIC, 0.0000),
        COALESCE((p_transaction->>'ai_anomaly_score')::NUMERIC, 0.0000),
        p_actor_user_id,  -- ✅ Actor stamping
        p_actor_user_id,  -- ✅ Actor stamping
        NOW(),
        NOW(),
        COALESCE((p_transaction->>'version')::INTEGER, 1),
        COALESCE((p_transaction->>'is_intercompany')::BOOLEAN, false),
        (p_transaction->>'intercompany_source_org')::UUID,
        (p_transaction->>'intercompany_target_org')::UUID,
        p_transaction->>'intercompany_reference',
        COALESCE((p_transaction->>'elimination_required')::BOOLEAN, false)
    ) RETURNING id INTO v_transaction_id;
    
    -- ✅ Insert lines with actor stamping
    IF p_lines IS NOT NULL THEN
        FOR i IN 1..array_length(p_lines, 1) LOOP
            v_line := p_lines[i];
            v_line_count := v_line_count + 1;
            
            INSERT INTO universal_transaction_lines (
                id,
                transaction_id,
                organization_id,
                entity_id,
                line_description,
                line_order,
                quantity,
                unit_of_measure,
                unit_price,
                line_amount,
                discount_percentage,
                discount_amount,
                tax_code,
                tax_percentage,
                tax_amount,
                net_line_amount,
                gl_account_code,
                cost_center,
                department,
                project_code,
                delivery_date,
                service_period_start,
                service_period_end,
                notes,
                metadata,
                ai_gl_suggestion,
                ai_confidence,
                ai_cost_prediction,
                ai_margin_analysis,
                created_by,    -- ✅ Actor stamping
                updated_by,    -- ✅ Actor stamping
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_transaction_id,
                v_org_id,
                (v_line->>'entity_id')::UUID,
                v_line->>'line_description',
                COALESCE((v_line->>'line_order')::INTEGER, i),
                COALESCE((v_line->>'quantity')::NUMERIC, 1.000000),
                COALESCE(v_line->>'unit_of_measure', 'each'),
                COALESCE((v_line->>'unit_price')::NUMERIC, 0.0000),
                COALESCE((v_line->>'line_amount')::NUMERIC, 0.0000),
                COALESCE((v_line->>'discount_percentage')::NUMERIC, 0.0000),
                COALESCE((v_line->>'discount_amount')::NUMERIC, 0.0000),
                v_line->>'tax_code',
                COALESCE((v_line->>'tax_percentage')::NUMERIC, 0.0000),
                COALESCE((v_line->>'tax_amount')::NUMERIC, 0.0000),
                COALESCE((v_line->>'net_line_amount')::NUMERIC,
                         (COALESCE((v_line->>'line_amount')::NUMERIC, 0) - 
                          COALESCE((v_line->>'discount_amount')::NUMERIC, 0) + 
                          COALESCE((v_line->>'tax_amount')::NUMERIC, 0))),
                v_line->>'gl_account_code',
                v_line->>'cost_center',
                v_line->>'department',
                v_line->>'project_code',
                (v_line->>'delivery_date')::DATE,
                (v_line->>'service_period_start')::DATE,
                (v_line->>'service_period_end')::DATE,
                v_line->>'notes',
                COALESCE(v_line->'metadata', '{}'::jsonb),
                v_line->>'ai_gl_suggestion',
                COALESCE((v_line->>'ai_confidence')::NUMERIC, 0.0000),
                (v_line->>'ai_cost_prediction')::NUMERIC,
                COALESCE(v_line->'ai_margin_analysis', '{}'::jsonb),
                p_actor_user_id,  -- ✅ Actor stamping
                p_actor_user_id,  -- ✅ Actor stamping
                NOW(),
                NOW()
            );
        END LOOP;
    END IF;
    
    -- Success response
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'lines_count', v_line_count,
        'actor_user_id', p_actor_user_id,
        'organization_id', v_org_id,
        'is_gl_transaction', v_is_gl_transaction,
        'gl_balance_validated', v_is_gl_transaction
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_RPC_ERROR',
            'message', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_transactions_post_v2(JSONB, JSONB[], UUID) TO authenticated;

-- Add function documentation
COMMENT ON FUNCTION hera_transactions_post_v2 IS 'HERA v2.2 Transaction posting with actor stamping, membership enforcement, and GL balance validation';