-- =============================================
-- HERA FIN (Financial Management) TRIGGERS v1
-- GL posting, validation, and financial automation
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- GL ACCOUNT VALIDATION
-- =============================================

-- Function: Validate GL account setup
CREATE OR REPLACE FUNCTION fin_validate_gl_account()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_account RECORD;
    v_existing_code INTEGER;
BEGIN
    -- Only process GL accounts
    IF NEW.entity_type != 'gl_account' THEN
        RETURN NEW;
    END IF;

    -- Validate account code format (must be numeric)
    IF NOT (NEW.entity_code ~ '^\d+$') THEN
        RAISE EXCEPTION 'GL account code must be numeric';
    END IF;

    -- Check for duplicate account code
    SELECT COUNT(*) INTO v_existing_code
    FROM core_entities
    WHERE entity_type = 'gl_account'
    AND entity_code = NEW.entity_code
    AND organization_id = NEW.organization_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_existing_code > 0 THEN
        RAISE EXCEPTION 'GL account code % already exists', NEW.entity_code;
    END IF;

    -- Set default metadata
    NEW.metadata = jsonb_set(
        COALESCE(NEW.metadata, '{}'::jsonb),
        '{status}',
        COALESCE(NEW.metadata->>'status', 'inactive')::jsonb
    );

    -- Validate account type
    IF NEW.metadata->>'account_type' NOT IN ('asset', 'liability', 'equity', 'revenue', 'expense') THEN
        RAISE EXCEPTION 'Invalid account type. Must be: asset, liability, equity, revenue, or expense';
    END IF;

    -- Set normal balance based on account type
    CASE NEW.metadata->>'account_type'
        WHEN 'asset' THEN
            NEW.metadata = jsonb_set(NEW.metadata, '{normal_balance}', '"debit"'::jsonb);
        WHEN 'expense' THEN
            NEW.metadata = jsonb_set(NEW.metadata, '{normal_balance}', '"debit"'::jsonb);
        WHEN 'liability' THEN
            NEW.metadata = jsonb_set(NEW.metadata, '{normal_balance}', '"credit"'::jsonb);
        WHEN 'equity' THEN
            NEW.metadata = jsonb_set(NEW.metadata, '{normal_balance}', '"credit"'::jsonb);
        WHEN 'revenue' THEN
            NEW.metadata = jsonb_set(NEW.metadata, '{normal_balance}', '"credit"'::jsonb);
    END CASE;

    -- Add IFRS classification based on account code range
    IF NEW.entity_code >= '1000' AND NEW.entity_code < '2000' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{ifrs_classification}', '"current_assets"'::jsonb);
    ELSIF NEW.entity_code >= '2000' AND NEW.entity_code < '3000' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{ifrs_classification}', '"current_liabilities"'::jsonb);
    ELSIF NEW.entity_code >= '3000' AND NEW.entity_code < '4000' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{ifrs_classification}', '"equity"'::jsonb);
    ELSIF NEW.entity_code >= '4000' AND NEW.entity_code < '5000' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{ifrs_classification}', '"revenue"'::jsonb);
    ELSIF NEW.entity_code >= '5000' AND NEW.entity_code < '6000' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{ifrs_classification}', '"cost_of_sales"'::jsonb);
    ELSIF NEW.entity_code >= '6000' AND NEW.entity_code < '7000' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{ifrs_classification}', '"operating_expenses"'::jsonb);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for GL account validation
CREATE TRIGGER trg_fin_validate_gl_account
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION fin_validate_gl_account();

-- =============================================
-- JOURNAL ENTRY VALIDATION & POSTING
-- =============================================

-- Function: Validate and post journal entries
CREATE OR REPLACE FUNCTION fin_validate_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debits NUMERIC := 0;
    v_total_credits NUMERIC := 0;
    v_line RECORD;
    v_account RECORD;
    v_period RECORD;
