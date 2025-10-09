-- ============================================================================
-- HERA Finance DNA Posting Rules RPC Functions
-- ============================================================================
-- High-performance RPC functions for Finance DNA V2 posting rules management
-- These functions support the modernized Finance DNA system with PostgreSQL optimization

-- ============================================================================
-- Get Posting Rules RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_get_posting_rules_v1(
    p_organization_id UUID,
    p_smart_code TEXT DEFAULT NULL,
    p_rule_status TEXT DEFAULT 'active'
)
RETURNS TABLE (
    rule_id UUID,
    smart_code TEXT,
    rule_version TEXT,
    priority INTEGER,
    rule_data JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_name TEXT;
BEGIN
    -- Validate organization access
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID is required';
    END IF;

    -- Get organization name
    SELECT entity_name INTO v_org_name
    FROM core_entities 
    WHERE id = p_organization_id AND entity_type = 'organization'
    LIMIT 1;
    
    IF v_org_name IS NULL THEN
        v_org_name := 'Unknown Organization';
    END IF;

    -- Return posting rules data from core_dynamic_data
    RETURN QUERY
    SELECT 
        pr.entity_id as rule_id,
        pr_smart_code.field_value_text as smart_code,
        COALESCE(pr_version.field_value_text, 'v2.0') as rule_version,
        COALESCE(pr_priority.field_value_number::integer, 100) as priority,
        pr_data.field_value_jsonb as rule_data,
        COALESCE(pr_active.field_value_boolean, true) as is_active,
        pr.created_at,
        pr.updated_at,
        v_org_name as organization_name
    FROM core_entities pr
    LEFT JOIN core_dynamic_data pr_smart_code ON pr.id = pr_smart_code.entity_id 
        AND pr_smart_code.field_name = 'smart_code'
    LEFT JOIN core_dynamic_data pr_version ON pr.id = pr_version.entity_id 
        AND pr_version.field_name = 'rule_version'
    LEFT JOIN core_dynamic_data pr_priority ON pr.id = pr_priority.entity_id 
        AND pr_priority.field_name = 'priority'
    LEFT JOIN core_dynamic_data pr_data ON pr.id = pr_data.entity_id 
        AND pr_data.field_name = 'rule_definition'
    LEFT JOIN core_dynamic_data pr_active ON pr.id = pr_active.entity_id 
        AND pr_active.field_name = 'is_active'
    WHERE pr.organization_id = p_organization_id
      AND pr.entity_type = 'posting_rule'
      AND (p_smart_code IS NULL OR pr_smart_code.field_value_text = p_smart_code)
      AND (p_rule_status = 'all' OR 
           (p_rule_status = 'active' AND COALESCE(pr_active.field_value_boolean, true) = true) OR
           (p_rule_status = 'inactive' AND COALESCE(pr_active.field_value_boolean, true) = false))
    ORDER BY COALESCE(pr_priority.field_value_number::integer, 100) DESC, pr.created_at;
END;
$$;

-- ============================================================================
-- Generate GL Lines RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_generate_gl_lines_v1(
    p_organization_id UUID,
    p_smart_code TEXT,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'AED',
    p_business_context JSONB DEFAULT '{}'
)
RETURNS TABLE (
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    debit_amount NUMERIC,
    credit_amount NUMERIC,
    description TEXT,
    line_type TEXT,
    confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rule_data JSONB;
    v_posting_lines JSONB;
    v_line_rule JSONB;
    v_account_info RECORD;
    v_line_amount NUMERIC;
    v_vat_rate NUMERIC := 0.05; -- Default 5% VAT
    v_net_amount NUMERIC;
    v_vat_amount NUMERIC;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_smart_code IS NULL OR p_amount IS NULL THEN
        RAISE EXCEPTION 'Organization ID, smart code, and amount are required';
    END IF;

    -- Get posting rule for this smart code
    SELECT pr_data.field_value_jsonb INTO v_rule_data
    FROM core_entities pr
    LEFT JOIN core_dynamic_data pr_smart_code ON pr.id = pr_smart_code.entity_id 
        AND pr_smart_code.field_name = 'smart_code'
    LEFT JOIN core_dynamic_data pr_data ON pr.id = pr_data.entity_id 
        AND pr_data.field_name = 'rule_definition'
    WHERE pr.organization_id = p_organization_id
      AND pr.entity_type = 'posting_rule'
      AND pr_smart_code.field_value_text = p_smart_code
    LIMIT 1;

    -- If no rule found, use default salon posting logic
    IF v_rule_data IS NULL THEN
        -- Default salon service revenue posting
        IF p_smart_code LIKE '%REVENUE.SERVICE%' THEN
            -- Calculate VAT inclusive amounts
            v_net_amount := p_amount / (1 + v_vat_rate);
            v_vat_amount := p_amount - v_net_amount;
            
            -- DR Cash/Card (from payment method in business context)
            SELECT id, entity_code, entity_name INTO v_account_info
            FROM core_entities 
            WHERE organization_id = p_organization_id 
              AND entity_type = 'gl_account'
              AND entity_code = CASE 
                  WHEN (p_business_context->>'payment_method') = 'card' THEN '1110000'
                  ELSE '1100000'
              END
            LIMIT 1;
            
            IF v_account_info.id IS NOT NULL THEN
                account_id := v_account_info.id;
                account_code := v_account_info.entity_code;
                account_name := v_account_info.entity_name;
                debit_amount := p_amount;
                credit_amount := NULL;
                description := 'Cash/Card received for service';
                line_type := 'debit';
                confidence := 0.95;
                RETURN NEXT;
            END IF;
            
            -- CR Service Revenue (net amount)
            SELECT id, entity_code, entity_name INTO v_account_info
            FROM core_entities 
            WHERE organization_id = p_organization_id 
              AND entity_type = 'gl_account'
              AND entity_code = '4100000'
            LIMIT 1;
            
            IF v_account_info.id IS NOT NULL THEN
                account_id := v_account_info.id;
                account_code := v_account_info.entity_code;
                account_name := v_account_info.entity_name;
                debit_amount := NULL;
                credit_amount := v_net_amount;
                description := 'Service revenue (net of VAT)';
                line_type := 'credit';
                confidence := 0.95;
                RETURN NEXT;
            END IF;
            
            -- CR VAT Payable (VAT amount)
            IF v_vat_amount > 0 THEN
                SELECT id, entity_code, entity_name INTO v_account_info
                FROM core_entities 
                WHERE organization_id = p_organization_id 
                  AND entity_type = 'gl_account'
                  AND entity_code = '2300000'
                LIMIT 1;
                
                IF v_account_info.id IS NOT NULL THEN
                    account_id := v_account_info.id;
                    account_code := v_account_info.entity_code;
                    account_name := v_account_info.entity_name;
                    debit_amount := NULL;
                    credit_amount := v_vat_amount;
                    description := 'VAT payable on service';
                    line_type := 'credit';
                    confidence := 0.95;
                    RETURN NEXT;
                END IF;
            END IF;
            
        -- Default salon expense posting
        ELSIF p_smart_code LIKE '%EXPENSE%' THEN
            -- DR Expense Account
            SELECT id, entity_code, entity_name INTO v_account_info
            FROM core_entities 
            WHERE organization_id = p_organization_id 
              AND entity_type = 'gl_account'
              AND entity_code = CASE 
                  WHEN p_smart_code LIKE '%SALARY%' THEN '5100000'
                  WHEN p_smart_code LIKE '%RENT%' THEN '5200000'
                  WHEN p_smart_code LIKE '%UTILITIES%' THEN '5300000'
                  WHEN p_smart_code LIKE '%SUPPLIES%' THEN '5400000'
                  ELSE '5900000' -- General expenses
              END
            LIMIT 1;
            
            IF v_account_info.id IS NOT NULL THEN
                account_id := v_account_info.id;
                account_code := v_account_info.entity_code;
                account_name := v_account_info.entity_name;
                debit_amount := p_amount;
                credit_amount := NULL;
                description := 'Expense incurred';
                line_type := 'debit';
                confidence := 0.90;
                RETURN NEXT;
            END IF;
            
            -- CR Cash
            SELECT id, entity_code, entity_name INTO v_account_info
            FROM core_entities 
            WHERE organization_id = p_organization_id 
              AND entity_type = 'gl_account'
              AND entity_code = '1100000'
            LIMIT 1;
            
            IF v_account_info.id IS NOT NULL THEN
                account_id := v_account_info.id;
                account_code := v_account_info.entity_code;
                account_name := v_account_info.entity_name;
                debit_amount := NULL;
                credit_amount := p_amount;
                description := 'Cash payment for expense';
                line_type := 'credit';
                confidence := 0.90;
                RETURN NEXT;
            END IF;
        END IF;
        
        RETURN;
    END IF;

    -- Process custom posting rule (if rule_data was found)
    v_posting_lines := v_rule_data->'posting_recipe'->'lines';
    
    -- Iterate through posting lines in the rule
    FOR i IN 0..jsonb_array_length(v_posting_lines) - 1 LOOP
        v_line_rule := v_posting_lines->i;
        
        -- Calculate line amount (simplified for demo)
        v_line_amount := p_amount;
        
        -- Handle VAT calculation for service revenue
        IF (v_line_rule->>'derive') LIKE '%Service Revenue%' THEN
            v_line_amount := p_amount / (1 + v_vat_rate);
        ELSIF (v_line_rule->>'derive') LIKE '%VAT Payable%' THEN
            v_line_amount := p_amount - (p_amount / (1 + v_vat_rate));
        END IF;
        
        -- Resolve account based on the 'from' field
        v_account_info := NULL;
        
        -- Handle different account resolution strategies
        IF (v_line_rule->>'from') LIKE 'accounts.%' THEN
            -- Static account mapping (simplified)
            IF (v_line_rule->>'from') = 'accounts.asset.cash' THEN
                SELECT id, entity_code, entity_name INTO v_account_info
                FROM core_entities 
                WHERE organization_id = p_organization_id 
                  AND entity_type = 'gl_account'
                  AND entity_code = '1100000'
                LIMIT 1;
            ELSIF (v_line_rule->>'from') = 'accounts.revenue.services' THEN
                SELECT id, entity_code, entity_name INTO v_account_info
                FROM core_entities 
                WHERE organization_id = p_organization_id 
                  AND entity_type = 'gl_account'
                  AND entity_code = '4100000'
                LIMIT 1;
            ELSIF (v_line_rule->>'from') = 'accounts.liability.vat_payable' THEN
                SELECT id, entity_code, entity_name INTO v_account_info
                FROM core_entities 
                WHERE organization_id = p_organization_id 
                  AND entity_type = 'gl_account'
                  AND entity_code = '2300000'
                LIMIT 1;
            END IF;
        END IF;
        
        -- Return the GL line if account was found
        IF v_account_info.id IS NOT NULL THEN
            account_id := v_account_info.id;
            account_code := v_account_info.entity_code;
            account_name := v_account_info.entity_name;
            
            IF (v_line_rule->>'derive') LIKE 'DR %' THEN
                debit_amount := v_line_amount;
                credit_amount := NULL;
                line_type := 'debit';
            ELSE
                debit_amount := NULL;
                credit_amount := v_line_amount;
                line_type := 'credit';
            END IF;
            
            description := v_line_rule->>'derive' || ': ' || p_smart_code;
            confidence := 0.95;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- ============================================================================
-- Validate Fiscal Period RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_validate_fiscal_period_v1(
    p_organization_id UUID,
    p_transaction_date DATE
)
RETURNS TABLE (
    is_open BOOLEAN,
    period_name TEXT,
    period_status TEXT,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fiscal_year INTEGER;
    v_period_status TEXT;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_transaction_date IS NULL THEN
        RAISE EXCEPTION 'Organization ID and transaction date are required';
    END IF;

    -- Extract fiscal year from transaction date
    v_fiscal_year := EXTRACT(YEAR FROM p_transaction_date);
    
    -- Check if we have fiscal period configuration
    SELECT fp_status.field_value_text INTO v_period_status
    FROM core_entities fp
    LEFT JOIN core_dynamic_data fp_year ON fp.id = fp_year.entity_id 
        AND fp_year.field_name = 'fiscal_year'
    LEFT JOIN core_dynamic_data fp_status ON fp.id = fp_status.entity_id 
        AND fp_status.field_name = 'period_status'
    WHERE fp.organization_id = p_organization_id
      AND fp.entity_type = 'fiscal_period'
      AND fp_year.field_value_number::integer = v_fiscal_year
    LIMIT 1;
    
    -- If no specific fiscal period configuration, use default logic
    IF v_period_status IS NULL THEN
        -- Allow transactions for current and previous year by default
        IF v_fiscal_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1 THEN
            is_open := true;
            period_name := v_fiscal_year::text;
            period_status := 'open';
            reason := 'Default fiscal period policy';
        ELSE
            is_open := false;
            period_name := v_fiscal_year::text;
            period_status := 'closed';
            reason := 'Period is too old (default policy)';
        END IF;
    ELSE
        -- Use configured period status
        is_open := (v_period_status = 'open');
        period_name := v_fiscal_year::text;
        period_status := v_period_status;
        reason := CASE 
            WHEN v_period_status = 'open' THEN 'Fiscal period is open for posting'
            WHEN v_period_status = 'closed' THEN 'Fiscal period has been closed'
            ELSE 'Unknown period status'
        END;
    END IF;
    
    RETURN NEXT;
END;
$$;

-- ============================================================================
-- Validate Currency RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_validate_currency_v1(
    p_organization_id UUID,
    p_currency_code TEXT
)
RETURNS TABLE (
    is_supported BOOLEAN,
    exchange_rate NUMERIC,
    base_currency TEXT,
    last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_base_currency TEXT;
    v_exchange_rate NUMERIC;
    v_last_updated TIMESTAMPTZ;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_currency_code IS NULL THEN
        RAISE EXCEPTION 'Organization ID and currency code are required';
    END IF;

    -- Get organization's base currency
    SELECT cc_base.field_value_text INTO v_base_currency
    FROM core_entities org
    LEFT JOIN core_dynamic_data cc_base ON org.id = cc_base.entity_id 
        AND cc_base.field_name = 'base_currency'
    WHERE org.id = p_organization_id
      AND org.entity_type = 'organization'
    LIMIT 1;
    
    -- Default to AED if not configured
    IF v_base_currency IS NULL THEN
        v_base_currency := 'AED';
    END IF;
    
    -- If requesting base currency, return 1.0
    IF p_currency_code = v_base_currency THEN
        is_supported := true;
        exchange_rate := 1.0;
        base_currency := v_base_currency;
        last_updated := CURRENT_TIMESTAMP;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Look up exchange rate configuration
    SELECT 
        er_rate.field_value_number,
        er_updated.field_value_timestamptz
    INTO v_exchange_rate, v_last_updated
    FROM core_entities er
    LEFT JOIN core_dynamic_data er_from ON er.id = er_from.entity_id 
        AND er_from.field_name = 'from_currency'
    LEFT JOIN core_dynamic_data er_to ON er.id = er_to.entity_id 
        AND er_to.field_name = 'to_currency'
    LEFT JOIN core_dynamic_data er_rate ON er.id = er_rate.entity_id 
        AND er_rate.field_name = 'exchange_rate'
    LEFT JOIN core_dynamic_data er_updated ON er.id = er_updated.entity_id 
        AND er_updated.field_name = 'last_updated'
    WHERE er.organization_id = p_organization_id
      AND er.entity_type = 'exchange_rate'
      AND er_from.field_value_text = p_currency_code
      AND er_to.field_value_text = v_base_currency
    ORDER BY er.updated_at DESC
    LIMIT 1;
    
    -- If no exchange rate found, use default for common currencies
    IF v_exchange_rate IS NULL THEN
        CASE p_currency_code
            WHEN 'USD' THEN v_exchange_rate := 3.67; -- USD to AED
            WHEN 'EUR' THEN v_exchange_rate := 4.12; -- EUR to AED
            WHEN 'GBP' THEN v_exchange_rate := 4.86; -- GBP to AED
            WHEN 'SAR' THEN v_exchange_rate := 0.98; -- SAR to AED
            ELSE v_exchange_rate := NULL;
        END CASE;
        
        v_last_updated := CURRENT_TIMESTAMP;
    END IF;
    
    -- Return result
    is_supported := (v_exchange_rate IS NOT NULL);
    exchange_rate := v_exchange_rate;
    base_currency := v_base_currency;
    last_updated := v_last_updated;
    
    RETURN NEXT;
END;
$$;

-- ============================================================================
-- Resolve Payment Account RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_resolve_payment_account_v1(
    p_organization_id UUID,
    p_payment_method TEXT,
    p_business_context JSONB DEFAULT '{}'
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_id UUID,
    confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_code TEXT;
    v_account_info RECORD;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_payment_method IS NULL THEN
        RAISE EXCEPTION 'Organization ID and payment method are required';
    END IF;

    -- Determine account code based on payment method
    CASE p_payment_method
        WHEN 'cash' THEN v_account_code := '1100000';
        WHEN 'card' THEN v_account_code := '1110000';
        WHEN 'bank' THEN v_account_code := '1120000';
        WHEN 'transfer' THEN v_account_code := '1120000';
        ELSE v_account_code := '1100000'; -- Default to cash
    END CASE;
    
    -- Get account information
    SELECT id, entity_code, entity_name INTO v_account_info
    FROM core_entities 
    WHERE organization_id = p_organization_id 
      AND entity_type = 'gl_account'
      AND entity_code = v_account_code
    LIMIT 1;
    
    -- Return account information
    IF v_account_info.id IS NOT NULL THEN
        account_code := v_account_info.entity_code;
        account_name := v_account_info.entity_name;
        account_id := v_account_info.id;
        confidence := 0.95;
    ELSE
        -- Fallback if specific account not found
        account_code := v_account_code;
        account_name := 'Payment Account - ' || p_payment_method;
        account_id := NULL;
        confidence := 0.50;
    END IF;
    
    RETURN NEXT;
END;
$$;

-- ============================================================================
-- Resolve Expense Account RPC Function
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_resolve_expense_account_v1(
    p_organization_id UUID,
    p_expense_category TEXT,
    p_business_context JSONB DEFAULT '{}'
)
RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_id UUID,
    confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_code TEXT;
    v_account_info RECORD;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL OR p_expense_category IS NULL THEN
        RAISE EXCEPTION 'Organization ID and expense category are required';
    END IF;

    -- Determine account code based on expense category
    CASE UPPER(p_expense_category)
        WHEN 'SALARY', 'WAGES', 'PAYROLL' THEN v_account_code := '5100000';
        WHEN 'RENT' THEN v_account_code := '5200000';
        WHEN 'UTILITIES' THEN v_account_code := '5300000';
        WHEN 'SUPPLIES' THEN v_account_code := '5400000';
        WHEN 'MARKETING', 'ADVERTISING' THEN v_account_code := '5600000';
        WHEN 'INSURANCE' THEN v_account_code := '5700000';
        WHEN 'MAINTENANCE', 'REPAIRS' THEN v_account_code := '5800000';
        WHEN 'BANK', 'FEES' THEN v_account_code := '5900000';
        ELSE v_account_code := '5990000'; -- General expenses
    END CASE;
    
    -- Get account information
    SELECT id, entity_code, entity_name INTO v_account_info
    FROM core_entities 
    WHERE organization_id = p_organization_id 
      AND entity_type = 'gl_account'
      AND entity_code = v_account_code
    LIMIT 1;
    
    -- Return account information
    IF v_account_info.id IS NOT NULL THEN
        account_code := v_account_info.entity_code;
        account_name := v_account_info.entity_name;
        account_id := v_account_info.id;
        confidence := 0.90;
    ELSE
        -- Fallback if specific account not found
        account_code := v_account_code;
        account_name := 'Expense - ' || p_expense_category;
        account_id := NULL;
        confidence := 0.60;
    END IF;
    
    RETURN NEXT;
END;
$$;

-- ============================================================================
-- Grant permissions for RPC functions
-- ============================================================================

-- Grant EXECUTE permissions to authenticated users
GRANT EXECUTE ON FUNCTION hera_get_posting_rules_v1(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_generate_gl_lines_v1(UUID, TEXT, NUMERIC, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_validate_fiscal_period_v1(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_validate_currency_v1(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_resolve_payment_account_v1(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_resolve_expense_account_v1(UUID, TEXT, JSONB) TO authenticated;

-- Grant EXECUTE permissions to service role for API access
GRANT EXECUTE ON FUNCTION hera_get_posting_rules_v1(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION hera_generate_gl_lines_v1(UUID, TEXT, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION hera_validate_fiscal_period_v1(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION hera_validate_currency_v1(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION hera_resolve_payment_account_v1(UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION hera_resolve_expense_account_v1(UUID, TEXT, JSONB) TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION hera_get_posting_rules_v1(UUID, TEXT, TEXT) IS 'Retrieve Finance DNA posting rules with PostgreSQL optimization';
COMMENT ON FUNCTION hera_generate_gl_lines_v1(UUID, TEXT, NUMERIC, TEXT, JSONB) IS 'Generate GL lines for auto-posting using smart code rules';
COMMENT ON FUNCTION hera_validate_fiscal_period_v1(UUID, DATE) IS 'Validate if fiscal period is open for posting transactions';
COMMENT ON FUNCTION hera_validate_currency_v1(UUID, TEXT) IS 'Validate currency support and get exchange rates';
COMMENT ON FUNCTION hera_resolve_payment_account_v1(UUID, TEXT, JSONB) IS 'Resolve GL account for payment method (cash, card, bank)';
COMMENT ON FUNCTION hera_resolve_expense_account_v1(UUID, TEXT, JSONB) IS 'Resolve GL account for expense category (salary, rent, utilities, etc.)';
