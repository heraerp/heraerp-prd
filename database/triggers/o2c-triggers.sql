-- =============================================
-- HERA O2C (Order-to-Cash) TRIGGERS v1
-- Business logic & validation for revenue cycle
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ORDER VALIDATION & CREDIT CHECK
-- =============================================

-- Function: Validate order and perform credit check
CREATE OR REPLACE FUNCTION o2c_validate_order()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_record RECORD;
    v_credit_limit NUMERIC;
    v_outstanding_amount NUMERIC;
    v_order_amount NUMERIC;
    v_credit_status TEXT;
BEGIN
    -- Only process sales orders
    IF NEW.transaction_type != 'sales_order' THEN
        RETURN NEW;
    END IF;

    -- Get customer details
    SELECT e.*, 
           (e.metadata->>'credit_limit')::NUMERIC as credit_limit,
           (e.metadata->>'payment_terms') as payment_terms,
           (e.metadata->>'credit_status') as credit_status
    INTO v_customer_record
    FROM core_entities e
    WHERE e.id = NEW.from_entity_id
    AND e.entity_type = 'customer'
    AND e.organization_id = NEW.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Customer not found for order';
    END IF;

    v_credit_limit := COALESCE(v_customer_record.credit_limit, 0);
    v_credit_status := COALESCE(v_customer_record.credit_status, 'active');
    v_order_amount := COALESCE(NEW.total_amount, 0);

    -- Check if customer is blocked
    IF v_credit_status = 'blocked' THEN
        NEW.metadata = jsonb_set(
            COALESCE(NEW.metadata, '{}'::jsonb),
            '{credit_check_status}',
            '"failed"'::jsonb
        );
        NEW.metadata = jsonb_set(
            NEW.metadata,
            '{hold_reason}',
            '"Customer credit blocked"'::jsonb
        );
        RAISE NOTICE 'Order placed on hold: Customer credit blocked';
        RETURN NEW;
    END IF;

    -- Calculate outstanding amount (unpaid invoices)
    SELECT COALESCE(SUM(t.total_amount), 0) - 
           COALESCE(SUM(p.paid_amount), 0)
    INTO v_outstanding_amount
    FROM universal_transactions t
    LEFT JOIN LATERAL (
        SELECT SUM(pt.total_amount) as paid_amount
        FROM universal_transactions pt
        WHERE pt.transaction_type = 'customer_payment'
        AND pt.reference_entity_id = t.id
        AND pt.organization_id = NEW.organization_id
    ) p ON true
    WHERE t.transaction_type = 'customer_invoice'
    AND t.from_entity_id = NEW.from_entity_id
    AND t.organization_id = NEW.organization_id
    AND t.metadata->>'status' != 'cancelled';

    -- Perform credit check
    IF v_credit_limit > 0 AND (v_outstanding_amount + v_order_amount) > v_credit_limit THEN
        NEW.metadata = jsonb_set(
            COALESCE(NEW.metadata, '{}'::jsonb),
            '{credit_check_status}',
            '"failed"'::jsonb
        );
        NEW.metadata = jsonb_set(
            NEW.metadata,
            '{hold_reason}',
            '"Credit limit exceeded"'::jsonb
        );
        NEW.metadata = jsonb_set(
            NEW.metadata,
            '{credit_details}',
            jsonb_build_object(
                'credit_limit', v_credit_limit,
                'outstanding', v_outstanding_amount,
                'order_amount', v_order_amount,
                'total_exposure', v_outstanding_amount + v_order_amount
            )
        );
        RAISE NOTICE 'Order placed on hold: Credit limit exceeded';
    ELSE
        NEW.metadata = jsonb_set(
            COALESCE(NEW.metadata, '{}'::jsonb),
            '{credit_check_status}',
            '"passed"'::jsonb
        );
        NEW.metadata = jsonb_set(
            NEW.metadata,
            '{credit_details}',
            jsonb_build_object(
                'credit_limit', v_credit_limit,
                'outstanding', v_outstanding_amount,
                'order_amount', v_order_amount,
                'available_credit', v_credit_limit - v_outstanding_amount
            )
        );
    END IF;

    -- Set order status based on credit check
    IF NEW.metadata->>'credit_check_status' = 'passed' THEN
        NEW.metadata = jsonb_set(NEW.metadata, '{status}', '"approved"'::jsonb);
    ELSE
        NEW.metadata = jsonb_set(NEW.metadata, '{status}', '"on_hold"'::jsonb);
    END IF;

    -- Set payment due date based on terms
    IF v_customer_record.payment_terms IS NOT NULL THEN
        NEW.metadata = jsonb_set(
            NEW.metadata,
            '{payment_terms}',
            to_jsonb(v_customer_record.payment_terms)
        );
        
        -- Calculate due date
        IF v_customer_record.payment_terms = 'NET30' THEN
            NEW.metadata = jsonb_set(
                NEW.metadata,
                '{payment_due_date}',
                to_jsonb((NEW.transaction_date::DATE + INTERVAL '30 days')::TEXT)
            );
        ELSIF v_customer_record.payment_terms = 'NET60' THEN
            NEW.metadata = jsonb_set(
                NEW.metadata,
                '{payment_due_date}',
                to_jsonb((NEW.transaction_date::DATE + INTERVAL '60 days')::TEXT)
            );
        ELSIF v_customer_record.payment_terms = 'COD' THEN
            NEW.metadata = jsonb_set(
                NEW.metadata,
                '{payment_due_date}',
                to_jsonb(NEW.transaction_date::TEXT)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order validation
CREATE TRIGGER trg_o2c_validate_order
    BEFORE INSERT ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION o2c_validate_order();

-- =============================================
-- AUTOMATIC INVOICING ON DELIVERY
-- =============================================

-- Function: Create invoice on delivery confirmation
CREATE OR REPLACE FUNCTION o2c_auto_invoice_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
    v_order_record RECORD;
    v_invoice_number TEXT;
    v_invoice_id UUID;
BEGIN
    -- Only process delivery confirmations
    IF NEW.transaction_type != 'order_delivery' THEN
        RETURN NEW;
    END IF;

    -- Get the original order
    SELECT * INTO v_order_record
    FROM universal_transactions
    WHERE id = NEW.reference_entity_id
    AND transaction_type = 'sales_order'
    AND organization_id = NEW.organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original order not found for delivery';
    END IF;

    -- Generate invoice number
    v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                       LPAD(NEXTVAL('invoice_sequence')::TEXT, 6, '0');

    -- Create invoice
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        transaction_code,
        smart_code,
        transaction_date,
        from_entity_id,
        to_entity_id,
        reference_entity_id,
        total_amount,
        metadata
    ) VALUES (
        NEW.organization_id,
        'customer_invoice',
        v_invoice_number,
        'HERA.O2C.INVOICE.CREATE.V1',
        NOW(),
        v_order_record.from_entity_id,
        v_order_record.to_entity_id,
        v_order_record.id,
        v_order_record.total_amount,
        jsonb_build_object(
            'invoice_number', v_invoice_number,
            'invoice_date', NOW()::DATE,
            'due_date', (NOW() + (COALESCE(v_order_record.metadata->>'payment_terms_days', '30') || ' days')::INTERVAL)::DATE,
            'order_number', v_order_record.transaction_code,
            'delivery_date', NEW.metadata->>'delivery_date',
            'status', 'pending',
            'auto_generated', true,
            'billing_type', 'on_delivery'
        )
    ) RETURNING id INTO v_invoice_id;

    -- Copy line items from order to invoice
    INSERT INTO universal_transaction_lines (
        transaction_id,
        line_number,
        line_entity_id,
        quantity,
        unit_price,
        line_amount,
        metadata
    )
    SELECT 
        v_invoice_id,
        line_number,
        line_entity_id,
        quantity,
        unit_price,
        line_amount,
        metadata
    FROM universal_transaction_lines
    WHERE transaction_id = v_order_record.id;

    -- Update delivery record with invoice reference
    NEW.metadata = jsonb_set(
        COALESCE(NEW.metadata, '{}'::jsonb),
        '{invoice_id}',
        to_jsonb(v_invoice_id::TEXT)
    );
    
    NEW.metadata = jsonb_set(
        NEW.metadata,
        '{invoice_number}',
        to_jsonb(v_invoice_number)
    );

    -- Update order status
    UPDATE universal_transactions
    SET metadata = jsonb_set(
        metadata,
        '{fulfillment_status}',
        '"delivered"'::jsonb
    )
    WHERE id = v_order_record.id;

    RAISE NOTICE 'Invoice % automatically created for delivery', v_invoice_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic invoicing