BEGIN
    -- Only process journal entries
    IF NEW.transaction_type NOT IN ('journal_entry', 'journal_adjustment', 'journal_reversal') THEN
        RETURN NEW;
    END IF;

    -- Check if accounting period is open
    SELECT * INTO v_period
    FROM core_entities
    WHERE entity_type = 'fiscal_period'
    AND organization_id = NEW.organization_id
    AND NEW.transaction_date BETWEEN (metadata->>'start_date')::DATE AND (metadata->>'end_date')::DATE
    AND metadata->>'status' = 'open'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No open accounting period for date %', NEW.transaction_date::DATE;
    END IF;

    -- Store period reference
    NEW.metadata = jsonb_set(
        COALESCE(NEW.metadata, '{}'::jsonb),
        '{fiscal_period_id}',
        to_jsonb(v_period.id::TEXT)
    );

    -- For manual entries, require description
    IF NEW.smart_code = 'HERA.FIN.GL.JOURNAL.MANUAL.V1' AND 
       (NEW.metadata->>'description' IS NULL OR NEW.metadata->>'description' = '') THEN
        RAISE EXCEPTION 'Manual journal entries require a description';
    END IF;

    -- Set initial status
    NEW.metadata = jsonb_set(
        NEW.metadata,
        '{posting_status}',
        '"pending"'::jsonb
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for journal validation
CREATE TRIGGER trg_fin_validate_journal
    BEFORE INSERT ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION fin_validate_journal_entry();

-- Function: Validate journal lines and auto-post
CREATE OR REPLACE FUNCTION fin_validate_journal_lines()
RETURNS TRIGGER AS $$
DECLARE
    v_journal RECORD;
    v_account RECORD;
    v_total_debits NUMERIC;
    v_total_credits NUMERIC;
BEGIN
    -- Get parent journal entry
    SELECT * INTO v_journal
    FROM universal_transactions
    WHERE id = NEW.transaction_id
    AND transaction_type IN ('journal_entry', 'journal_adjustment', 'journal_reversal');

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Validate GL account exists and is active
    SELECT * INTO v_account
    FROM core_entities
    WHERE id = NEW.line_entity_id
    AND entity_type = 'gl_account'
    AND organization_id = v_journal.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid GL account';
    END IF;

    IF v_account.metadata->>'status' != 'active' THEN
        RAISE EXCEPTION 'GL account % is not active', v_account.entity_code;
    END IF;

    -- Ensure debit/credit indicator is set
    IF NEW.metadata->>'entry_type' NOT IN ('debit', 'credit') THEN
        RAISE EXCEPTION 'Journal line must specify entry_type as debit or credit';
    END IF;

    -- Store account details in line metadata
    NEW.metadata = jsonb_set(
        COALESCE(NEW.metadata, '{}'::jsonb),
        '{gl_account_code}',
        to_jsonb(v_account.entity_code)
    );
    
    NEW.metadata = jsonb_set(
        NEW.metadata,
        '{gl_account_name}',
        to_jsonb(v_account.entity_name)
    );

    -- After insert, check if journal is balanced
    IF TG_OP = 'INSERT' THEN
        -- Calculate totals
        SELECT 
            COALESCE(SUM(CASE WHEN metadata->>'entry_type' = 'debit' THEN line_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN metadata->>'entry_type' = 'credit' THEN line_amount ELSE 0 END), 0)
        INTO v_total_debits, v_total_credits
        FROM universal_transaction_lines
        WHERE transaction_id = NEW.transaction_id;

        -- Update journal with totals
        UPDATE universal_transactions
        SET metadata = jsonb_set(
            jsonb_set(
                metadata,
                '{total_debits}',
                to_jsonb(v_total_debits)
            ),
            '{total_credits}',
            to_jsonb(v_total_credits)
        )
        WHERE id = NEW.transaction_id;

        -- If balanced, auto-post
        IF v_total_debits = v_total_credits AND v_total_debits > 0 THEN
            UPDATE universal_transactions
            SET metadata = jsonb_set(
                metadata,
                '{posting_status}',
                '"posted"'::jsonb
            )
            WHERE id = NEW.transaction_id;

            -- Update GL account balances
            PERFORM fin_update_gl_balances(NEW.transaction_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for journal line validation
CREATE TRIGGER trg_fin_validate_journal_lines
    BEFORE INSERT ON universal_transaction_lines
    FOR EACH ROW
    EXECUTE FUNCTION fin_validate_journal_lines();

-- =============================================
-- GL BALANCE MANAGEMENT
-- =============================================

-- Function: Update GL account balances
CREATE OR REPLACE FUNCTION fin_update_gl_balances(p_journal_id UUID)
RETURNS VOID AS $$
DECLARE
    v_line RECORD;
    v_amount NUMERIC;
    v_period_id UUID;
BEGIN
    -- Get period from journal
    SELECT (metadata->>'fiscal_period_id')::UUID INTO v_period_id
    FROM universal_transactions
    WHERE id = p_journal_id;

    -- Process each journal line
    FOR v_line IN
        SELECT l.*, a.metadata->>'normal_balance' as normal_balance
        FROM universal_transaction_lines l
        JOIN core_entities a ON a.id = l.line_entity_id
        WHERE l.transaction_id = p_journal_id
    LOOP
        -- Calculate amount based on normal balance
        IF (v_line.metadata->>'entry_type' = 'debit' AND v_line.normal_balance = 'debit') OR
           (v_line.metadata->>'entry_type' = 'credit' AND v_line.normal_balance = 'credit') THEN
            v_amount := v_line.line_amount; -- Increase
        ELSE
            v_amount := -v_line.line_amount; -- Decrease
        END IF;

        -- Update or create balance record
        INSERT INTO core_dynamic_data (
            entity_id,
            field_name,
            field_value_number,
            metadata,
            smart_code
        ) VALUES (
            v_line.line_entity_id,
            'period_balance_' || v_period_id,
            v_amount,
            jsonb_build_object(
                'period_id', v_period_id,
                'last_journal_id', p_journal_id,
                'last_update', NOW()
            ),
            'HERA.FIN.GL.BALANCE.PERIOD.V1'
        )
        ON CONFLICT (entity_id, field_name) 
        DO UPDATE SET
            field_value_number = core_dynamic_data.field_value_number + v_amount,
            metadata = jsonb_set(
                jsonb_set(
                    core_dynamic_data.metadata,
                    '{last_journal_id}',
                    to_jsonb(p_journal_id::TEXT)
                ),
                '{last_update}',
                to_jsonb(NOW()::TEXT)
            );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTOMATED GL POSTING FROM OTHER MODULES
-- =============================================

-- Function: Auto-create GL entries from business transactions
CREATE OR REPLACE FUNCTION fin_auto_gl_posting()
RETURNS TRIGGER AS $$
DECLARE
    v_gl_mapping JSONB;
    v_journal_id UUID;
    v_gl_entries JSONB;
    v_entry JSONB;
    v_account_id UUID;
BEGIN
    -- Skip if already has GL posting
    IF NEW.metadata->>'gl_posted' = 'true' THEN
        RETURN NEW;
    END IF;

    -- Determine GL mapping based on transaction type and smart code
    CASE 
        -- Sales transactions
        WHEN NEW.smart_code LIKE 'HERA.O2C.INVOICE.%' THEN
            v_gl_entries := '[
                {"account": "1200", "type": "debit", "amount": "total"},
                {"account": "4100", "type": "credit", "amount": "net"},
                {"account": "2250", "type": "credit", "amount": "tax"}
            ]'::jsonb;
            
        -- Purchase transactions
        WHEN NEW.smart_code LIKE 'HERA.P2P.INVOICE.%' THEN
            v_gl_entries := '[
                {"account": "5100", "type": "debit", "amount": "net"},
                {"account": "1150", "type": "debit", "amount": "tax"},
                {"account": "2100", "type": "credit", "amount": "total"}
            ]'::jsonb;
            
        -- Payment received
        WHEN NEW.smart_code = 'HERA.O2C.PAYMENT.RECEIVE.V1' THEN
            v_gl_entries := '[
                {"account": "1100", "type": "debit", "amount": "total"},
                {"account": "1200", "type": "credit", "amount": "total"}
            ]'::jsonb;
            
        -- Payment made
        WHEN NEW.smart_code = 'HERA.P2P.PAYMENT.SEND.V1' THEN
            v_gl_entries := '[
                {"account": "2100", "type": "debit", "amount": "total"},
                {"account": "1100", "type": "credit", "amount": "total"}
            ]'::jsonb;
            
        -- Payroll
        WHEN NEW.smart_code = 'HERA.HCM.PAY.RUN.V1' THEN
            v_gl_entries := '[
                {"account": "6100", "type": "debit", "amount": "gross"},
                {"account": "2300", "type": "credit", "amount": "net"},
                {"account": "2310", "type": "credit", "amount": "tax"}
            ]'::jsonb;
            
        ELSE
            -- No GL mapping for this transaction type
            RETURN NEW;
    END CASE;

    -- Create journal entry
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        transaction_code,
        smart_code,
        transaction_date,
        reference_entity_id,
        metadata
    ) VALUES (
        NEW.organization_id,
        'journal_entry',
        'JE-' || NEW.transaction_code,
        'HERA.FIN.GL.JOURNAL.AUTO.V1',
        NEW.transaction_date,
        NEW.id,
        jsonb_build_object(
            'source_module', SPLIT_PART(NEW.smart_code, '.', 2),
            'source_transaction', NEW.transaction_code,
            'auto_generated', true,
            'description', 'Auto GL posting for ' || NEW.transaction_code
        )
    ) RETURNING id INTO v_journal_id;

    -- Create journal lines
    FOR v_entry IN SELECT * FROM jsonb_array_elements(v_gl_entries)
    LOOP
        -- Find GL account
        SELECT id INTO v_account_id
        FROM core_entities
        WHERE entity_type = 'gl_account'
        AND entity_code = v_entry->>'account'
        AND organization_id = NEW.organization_id
        LIMIT 1;

        IF v_account_id IS NOT NULL THEN
            -- Calculate amount
            DECLARE
                v_line_amount NUMERIC;
            BEGIN
                CASE v_entry->>'amount'
                    WHEN 'total' THEN v_line_amount := NEW.total_amount;
                    WHEN 'net' THEN v_line_amount := NEW.total_amount * 0.9; -- Assuming 10% tax
                    WHEN 'tax' THEN v_line_amount := NEW.total_amount * 0.1;
                    WHEN 'gross' THEN v_line_amount := NEW.metadata->>'gross_pay';
                    ELSE v_line_amount := (v_entry->>'amount')::NUMERIC;
                END CASE;

                INSERT INTO universal_transaction_lines (
                    transaction_id,
                    line_number,
                    line_entity_id,
                    line_amount,
                    metadata
                ) VALUES (
                    v_journal_id,
                    (SELECT COALESCE(MAX(line_number), 0) + 1 
                     FROM universal_transaction_lines 
                     WHERE transaction_id = v_journal_id),
                    v_account_id,
                    v_line_amount,
                    jsonb_build_object(
                        'entry_type', v_entry->>'type',
                        'auto_posted', true
                    )
                );
            END;
        END IF;
    END LOOP;

    -- Mark original transaction as GL posted
    NEW.metadata = jsonb_set(
        NEW.metadata,
        '{gl_posted}',
        'true'::jsonb
    );
    
    NEW.metadata = jsonb_set(
        NEW.metadata,
        '{gl_journal_id}',
        to_jsonb(v_journal_id::TEXT)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto GL posting
CREATE TRIGGER trg_fin_auto_gl_posting
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.smart_code IS NOT NULL)
    EXECUTE FUNCTION fin_auto_gl_posting();

