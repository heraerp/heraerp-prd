-- =============================================
-- HERA HCM (Human Capital Management) TRIGGERS
-- Business logic, validation, and automation
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- EMPLOYEE LIFECYCLE TRIGGERS
-- =============================================

-- Trigger: Auto-generate employee ID and create related records
CREATE OR REPLACE FUNCTION hcm_employee_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_code TEXT;
    v_leave_types JSONB;
    v_country_code TEXT;
BEGIN
    -- Generate employee code if not provided
    IF NEW.entity_type = 'employee' AND NEW.smart_code LIKE 'HERA.HCM.EMP.%' THEN
        IF NEW.entity_code IS NULL THEN
            v_employee_code := 'EMP-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                               LPAD(COALESCE(
                                   (SELECT COUNT(*) + 1 
                                    FROM core_entities 
                                    WHERE entity_type = 'employee' 
                                    AND organization_id = NEW.organization_id), 1
                               )::TEXT, 5, '0');
            NEW.entity_code := v_employee_code;
        END IF;

        -- Create default leave balances based on country
        v_country_code := COALESCE(NEW.metadata->>'country', 'US');
        
        -- Set leave entitlements based on country
        CASE v_country_code
            WHEN 'US' THEN
                v_leave_types := '[
                    {"type": "annual", "days": 15, "accrual_rate": 1.25},
                    {"type": "sick", "days": 10, "accrual_rate": 0.83},
                    {"type": "personal", "days": 3, "accrual_rate": 0}
                ]'::JSONB;
            WHEN 'UK' THEN
                v_leave_types := '[
                    {"type": "annual", "days": 28, "accrual_rate": 2.33},
                    {"type": "sick", "days": 0, "accrual_rate": 0}
                ]'::JSONB;
            WHEN 'AE' THEN
                v_leave_types := '[
                    {"type": "annual", "days": 30, "accrual_rate": 2.5},
                    {"type": "sick", "days": 15, "accrual_rate": 0}
                ]'::JSONB;
            ELSE
                v_leave_types := '[
                    {"type": "annual", "days": 21, "accrual_rate": 1.75},
                    {"type": "sick", "days": 10, "accrual_rate": 0}
                ]'::JSONB;
        END CASE;

        -- Store leave entitlements in metadata
        NEW.metadata := COALESCE(NEW.metadata, '{}'::JSONB) || 
                       jsonb_build_object('leave_entitlements', v_leave_types);

        -- Log onboarding event
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            transaction_code,
            smart_code,
            transaction_date,
            from_entity_id,
            metadata
        ) VALUES (
            NEW.organization_id,
            'employee_onboarding',
            'ONBOARD-' || NEW.entity_code,
            'HERA.HCM.EMP.ONBOARD.V1',
            NOW(),
            NEW.id,
            jsonb_build_object(
                'employee_code', NEW.entity_code,
                'hire_date', COALESCE(NEW.metadata->>'hire_date', NOW()::DATE::TEXT),
                'onboarding_status', 'initiated'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_employee_onboarding
    BEFORE INSERT ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION hcm_employee_onboarding();

-- =============================================
-- PAYROLL CALCULATION TRIGGERS
-- =============================================

-- Trigger: Calculate payroll components
CREATE OR REPLACE FUNCTION hcm_calculate_payroll()
RETURNS TRIGGER AS $$
DECLARE
    v_base_salary NUMERIC;
    v_allowances NUMERIC;
    v_deductions NUMERIC;
    v_tax_amount NUMERIC;
    v_net_pay NUMERIC;
    v_employee_data JSONB;
    v_tax_rate NUMERIC;
    v_country_code TEXT;
BEGIN
    -- Only process payroll transactions
    IF NEW.transaction_type = 'payroll_run' AND NEW.smart_code = 'HERA.HCM.PAY.RUN.V1' THEN
        
        -- Get employee data
        SELECT metadata INTO v_employee_data
        FROM core_entities
        WHERE id = NEW.from_entity_id
        AND organization_id = NEW.organization_id;

        -- Get salary components
        v_base_salary := COALESCE((v_employee_data->>'base_salary')::NUMERIC, 0);
        v_country_code := COALESCE(v_employee_data->>'country', 'US');

        -- Calculate allowances
        SELECT COALESCE(SUM((value->>'amount')::NUMERIC), 0) INTO v_allowances
        FROM jsonb_array_elements(COALESCE(v_employee_data->'allowances', '[]'::JSONB)) AS value
        WHERE (value->>'active')::BOOLEAN = true;

        -- Calculate deductions
        SELECT COALESCE(SUM((value->>'amount')::NUMERIC), 0) INTO v_deductions
        FROM jsonb_array_elements(COALESCE(v_employee_data->'deductions', '[]'::JSONB)) AS value
        WHERE (value->>'active')::BOOLEAN = true;

        -- Calculate tax based on country
        v_tax_rate := CASE v_country_code
            WHEN 'US' THEN 0.22  -- Simplified federal tax
            WHEN 'UK' THEN 0.20  -- Basic rate
            WHEN 'AE' THEN 0.00  -- No income tax
            WHEN 'IN' THEN 0.10  -- Basic slab
            ELSE 0.15
        END;

        v_tax_amount := (v_base_salary + v_allowances) * v_tax_rate;
        v_net_pay := v_base_salary + v_allowances - v_deductions - v_tax_amount;

        -- Update transaction with calculated values
        NEW.metadata := COALESCE(NEW.metadata, '{}'::JSONB) || jsonb_build_object(
            'gross_pay', v_base_salary + v_allowances,
            'total_deductions', v_deductions + v_tax_amount,
            'tax_amount', v_tax_amount,
            'net_pay', v_net_pay,
            'calculation_date', NOW()
        );

        NEW.total_amount := v_net_pay;

        -- Create payslip
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            transaction_code,
            smart_code,
            transaction_date,
            from_entity_id,
            reference_entity_id,
            total_amount,
            metadata
        ) VALUES (
            NEW.organization_id,
            'payslip',
            'PAYSLIP-' || NEW.from_entity_id || '-' || TO_CHAR(NOW(), 'YYYYMM'),
            'HERA.HCM.PAY.SLIP.V1',
            NOW(),
            NEW.from_entity_id,
            NEW.id,
            v_net_pay,
            jsonb_build_object(
                'pay_period', NEW.metadata->>'pay_period',
                'gross_pay', v_base_salary + v_allowances,
                'base_salary', v_base_salary,
                'allowances', v_allowances,
                'deductions', v_deductions,
                'tax_amount', v_tax_amount,
                'net_pay', v_net_pay
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_calculate_payroll
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION hcm_calculate_payroll();

-- =============================================
-- TIME & ATTENDANCE TRIGGERS
-- =============================================

-- Trigger: Calculate work hours and overtime
CREATE OR REPLACE FUNCTION hcm_calculate_attendance()
RETURNS TRIGGER AS $$
DECLARE
    v_clock_in TIMESTAMP;
    v_clock_out TIMESTAMP;
    v_work_hours NUMERIC;
    v_overtime_hours NUMERIC;
    v_standard_hours NUMERIC := 8;
    v_overtime_rate NUMERIC := 1.5;
BEGIN
    -- Process time clock entries
    IF NEW.transaction_type = 'time_clock' AND NEW.smart_code = 'HERA.HCM.TIME.CLOCK.V1' THEN
        
        v_clock_in := (NEW.metadata->>'clock_in')::TIMESTAMP;
        v_clock_out := (NEW.metadata->>'clock_out')::TIMESTAMP;

        -- Calculate work hours
        IF v_clock_in IS NOT NULL AND v_clock_out IS NOT NULL THEN
            v_work_hours := EXTRACT(EPOCH FROM (v_clock_out - v_clock_in)) / 3600;
            
            -- Calculate overtime
            v_overtime_hours := GREATEST(v_work_hours - v_standard_hours, 0);

            -- Update metadata
            NEW.metadata := NEW.metadata || jsonb_build_object(
                'work_hours', ROUND(v_work_hours, 2),
                'regular_hours', LEAST(v_work_hours, v_standard_hours),
                'overtime_hours', ROUND(v_overtime_hours, 2),
                'overtime_rate', v_overtime_rate
            );

            -- Create overtime request if applicable
            IF v_overtime_hours > 0 THEN
                INSERT INTO universal_transactions (
                    organization_id,
                    transaction_type,
                    transaction_code,
                    smart_code,
                    transaction_date,
                    from_entity_id,
                    reference_entity_id,
                    total_amount,
                    metadata
                ) VALUES (
                    NEW.organization_id,
                    'overtime_request',
                    'OT-' || NEW.from_entity_id || '-' || TO_CHAR(v_clock_in, 'YYYYMMDD'),
                    'HERA.HCM.TIME.OVERTIME.REQ.V1',
                    v_clock_in::DATE,
                    NEW.from_entity_id,
                    NEW.id,
                    v_overtime_hours,
                    jsonb_build_object(
                        'date', v_clock_in::DATE,
                        'hours', v_overtime_hours,
                        'rate', v_overtime_rate,
                        'auto_generated', true,
                        'approval_status', 'pending'
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_calculate_attendance
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION hcm_calculate_attendance();

-- =============================================
-- LEAVE MANAGEMENT TRIGGERS
-- =============================================

-- Trigger: Validate and update leave balances
CREATE OR REPLACE FUNCTION hcm_manage_leave()
RETURNS TRIGGER AS $$
DECLARE
    v_leave_balance NUMERIC;
    v_leave_type TEXT;
    v_leave_days NUMERIC;
    v_employee_data JSONB;
    v_leave_entitlements JSONB;
BEGIN
    -- Process leave requests
    IF NEW.transaction_type = 'leave_request' AND NEW.smart_code LIKE 'HERA.HCM.LEAVE.%' THEN
        
        v_leave_type := NEW.metadata->>'leave_type';
        v_leave_days := COALESCE((NEW.metadata->>'days')::NUMERIC, 0);

        -- Get employee leave entitlements
        SELECT metadata->'leave_entitlements' INTO v_leave_entitlements
        FROM core_entities
        WHERE id = NEW.from_entity_id
        AND organization_id = NEW.organization_id;

        -- Check leave balance
        SELECT (value->>'days')::NUMERIC INTO v_leave_balance
        FROM jsonb_array_elements(COALESCE(v_leave_entitlements, '[]'::JSONB)) AS value
        WHERE value->>'type' = v_leave_type;

        -- Validate leave balance
        IF v_leave_balance IS NULL OR v_leave_balance < v_leave_days THEN
            RAISE EXCEPTION 'Insufficient leave balance. Available: %, Requested: %', 
                            COALESCE(v_leave_balance, 0), v_leave_days;
        END IF;

        -- Update metadata with validation
        NEW.metadata := NEW.metadata || jsonb_build_object(
            'validated', true,
            'available_balance', v_leave_balance,
            'remaining_balance', v_leave_balance - v_leave_days
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_manage_leave
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION hcm_manage_leave();

-- =============================================
-- PERFORMANCE REVIEW TRIGGERS
-- =============================================

-- Trigger: Manage performance review cycles
CREATE OR REPLACE FUNCTION hcm_performance_review()
RETURNS TRIGGER AS $$
DECLARE
    v_review_status TEXT;
    v_overall_rating NUMERIC;
    v_goals_count INTEGER;
    v_completed_goals INTEGER;
BEGIN
    -- Process performance reviews
    IF NEW.transaction_type = 'performance_review' AND NEW.smart_code = 'HERA.HCM.PERF.REVIEW.V1' THEN
        
        -- Count completed goals
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE metadata->>'status' = 'completed')
        INTO v_goals_count, v_completed_goals
        FROM core_entities
        WHERE entity_type = 'performance_goal'
        AND metadata->>'employee_id' = NEW.from_entity_id::TEXT
        AND metadata->>'review_period' = NEW.metadata->>'review_period'
        AND organization_id = NEW.organization_id;

        -- Calculate completion percentage
        IF v_goals_count > 0 THEN
            NEW.metadata := NEW.metadata || jsonb_build_object(
                'goals_count', v_goals_count,
                'completed_goals', v_completed_goals,
                'completion_percentage', ROUND((v_completed_goals::NUMERIC / v_goals_count) * 100, 2)
            );
        END IF;

        -- Set review status based on rating
        v_overall_rating := COALESCE((NEW.metadata->>'overall_rating')::NUMERIC, 0);
        v_review_status := CASE
            WHEN v_overall_rating >= 4.5 THEN 'exceptional'
            WHEN v_overall_rating >= 3.5 THEN 'meets_expectations'
            WHEN v_overall_rating >= 2.5 THEN 'needs_improvement'
            ELSE 'unsatisfactory'
        END;

        NEW.metadata := NEW.metadata || jsonb_build_object('review_status', v_review_status);

        -- Trigger compensation review for exceptional performers
        IF v_review_status = 'exceptional' THEN
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
                NEW.organization_id,
                'compensation_review',
                'COMP-REVIEW-' || NEW.from_entity_id || '-' || TO_CHAR(NOW(), 'YYYYMM'),
                'HERA.HCM.COMP.REVIEW.V1',
                NOW(),
                NEW.from_entity_id,
                NEW.id,
                jsonb_build_object(
                    'trigger_type', 'performance_based',
                    'performance_rating', v_overall_rating,
                    'recommended_increase', '10-15%'
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_performance_review
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION hcm_performance_review();

-- =============================================
-- COMPLIANCE & VALIDATION TRIGGERS
-- =============================================

-- Trigger: Validate compliance requirements
CREATE OR REPLACE FUNCTION hcm_validate_compliance()
RETURNS TRIGGER AS $$
DECLARE
    v_visa_expiry DATE;
    v_contract_expiry DATE;
    v_days_to_expiry INTEGER;
    v_alert_days INTEGER := 90;
BEGIN
    -- Check visa expiry for employees
    IF NEW.entity_type = 'employee' AND NEW.metadata ? 'visa_expiry' THEN
        v_visa_expiry := (NEW.metadata->>'visa_expiry')::DATE;
        v_days_to_expiry := v_visa_expiry - CURRENT_DATE;

        -- Create alert if visa expiring soon
        IF v_days_to_expiry <= v_alert_days AND v_days_to_expiry > 0 THEN
            INSERT INTO universal_transactions (
                organization_id,
                transaction_type,
                transaction_code,
                smart_code,
                transaction_date,
                from_entity_id,
                metadata
            ) VALUES (
                NEW.organization_id,
                'compliance_alert',
                'VISA-ALERT-' || NEW.id || '-' || TO_CHAR(NOW(), 'YYYYMMDD'),
                'HERA.HCM.COMP.ALERT.V1',
                NOW(),
                NEW.id,
                jsonb_build_object(
                    'alert_type', 'visa_expiry',
                    'expiry_date', v_visa_expiry,
                    'days_remaining', v_days_to_expiry,
                    'severity', CASE
                        WHEN v_days_to_expiry <= 30 THEN 'critical'
                        WHEN v_days_to_expiry <= 60 THEN 'high'
                        ELSE 'medium'
                    END
                )
            );
        END IF;
    END IF;

    -- Check contract expiry
    IF NEW.entity_type = 'employment_contract' AND NEW.metadata ? 'end_date' THEN
        v_contract_expiry := (NEW.metadata->>'end_date')::DATE;
        v_days_to_expiry := v_contract_expiry - CURRENT_DATE;

        -- Create alert if contract expiring soon
        IF v_days_to_expiry <= v_alert_days AND v_days_to_expiry > 0 THEN
            INSERT INTO universal_transactions (
                organization_id,
                transaction_type,
                transaction_code,
                smart_code,
                transaction_date,
                from_entity_id,
                metadata
            ) VALUES (
                NEW.organization_id,
                'compliance_alert',
                'CONTRACT-ALERT-' || NEW.id || '-' || TO_CHAR(NOW(), 'YYYYMMDD'),
                'HERA.HCM.COMP.ALERT.V1',
                NOW(),
                NEW.id,
                jsonb_build_object(
                    'alert_type', 'contract_expiry',
                    'expiry_date', v_contract_expiry,
                    'days_remaining', v_days_to_expiry,
                    'severity', CASE
                        WHEN v_days_to_expiry <= 30 THEN 'critical'
                        WHEN v_days_to_expiry <= 60 THEN 'high'
                        ELSE 'medium'
                    END
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_validate_compliance
    AFTER INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION hcm_validate_compliance();

-- =============================================
-- AI-POWERED ANALYTICS TRIGGERS
-- =============================================

-- Trigger: Detect attrition risk using AI signals
CREATE OR REPLACE FUNCTION hcm_ai_attrition_detection()
RETURNS TRIGGER AS $$
DECLARE
    v_risk_score NUMERIC := 0;
    v_risk_factors JSONB := '[]'::JSONB;
    v_recent_reviews NUMERIC;
    v_salary_percentile NUMERIC;
    v_leave_usage NUMERIC;
BEGIN
    -- Only process for employees
    IF NEW.entity_type = 'employee' THEN
        
        -- Check recent performance reviews
        SELECT AVG((metadata->>'overall_rating')::NUMERIC) INTO v_recent_reviews
        FROM universal_transactions
        WHERE transaction_type = 'performance_review'
        AND from_entity_id = NEW.id
        AND transaction_date > NOW() - INTERVAL '1 year';

        IF v_recent_reviews < 3.0 THEN
            v_risk_score := v_risk_score + 20;
            v_risk_factors := v_risk_factors || jsonb_build_object(
                'factor', 'low_performance_rating',
                'value', v_recent_reviews,
                'weight', 20
            );
        END IF;

        -- Check salary competitiveness
        WITH salary_stats AS (
            SELECT 
                AVG((metadata->>'base_salary')::NUMERIC) as avg_salary,
                STDDEV((metadata->>'base_salary')::NUMERIC) as stddev_salary
            FROM core_entities
            WHERE entity_type = 'employee'
            AND metadata->>'job_family' = NEW.metadata->>'job_family'
            AND organization_id = NEW.organization_id
        )
        SELECT 
            CASE 
                WHEN (NEW.metadata->>'base_salary')::NUMERIC < (avg_salary - stddev_salary) 
                THEN 30 
                ELSE 0 
            END INTO v_salary_percentile
        FROM salary_stats;

        v_risk_score := v_risk_score + v_salary_percentile;

        -- Check leave usage patterns
        SELECT COUNT(*) INTO v_leave_usage
        FROM universal_transactions
        WHERE transaction_type = 'leave_request'
        AND from_entity_id = NEW.id
        AND metadata->>'leave_type' = 'sick'
        AND transaction_date > NOW() - INTERVAL '3 months';

        IF v_leave_usage > 5 THEN
            v_risk_score := v_risk_score + 15;
            v_risk_factors := v_risk_factors || jsonb_build_object(
                'factor', 'high_sick_leave_usage',
                'value', v_leave_usage,
                'weight', 15
            );
        END IF;

        -- Store risk assessment
        IF v_risk_score > 30 THEN
            NEW.metadata := NEW.metadata || jsonb_build_object(
                'attrition_risk', jsonb_build_object(
                    'score', v_risk_score,
                    'level', CASE
                        WHEN v_risk_score >= 60 THEN 'high'
                        WHEN v_risk_score >= 40 THEN 'medium'
                        ELSE 'low'
                    END,
                    'factors', v_risk_factors,
                    'assessed_at', NOW()
                )
            );

            -- Create alert for HR
            IF v_risk_score >= 60 THEN
                INSERT INTO universal_transactions (
                    organization_id,
                    transaction_type,
                    transaction_code,
                    smart_code,
                    transaction_date,
                    from_entity_id,
                    metadata
                ) VALUES (
                    NEW.organization_id,
                    'hr_alert',
                    'ATTRITION-RISK-' || NEW.id || '-' || TO_CHAR(NOW(), 'YYYYMMDD'),
                    'HERA.HCM.AI.ATTRITION.V1',
                    NOW(),
                    NEW.id,
                    jsonb_build_object(
                        'alert_type', 'high_attrition_risk',
                        'risk_score', v_risk_score,
                        'risk_factors', v_risk_factors,
                        'recommended_actions', jsonb_build_array(
                            'Schedule retention discussion',
                            'Review compensation',
                            'Assess job satisfaction'
                        )
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hcm_ai_attrition_detection
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION hcm_ai_attrition_detection();

-- =============================================
-- PAYROLL ANOMALY DETECTION
-- =============================================

-- Function: Detect payroll anomalies using AI patterns
CREATE OR REPLACE FUNCTION hcm_detect_payroll_anomaly(
    p_organization_id UUID,
    p_employee_id UUID,
    p_current_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_avg_amount NUMERIC;
    v_stddev_amount NUMERIC;
    v_z_score NUMERIC;
    v_anomaly_detected BOOLEAN := FALSE;
    v_anomaly_reason TEXT;
BEGIN
    -- Calculate historical statistics
    SELECT 
        AVG(total_amount),
        STDDEV(total_amount)
    INTO v_avg_amount, v_stddev_amount
    FROM universal_transactions
    WHERE transaction_type = 'payroll_run'
    AND from_entity_id = p_employee_id
    AND organization_id = p_organization_id
    AND transaction_date > NOW() - INTERVAL '6 months';

    -- Calculate Z-score
    IF v_stddev_amount > 0 THEN
        v_z_score := ABS((p_current_amount - v_avg_amount) / v_stddev_amount);
        
        -- Detect anomaly if Z-score > 2 (outside 95% confidence interval)
        IF v_z_score > 2 THEN
            v_anomaly_detected := TRUE;
            v_anomaly_reason := CASE
                WHEN p_current_amount > v_avg_amount THEN 
                    'Unusually high payroll amount'
                ELSE 
                    'Unusually low payroll amount'
            END;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'anomaly_detected', v_anomaly_detected,
        'reason', v_anomaly_reason,
        'current_amount', p_current_amount,
        'average_amount', ROUND(v_avg_amount, 2),
        'z_score', ROUND(v_z_score, 2),
        'confidence_level', '95%'
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INDEX CREATION FOR PERFORMANCE
-- =============================================

-- Indexes for employee queries
CREATE INDEX IF NOT EXISTS idx_hcm_employees 
    ON core_entities (organization_id, entity_type) 
    WHERE entity_type = 'employee';

CREATE INDEX IF NOT EXISTS idx_hcm_employee_dept 
    ON core_entities (organization_id, (metadata->>'department')) 
    WHERE entity_type = 'employee';

-- Indexes for payroll queries
CREATE INDEX IF NOT EXISTS idx_hcm_payroll_runs 
    ON universal_transactions (organization_id, transaction_type, transaction_date) 
    WHERE transaction_type IN ('payroll_run', 'payslip');

-- Indexes for time and attendance
CREATE INDEX IF NOT EXISTS idx_hcm_time_clock 
    ON universal_transactions (organization_id, from_entity_id, transaction_date) 
    WHERE transaction_type = 'time_clock';

-- Indexes for performance reviews
CREATE INDEX IF NOT EXISTS idx_hcm_performance 
    ON universal_transactions (organization_id, from_entity_id, transaction_type) 
    WHERE transaction_type = 'performance_review';