CREATE TRIGGER trg_o2c_auto_invoice
    AFTER INSERT ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION o2c_auto_invoice_on_delivery();

-- =============================================
-- PAYMENT APPLICATION & MATCHING
-- =============================================

-- Function: Apply payment to invoices
CREATE OR REPLACE FUNCTION o2c_apply_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_remaining_amount NUMERIC;
    v_invoice RECORD;
BEGIN
    -- Only process customer payments
    IF NEW.transaction_type != 'customer_payment' THEN
        RETURN NEW;
    END IF;

    v_remaining_amount := NEW.total_amount;

    -- If specific invoice referenced, apply to that first
    IF NEW.reference_entity_id IS NOT NULL THEN
        SELECT * INTO v_invoice
        FROM universal_transactions
        WHERE id = NEW.reference_entity_id
        AND transaction_type = 'customer_invoice'
        AND organization_id = NEW.organization_id;

        IF FOUND THEN
            -- Calculate unpaid amount
            DECLARE
                v_paid_amount NUMERIC;
                v_unpaid_amount NUMERIC;
                v_apply_amount NUMERIC;
            BEGIN
                SELECT COALESCE(SUM(total_amount), 0) INTO v_paid_amount
                FROM universal_transactions
                WHERE transaction_type = 'customer_payment'
                AND reference_entity_id = v_invoice.id
                AND id != NEW.id;

                v_unpaid_amount := v_invoice.total_amount - v_paid_amount;
                v_apply_amount := LEAST(v_remaining_amount, v_unpaid_amount);

                IF v_apply_amount > 0 THEN
                    -- Create payment application record
                    INSERT INTO universal_transaction_lines (
                        transaction_id,
                        line_number,
                        line_entity_id,
                        line_amount,
                        metadata
                    ) VALUES (
                        NEW.id,
                        1,
                        v_invoice.id,
                        v_apply_amount,
                        jsonb_build_object(
                            'invoice_number', v_invoice.transaction_code,
                            'invoice_amount', v_invoice.total_amount,
                            'previously_paid', v_paid_amount,
                            'applied_amount', v_apply_amount,
                            'remaining_balance', v_unpaid_amount - v_apply_amount
                        )
                    );

                    v_remaining_amount := v_remaining_amount - v_apply_amount;

                    -- Update invoice status if fully paid
                    IF v_unpaid_amount - v_apply_amount <= 0 THEN
                        UPDATE universal_transactions
                        SET metadata = jsonb_set(
                            metadata,
                            '{status}',
                            '"paid"'::jsonb
                        )
                        WHERE id = v_invoice.id;
                    END IF;
                END IF;
            END;
        END IF;
    END IF;

    -- Apply remaining amount to oldest unpaid invoices (FIFO)
    IF v_remaining_amount > 0 THEN
        FOR v_invoice IN
            SELECT t.*, 
                   t.total_amount - COALESCE(p.paid_amount, 0) as unpaid_amount
            FROM universal_transactions t
            LEFT JOIN LATERAL (
                SELECT SUM(pt.total_amount) as paid_amount
                FROM universal_transactions pt
                WHERE pt.transaction_type = 'customer_payment'
                AND pt.reference_entity_id = t.id
            ) p ON true
            WHERE t.transaction_type = 'customer_invoice'
            AND t.from_entity_id = NEW.from_entity_id
            AND t.organization_id = NEW.organization_id
            AND t.metadata->>'status' != 'paid'
            AND t.metadata->>'status' != 'cancelled'
            AND t.total_amount - COALESCE(p.paid_amount, 0) > 0
            ORDER BY t.transaction_date
        LOOP
            DECLARE
                v_apply_amount NUMERIC;
            BEGIN
                v_apply_amount := LEAST(v_remaining_amount, v_invoice.unpaid_amount);

                IF v_apply_amount > 0 THEN
                    -- Create payment application record
                    INSERT INTO universal_transaction_lines (
                        transaction_id,
                        line_number,
                        line_entity_id,
                        line_amount,
                        metadata
                    ) VALUES (
                        NEW.id,
                        (SELECT COALESCE(MAX(line_number), 0) + 1 
                         FROM universal_transaction_lines 
                         WHERE transaction_id = NEW.id),
                        v_invoice.id,
                        v_apply_amount,
                        jsonb_build_object(
                            'invoice_number', v_invoice.transaction_code,
                            'invoice_amount', v_invoice.total_amount,
                            'applied_amount', v_apply_amount,
                            'auto_applied', true,
                            'remaining_balance', v_invoice.unpaid_amount - v_apply_amount
                        )
                    );

                    v_remaining_amount := v_remaining_amount - v_apply_amount;

                    -- Update invoice status if fully paid
                    IF v_invoice.unpaid_amount - v_apply_amount <= 0 THEN
                        UPDATE universal_transactions
                        SET metadata = jsonb_set(
                            metadata,
                            '{status}',
                            '"paid"'::jsonb
                        )
                        WHERE id = v_invoice.id;
                    END IF;

                    EXIT WHEN v_remaining_amount <= 0;
                END IF;
            END;
        END LOOP;
    END IF;

    -- Update payment metadata
    NEW.metadata = jsonb_set(
        COALESCE(NEW.metadata, '{}'::jsonb),
        '{unapplied_amount}',
        to_jsonb(v_remaining_amount)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment application
CREATE TRIGGER trg_o2c_apply_payment
    AFTER INSERT ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION o2c_apply_payment();

-- =============================================
-- REVENUE RECOGNITION
-- =============================================

-- Function: Automatic revenue recognition
CREATE OR REPLACE FUNCTION o2c_recognize_revenue()
RETURNS TRIGGER AS $$
DECLARE
    v_recognition_method TEXT;
    v_gl_account_id UUID;
BEGIN
    -- Process invoices and specific revenue recognition transactions
    IF NEW.transaction_type NOT IN ('customer_invoice', 'revenue_recognition') THEN
        RETURN NEW;
    END IF;

    -- Get recognition method from smart code
    IF NEW.smart_code LIKE '%POINT%' THEN
        v_recognition_method := 'point_in_time';
    ELSIF NEW.smart_code LIKE '%OVERTIME%' THEN
        v_recognition_method := 'over_time';
    ELSIF NEW.smart_code LIKE '%MILESTONE%' THEN
        v_recognition_method := 'milestone';
    ELSIF NEW.smart_code LIKE '%SUBSCRIPTION%' THEN
        v_recognition_method := 'subscription';
    ELSE
        v_recognition_method := 'point_in_time'; -- Default
    END IF;

    -- Get revenue GL account
    SELECT id INTO v_gl_account_id
    FROM core_entities
    WHERE entity_type = 'gl_account'
    AND entity_code = '4000' -- Revenue account
    AND organization_id = NEW.organization_id
    LIMIT 1;

    -- Handle based on recognition method
    IF v_recognition_method = 'point_in_time' THEN
        -- Recognize immediately on delivery
        IF NEW.metadata->>'delivery_status' = 'delivered' OR 
           NEW.transaction_type = 'revenue_recognition' THEN
            
            INSERT INTO universal_transactions (
                organization_id,
                transaction_type,
                transaction_code,
                smart_code,
                transaction_date,
                reference_entity_id,
                to_entity_id,
                total_amount,
                metadata
            ) VALUES (
                NEW.organization_id,
                'journal_entry',
                'JE-REV-' || NEW.transaction_code,
                'HERA.O2C.REVENUE.RECOGNIZE.V1',
                NOW(),
                NEW.id,
                v_gl_account_id,
                NEW.total_amount,
                jsonb_build_object(
                    'entry_type', 'revenue_recognition',
                    'recognition_method', v_recognition_method,
                    'source_document', NEW.transaction_code,
                    'gl_posting', jsonb_build_object(
                        'debit', jsonb_build_object(
                            'account', '1200', -- Accounts Receivable
                            'amount', NEW.total_amount
                        ),
                        'credit', jsonb_build_object(
                            'account', '4000', -- Revenue
                            'amount', NEW.total_amount
                        )
                    )
                )
            );

            -- Update invoice metadata
            UPDATE universal_transactions
            SET metadata = jsonb_set(
                metadata,
                '{revenue_recognized}',
                'true'::jsonb
            )
            WHERE id = NEW.id;
        END IF;

    ELSIF v_recognition_method = 'subscription' THEN
        -- Create deferred revenue and recognition schedule
        DECLARE
            v_period_days INTEGER;
            v_daily_amount NUMERIC;
        BEGIN
            -- Get subscription period (default 30 days)
            v_period_days := COALESCE((NEW.metadata->>'subscription_days')::INTEGER, 30);
            v_daily_amount := NEW.total_amount / v_period_days;

            -- Create deferred revenue entry
            INSERT INTO universal_transactions (
                organization_id,
                transaction_type,
                transaction_code,
                smart_code,
                transaction_date,
                reference_entity_id,
                total_amount,
                metadata
            ) VALUES (
                NEW.organization_id,
                'journal_entry',
                'JE-DEF-' || NEW.transaction_code,
                'HERA.O2C.REVENUE.DEFER.V1',
                NOW(),
                NEW.id,
                NEW.total_amount,
                jsonb_build_object(
                    'entry_type', 'deferred_revenue',
                    'recognition_method', v_recognition_method,
                    'period_days', v_period_days,
                    'daily_amount', v_daily_amount,
                    'start_date', NOW()::DATE,
                    'end_date', (NOW() + (v_period_days || ' days')::INTERVAL)::DATE,
                    'gl_posting', jsonb_build_object(
                        'debit', jsonb_build_object(
                            'account', '1200', -- Accounts Receivable
                            'amount', NEW.total_amount
                        ),
                        'credit', jsonb_build_object(
                            'account', '2400', -- Deferred Revenue
                            'amount', NEW.total_amount
                        )
                    )
                )
            );
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for revenue recognition
CREATE TRIGGER trg_o2c_revenue_recognition
    AFTER INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION o2c_recognize_revenue();

-- =============================================
-- COLLECTION AUTOMATION
-- =============================================

-- Function: Automatic dunning process
CREATE OR REPLACE FUNCTION o2c_auto_dunning()
RETURNS void AS $$
DECLARE
    v_overdue_invoice RECORD;
    v_days_overdue INTEGER;
    v_dunning_level INTEGER;
BEGIN
    -- Process overdue invoices
    FOR v_overdue_invoice IN
        SELECT t.*, 
               c.entity_name as customer_name,
               c.metadata->>'email' as customer_email,
               CURRENT_DATE - (t.metadata->>'due_date')::DATE as days_overdue,
               COALESCE((t.metadata->>'dunning_level')::INTEGER, 0) as current_dunning_level
        FROM universal_transactions t
        JOIN core_entities c ON c.id = t.from_entity_id
        WHERE t.transaction_type = 'customer_invoice'
        AND t.metadata->>'status' = 'pending'
        AND (t.metadata->>'due_date')::DATE < CURRENT_DATE
        AND COALESCE((t.metadata->>'dunning_hold')::BOOLEAN, false) = false
    LOOP
        v_days_overdue := v_overdue_invoice.days_overdue;
        v_dunning_level := v_overdue_invoice.current_dunning_level;

        -- Determine dunning level based on days overdue
        IF v_days_overdue >= 90 AND v_dunning_level < 4 THEN
            v_dunning_level := 4; -- Final notice
        ELSIF v_days_overdue >= 60 AND v_dunning_level < 3 THEN
            v_dunning_level := 3; -- Third reminder
        ELSIF v_days_overdue >= 30 AND v_dunning_level < 2 THEN
            v_dunning_level := 2; -- Second reminder
        ELSIF v_days_overdue >= 15 AND v_dunning_level < 1 THEN
            v_dunning_level := 1; -- First reminder
        ELSE
            CONTINUE; -- Skip if not due for next level
        END IF;

        -- Create dunning record
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            transaction_code,
            smart_code,
            transaction_date,
            from_entity_id,
            reference_entity_id,
            metadata
        ) VALUES (
            v_overdue_invoice.organization_id,
            'dunning_notice',
            'DUN-' || v_overdue_invoice.transaction_code || '-L' || v_dunning_level,
            'HERA.O2C.COLLECTION.DUNNING.V1',
            NOW(),
            v_overdue_invoice.from_entity_id,
            v_overdue_invoice.id,
            jsonb_build_object(
                'dunning_level', v_dunning_level,
                'days_overdue', v_days_overdue,
                'invoice_number', v_overdue_invoice.transaction_code,
                'invoice_amount', v_overdue_invoice.total_amount,
                'customer_name', v_overdue_invoice.customer_name,
                'customer_email', v_overdue_invoice.customer_email,
                'template', CASE v_dunning_level
                    WHEN 1 THEN 'friendly_reminder'
                    WHEN 2 THEN 'second_notice'
                    WHEN 3 THEN 'urgent_notice'
                    WHEN 4 THEN 'final_notice'
                END,
                'sent_date', NOW()
            )
        );

        -- Update invoice with new dunning level
        UPDATE universal_transactions
        SET metadata = jsonb_set(
            jsonb_set(
                metadata,
                '{dunning_level}',
                to_jsonb(v_dunning_level)
            ),
            '{last_dunning_date}',
            to_jsonb(NOW()::TEXT)
        )
        WHERE id = v_overdue_invoice.id;

        -- If final notice, flag for collection agency
        IF v_dunning_level = 4 THEN
            UPDATE universal_transactions
            SET metadata = jsonb_set(
                metadata,
                '{collection_status}',
                '"pending_agency"'::jsonb
            )
            WHERE id = v_overdue_invoice.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AI-POWERED CREDIT SCORING