-- =============================================
-- PERIOD CLOSING
-- =============================================

-- Function: Period closing process
CREATE OR REPLACE FUNCTION fin_close_period(
    p_organization_id UUID,
    p_period_id UUID,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_period RECORD;
    v_unposted_count INTEGER;
    v_next_period RECORD;
    v_result JSONB;
BEGIN
    -- Get period details
    SELECT * INTO v_period
    FROM core_entities
    WHERE id = p_period_id
    AND entity_type = 'fiscal_period'
    AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Period not found';
    END IF;

    IF v_period.metadata->>'status' != 'open' THEN
        RAISE EXCEPTION 'Period is not open';
    END IF;

    -- Check for unposted journal entries
    SELECT COUNT(*) INTO v_unposted_count
    FROM universal_transactions
    WHERE organization_id = p_organization_id
    AND transaction_type IN ('journal_entry', 'journal_adjustment')
    AND transaction_date BETWEEN (v_period.metadata->>'start_date')::DATE 
        AND (v_period.metadata->>'end_date')::DATE
    AND metadata->>'posting_status' != 'posted';

    IF v_unposted_count > 0 THEN
        RAISE EXCEPTION 'Cannot close period: % unposted journal entries', v_unposted_count;
    END IF;

    -- Run closing procedures
    -- 1. Calculate period-end balances
    PERFORM fin_calculate_period_balances(p_organization_id, p_period_id);

    -- 2. Create closing entries if year-end
    IF v_period.metadata->>'period_type' = 'year_end' THEN
        PERFORM fin_create_closing_entries(p_organization_id, p_period_id);
    END IF;

    -- 3. Update period status
    UPDATE core_entities
    SET metadata = jsonb_set(
        jsonb_set(
            metadata,
            '{status}',
            '"closed"'::jsonb
        ),
        '{closed_date}',
        to_jsonb(NOW()::TEXT)
    )
    WHERE id = p_period_id;

    -- 4. Roll balances to next period
    SELECT * INTO v_next_period
    FROM core_entities
    WHERE entity_type = 'fiscal_period'
    AND organization_id = p_organization_id
    AND (metadata->>'start_date')::DATE > (v_period.metadata->>'end_date')::DATE
    ORDER BY (metadata->>'start_date')::DATE
    LIMIT 1;

    IF FOUND THEN
        PERFORM fin_rollforward_balances(p_organization_id, p_period_id, v_next_period.id);
    END IF;

    v_result := jsonb_build_object(
        'success', true,
        'period_id', p_period_id,
        'closed_date', NOW(),
        'next_period_id', v_next_period.id
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FINANCIAL REPORTING FUNCTIONS
-- =============================================

-- Function: Generate trial balance
CREATE OR REPLACE FUNCTION fin_generate_trial_balance(
    p_organization_id UUID,
    p_as_of_date DATE
) RETURNS TABLE (
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    debit_balance NUMERIC,
    credit_balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.entity_code,
        e.entity_name,
        e.metadata->>'account_type',
        CASE 
            WHEN e.metadata->>'normal_balance' = 'debit' AND 
                 COALESCE(SUM(d.field_value_number), 0) > 0 
            THEN COALESCE(SUM(d.field_value_number), 0)
            WHEN e.metadata->>'normal_balance' = 'credit' AND 
                 COALESCE(SUM(d.field_value_number), 0) < 0 
            THEN -COALESCE(SUM(d.field_value_number), 0)
            ELSE 0
        END as debit_balance,
        CASE 
            WHEN e.metadata->>'normal_balance' = 'credit' AND 
                 COALESCE(SUM(d.field_value_number), 0) > 0 
            THEN COALESCE(SUM(d.field_value_number), 0)
            WHEN e.metadata->>'normal_balance' = 'debit' AND 
                 COALESCE(SUM(d.field_value_number), 0) < 0 
            THEN -COALESCE(SUM(d.field_value_number), 0)
            ELSE 0
        END as credit_balance
    FROM core_entities e
    LEFT JOIN core_dynamic_data d ON d.entity_id = e.id
        AND d.field_name LIKE 'period_balance_%'
    WHERE e.entity_type = 'gl_account'
    AND e.organization_id = p_organization_id
    AND e.metadata->>'status' = 'active'
    GROUP BY e.id, e.entity_code, e.entity_name, e.metadata
    ORDER BY e.entity_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CONSOLIDATION FUNCTIONS
-- =============================================

-- Function: Currency translation for consolidation
CREATE OR REPLACE FUNCTION fin_translate_currency(
    p_amount NUMERIC,
    p_from_currency TEXT,
    p_to_currency TEXT,
    p_rate_date DATE,
    p_rate_type TEXT DEFAULT 'closing'
) RETURNS NUMERIC AS $$
DECLARE
    v_rate NUMERIC;
BEGIN
    -- Get exchange rate
    SELECT field_value_number INTO v_rate
    FROM core_dynamic_data
    WHERE field_name = 'exchange_rate'
    AND metadata->>'from_currency' = p_from_currency
    AND metadata->>'to_currency' = p_to_currency
    AND metadata->>'rate_type' = p_rate_type
    AND (metadata->>'rate_date')::DATE = p_rate_date
    LIMIT 1;

    IF v_rate IS NULL THEN
        -- Default to 1 if same currency
        IF p_from_currency = p_to_currency THEN
            v_rate := 1;
        ELSE
            RAISE EXCEPTION 'Exchange rate not found for % to % on %', 
                p_from_currency, p_to_currency, p_rate_date;
        END IF;
    END IF;

    RETURN p_amount * v_rate;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AI-POWERED ANOMALY DETECTION
-- =============================================

-- Function: Detect journal entry anomalies
CREATE OR REPLACE FUNCTION fin_detect_journal_anomalies(
    p_organization_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    journal_id UUID,
    anomaly_type TEXT,
    severity TEXT,
    description TEXT,
    confidence_score NUMERIC
) AS $$
DECLARE
    v_avg_amount NUMERIC;
    v_std_dev NUMERIC;
BEGIN
    -- Calculate statistics for normal journal entries
    SELECT 
        AVG(total_amount),
        STDDEV(total_amount)
    INTO v_avg_amount, v_std_dev
    FROM universal_transactions
    WHERE organization_id = p_organization_id
    AND transaction_type = 'journal_entry'
    AND transaction_date >= CURRENT_DATE - p_days;

    -- Detect anomalies
    RETURN QUERY
    -- Unusual amounts
    SELECT 
        t.id,
        'unusual_amount'::TEXT,
        CASE 
            WHEN ABS(t.total_amount - v_avg_amount) > 3 * v_std_dev THEN 'high'
            WHEN ABS(t.total_amount - v_avg_amount) > 2 * v_std_dev THEN 'medium'
            ELSE 'low'
        END,
        'Journal amount is ' || 
        ROUND(ABS(t.total_amount - v_avg_amount) / NULLIF(v_std_dev, 0), 1) || 
        ' standard deviations from average',
        0.85
    FROM universal_transactions t
    WHERE t.organization_id = p_organization_id
    AND t.transaction_type = 'journal_entry'
    AND t.transaction_date >= CURRENT_DATE - p_days
    AND ABS(t.total_amount - v_avg_amount) > 2 * v_std_dev

    UNION ALL

    -- Weekend/holiday entries
    SELECT 
        t.id,
        'unusual_timing'::TEXT,
        'medium'::TEXT,
        'Journal entry posted on ' || 
        TO_CHAR(t.transaction_date, 'Day'),
        0.75
    FROM universal_transactions t
    WHERE t.organization_id = p_organization_id
    AND t.transaction_type = 'journal_entry'
    AND t.transaction_date >= CURRENT_DATE - p_days
    AND EXTRACT(DOW FROM t.transaction_date) IN (0, 6)

    UNION ALL

    -- Round number patterns (potential fraud indicator)
    SELECT 
        t.id,
        'round_numbers'::TEXT,
        'low'::TEXT,
        'Multiple round number amounts in journal',
        0.65
    FROM universal_transactions t
    WHERE t.organization_id = p_organization_id
    AND t.transaction_type = 'journal_entry'
    AND t.transaction_date >= CURRENT_DATE - p_days
    AND EXISTS (
        SELECT 1 
        FROM universal_transaction_lines l
        WHERE l.transaction_id = t.id
        AND MOD(l.line_amount, 1000) = 0
        GROUP BY l.transaction_id
        HAVING COUNT(*) > 2
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function: Calculate period balances
CREATE OR REPLACE FUNCTION fin_calculate_period_balances(
    p_organization_id UUID,
    p_period_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Implementation would calculate and store period-end balances
    -- This is a placeholder for the actual calculation logic
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Create closing entries
CREATE OR REPLACE FUNCTION fin_create_closing_entries(
    p_organization_id UUID,
    p_period_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Implementation would create year-end closing entries
    -- Moving P&L accounts to retained earnings
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Roll forward balances
CREATE OR REPLACE FUNCTION fin_rollforward_balances(
    p_organization_id UUID,
    p_from_period_id UUID,
    p_to_period_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Implementation would roll forward balance sheet accounts
    -- to the next period
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;