-- =============================================

-- Function: Calculate AI credit score
CREATE OR REPLACE FUNCTION o2c_calculate_credit_score(
    p_customer_id UUID,
    p_organization_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_payment_history RECORD;
    v_score NUMERIC := 500; -- Base score
    v_total_invoices INTEGER;
    v_on_time_payments INTEGER;
    v_late_payments INTEGER;
    v_avg_days_to_pay NUMERIC;
    v_total_business NUMERIC;
    v_disputes INTEGER;
BEGIN
    -- Get payment history statistics
    SELECT 
        COUNT(DISTINCT i.id) as total_invoices,
        COUNT(DISTINCT CASE 
            WHEN p.metadata->>'payment_date' <= i.metadata->>'due_date' 
            THEN i.id 
        END) as on_time_payments,
        COUNT(DISTINCT CASE 
            WHEN p.metadata->>'payment_date' > i.metadata->>'due_date' 
            THEN i.id 
        END) as late_payments,
        AVG(
            EXTRACT(DAY FROM 
                (p.metadata->>'payment_date')::TIMESTAMP - 
                (i.metadata->>'due_date')::TIMESTAMP
            )
        ) as avg_days_to_pay,
        SUM(i.total_amount) as total_business,
        COUNT(DISTINCT CASE 
            WHEN i.metadata->>'dispute_status' IS NOT NULL 
            THEN i.id 
        END) as disputes
    INTO v_payment_history
    FROM universal_transactions i
    LEFT JOIN universal_transactions p ON p.reference_entity_id = i.id 
        AND p.transaction_type = 'customer_payment'
    WHERE i.transaction_type = 'customer_invoice'
    AND i.from_entity_id = p_customer_id
    AND i.organization_id = p_organization_id;

    -- Calculate score components
    IF v_payment_history.total_invoices > 0 THEN
        -- Payment performance (40% weight)
        v_score := v_score + (v_payment_history.on_time_payments::NUMERIC / 
                              v_payment_history.total_invoices::NUMERIC * 200);
        
        -- Late payment penalty
        v_score := v_score - (v_payment_history.late_payments * 20);
        
        -- Average days to pay impact
        IF v_payment_history.avg_days_to_pay IS NOT NULL THEN
            IF v_payment_history.avg_days_to_pay < 0 THEN
                v_score := v_score + 50; -- Early payment bonus
            ELSIF v_payment_history.avg_days_to_pay > 30 THEN
                v_score := v_score - (v_payment_history.avg_days_to_pay - 30) * 2;
            END IF;
        END IF;
        
        -- Business volume bonus (max 100 points)
        v_score := v_score + LEAST(v_payment_history.total_business / 10000, 100);
        
        -- Dispute penalty
        v_score := v_score - (v_payment_history.disputes * 30);
    END IF;

    -- Ensure score is within bounds [300, 850]
    v_score := GREATEST(300, LEAST(850, v_score));

    RETURN ROUND(v_score);
END;
$$ LANGUAGE plpgsql;

-- Function: Update customer credit scores
CREATE OR REPLACE FUNCTION o2c_update_credit_scores()
RETURNS void AS $$
DECLARE
    v_customer RECORD;
    v_new_score NUMERIC;
    v_risk_rating TEXT;
BEGIN
    -- Update credit scores for all active customers
    FOR v_customer IN
        SELECT DISTINCT c.*
        FROM core_entities c
        JOIN universal_transactions t ON t.from_entity_id = c.id
        WHERE c.entity_type = 'customer'
        AND c.metadata->>'status' = 'active'
        AND t.transaction_type IN ('customer_invoice', 'customer_payment')
        AND t.transaction_date > CURRENT_DATE - INTERVAL '12 months'
    LOOP
        -- Calculate new score
        v_new_score := o2c_calculate_credit_score(
            v_customer.id, 
            v_customer.organization_id
        );
        
        -- Determine risk rating
        v_risk_rating := CASE
            WHEN v_new_score >= 750 THEN 'excellent'
            WHEN v_new_score >= 650 THEN 'good'
            WHEN v_new_score >= 550 THEN 'fair'
            WHEN v_new_score >= 450 THEN 'poor'
            ELSE 'high_risk'
        END;

        -- Update customer entity
        UPDATE core_entities
        SET metadata = jsonb_set(
            jsonb_set(
                metadata,
                '{credit_score}',
                to_jsonb(v_new_score)
            ),
            '{risk_rating}',
            to_jsonb(v_risk_rating)
        )
        WHERE id = v_customer.id;

        -- Update credit limit based on score
        IF v_new_score >= 750 THEN
            UPDATE core_entities
            SET metadata = jsonb_set(
                metadata,
                '{credit_limit}',
                to_jsonb(GREATEST(
                    COALESCE((metadata->>'credit_limit')::NUMERIC, 0),
                    50000
                ))
            )
            WHERE id = v_customer.id;
        ELSIF v_new_score < 450 THEN
            -- Flag for credit review
            UPDATE core_entities
            SET metadata = jsonb_set(
                metadata,
                '{credit_status}',
                '"review_required"'::jsonb
            )
            WHERE id = v_customer.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SCHEDULED JOBS
-- =============================================

-- Create sequence for invoice numbers if not exists
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1000;

-- Schedule daily dunning process (using pg_cron or similar)
-- SELECT cron.schedule('o2c-daily-dunning', '0 9 * * *', 'SELECT o2c_auto_dunning();');

-- Schedule weekly credit score updates
-- SELECT cron.schedule('o2c-weekly-credit-scores', '0 2 * * 0', 'SELECT o2c_update_credit_scores();');

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Function: Calculate DSO (Days Sales Outstanding)
CREATE OR REPLACE FUNCTION o2c_calculate_dso(
    p_organization_id UUID,
    p_period_days INTEGER DEFAULT 90
) RETURNS NUMERIC AS $$
DECLARE
    v_total_receivables NUMERIC;
    v_total_sales NUMERIC;
    v_dso NUMERIC;
BEGIN
    -- Calculate total outstanding receivables
    SELECT COALESCE(SUM(i.total_amount - COALESCE(p.paid_amount, 0)), 0)
    INTO v_total_receivables
    FROM universal_transactions i
    LEFT JOIN LATERAL (
        SELECT SUM(pt.total_amount) as paid_amount
        FROM universal_transactions pt
        WHERE pt.transaction_type = 'customer_payment'
        AND pt.reference_entity_id = i.id
    ) p ON true
    WHERE i.transaction_type = 'customer_invoice'
    AND i.organization_id = p_organization_id
    AND i.metadata->>'status' != 'cancelled'
    AND i.total_amount > COALESCE(p.paid_amount, 0);

    -- Calculate total sales for period
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_sales
    FROM universal_transactions
    WHERE transaction_type = 'customer_invoice'
    AND organization_id = p_organization_id
    AND transaction_date >= CURRENT_DATE - (p_period_days || ' days')::INTERVAL
    AND metadata->>'status' != 'cancelled';

    -- Calculate DSO
    IF v_total_sales > 0 THEN
        v_dso := (v_total_receivables / v_total_sales) * p_period_days;
    ELSE
        v_dso := 0;
    END IF;

    RETURN ROUND(v_dso, 1);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;