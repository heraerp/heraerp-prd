-- HERA AI-Powered Finance Integration - PostgreSQL Implementation
-- Modern AI-driven automatic journal posting system

-- ============================================================================
-- AI EXTENSIONS AND SETUP
-- ============================================================================

-- Install required PostgreSQL AI extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- AI TRANSACTION PATTERN LEARNING TABLES
-- ============================================================================

-- AI learns and stores successful posting patterns
CREATE TABLE ai_transaction_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    smart_code TEXT NOT NULL,
    transaction_pattern JSONB NOT NULL,
    gl_mapping JSONB NOT NULL,
    confidence_score FLOAT NOT NULL DEFAULT 0.0,
    success_rate FLOAT NOT NULL DEFAULT 1.0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP,
    embedding vector(1536), -- For AI similarity matching
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    -- Indexes for performance
    CONSTRAINT fk_ai_patterns_org FOREIGN KEY (organization_id) REFERENCES core_organizations(id)
);

-- Performance indexes
CREATE INDEX idx_ai_patterns_org_smart_code ON ai_transaction_patterns(organization_id, smart_code);
CREATE INDEX idx_ai_patterns_confidence ON ai_transaction_patterns(confidence_score DESC);
CREATE INDEX idx_ai_patterns_success_rate ON ai_transaction_patterns(success_rate DESC);
CREATE INDEX idx_ai_patterns_embedding ON ai_transaction_patterns USING ivfflat (embedding vector_cosine_ops);

-- AI learning feedback table
CREATE TABLE ai_posting_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    pattern_id UUID,
    ai_suggested_mapping JSONB,
    actual_mapping JSONB,
    user_correction JSONB,
    feedback_type VARCHAR(50) NOT NULL, -- 'approved', 'corrected', 'rejected'
    confidence_before FLOAT,
    confidence_after FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    CONSTRAINT fk_ai_feedback_transaction FOREIGN KEY (transaction_id) REFERENCES universal_transactions(id),
    CONSTRAINT fk_ai_feedback_pattern FOREIGN KEY (pattern_id) REFERENCES ai_transaction_patterns(id)
);

-- ============================================================================
-- AI TRANSACTION CLASSIFICATION ENGINE
-- ============================================================================

-- Generate AI embeddings for transaction data (placeholder - would use actual AI model)
CREATE OR REPLACE FUNCTION ai_embed_transaction(transaction_data JSONB)
RETURNS vector AS $$
DECLARE
    embedding_array FLOAT[];
    i INTEGER;
BEGIN
    -- Simplified embedding generation (in production, use actual AI model)
    -- This would be replaced with calls to OpenAI/Claude embeddings API
    
    embedding_array := ARRAY[]::FLOAT[];
    
    -- Generate pseudo-embedding based on transaction characteristics
    FOR i IN 1..1536 LOOP
        embedding_array := array_append(embedding_array, 
            (random() * 2 - 1) * 
            CASE 
                WHEN transaction_data ? 'amount' THEN 
                    LEAST((transaction_data->>'amount')::FLOAT / 10000.0, 1.0)
                ELSE 0.5 
            END
        );
    END LOOP;
    
    RETURN embedding_array::vector;
END;
$$ LANGUAGE plpgsql;

-- Core AI transaction classification function
CREATE OR REPLACE FUNCTION ai_classify_transaction(
    p_smart_code TEXT,
    p_transaction_data JSONB,
    p_organization_id UUID
) RETURNS TABLE(gl_mapping JSONB, confidence FLOAT) AS $$
DECLARE
    similar_pattern RECORD;
    new_mapping JSONB;
    calculated_confidence FLOAT;
    transaction_embedding vector;
BEGIN
    -- Generate embedding for current transaction
    transaction_embedding := ai_embed_transaction(p_transaction_data);
    
    -- Find most similar successful pattern using vector similarity
    SELECT 
        atp.gl_mapping,
        (atp.confidence_score * atp.success_rate * 
         (1.0 - (atp.embedding <-> transaction_embedding))) as weighted_confidence,
        atp.id as pattern_id
    INTO similar_pattern
    FROM ai_transaction_patterns atp
    WHERE atp.organization_id = p_organization_id
    AND atp.smart_code = p_smart_code
    AND atp.success_rate > 0.5
    ORDER BY atp.embedding <-> transaction_embedding
    LIMIT 1;
    
    IF FOUND AND similar_pattern.weighted_confidence > 0.60 THEN
        -- Use learned pattern
        gl_mapping := similar_pattern.gl_mapping;
        confidence := LEAST(similar_pattern.weighted_confidence, 0.95);
        
        -- Update pattern usage
        UPDATE ai_transaction_patterns 
        SET 
            usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE id = similar_pattern.pattern_id;
        
    ELSE
        -- Generate new pattern using Smart Code analysis
        SELECT ai_generate_gl_mapping(p_smart_code, p_transaction_data, p_organization_id)
        INTO new_mapping;
        
        gl_mapping := new_mapping;
        confidence := 0.70; -- Lower confidence for new patterns
        
        -- Store new pattern for future learning
        INSERT INTO ai_transaction_patterns (
            organization_id, smart_code, transaction_pattern, 
            gl_mapping, confidence_score, embedding
        ) VALUES (
            p_organization_id, p_smart_code, p_transaction_data,
            new_mapping, confidence, transaction_embedding
        );
    END IF;
    
    RETURN QUERY SELECT gl_mapping, confidence;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SMART CODE-DRIVEN GL MAPPING GENERATOR
-- ============================================================================

-- Generate GL mapping based on Smart Code patterns
CREATE OR REPLACE FUNCTION ai_generate_gl_mapping(
    smart_code TEXT,
    transaction_data JSONB,
    organization_id UUID
) RETURNS JSONB AS $$
DECLARE
    code_parts TEXT[];
    module_code TEXT;
    sub_module TEXT;
    transaction_type TEXT;
    gl_pattern JSONB;
    org_coa_config JSONB;
BEGIN
    -- Get organization's COA configuration
    SELECT metadata INTO org_coa_config 
    FROM core_organizations 
    WHERE id = organization_id;
    
    -- Parse Smart Code: HERA.MODULE.SUB.TRANSACTION.TYPE.V1
    code_parts := string_to_array(smart_code, '.');
    
    IF array_length(code_parts, 1) >= 4 THEN
        module_code := code_parts[2];      -- PROC, SALES, HR, INV, etc.
        sub_module := code_parts[3];       -- GR, INV, PAYROLL, ADJ, etc.
        transaction_type := code_parts[4]; -- AUTO, MANUAL, etc.
        
        -- Generate GL mapping based on Smart Code pattern
        CASE 
            WHEN module_code = 'PROC' AND sub_module = 'GR' THEN
                gl_pattern := ai_procurement_gl_mapping(transaction_data, org_coa_config);
            WHEN module_code = 'SALES' AND sub_module = 'INV' THEN
                gl_pattern := ai_sales_gl_mapping(transaction_data, org_coa_config);
            WHEN module_code = 'HR' AND sub_module = 'PAYROLL' THEN
                gl_pattern := ai_payroll_gl_mapping(transaction_data, org_coa_config);
            WHEN module_code = 'INV' AND sub_module = 'ADJ' THEN
                gl_pattern := ai_inventory_gl_mapping(transaction_data, org_coa_config);
            WHEN module_code = 'CRM' AND sub_module = 'PAYMENT' THEN
                gl_pattern := ai_payment_gl_mapping(transaction_data, org_coa_config);
            ELSE
                gl_pattern := ai_generic_gl_mapping(transaction_data, org_coa_config);
        END CASE;
        
    ELSE
        -- Fallback for non-standard Smart Codes
        gl_pattern := ai_generic_gl_mapping(transaction_data, org_coa_config);
    END IF;
    
    RETURN gl_pattern;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MODULE-SPECIFIC GL MAPPING FUNCTIONS
-- ============================================================================

-- Procurement: Goods Receipt GL Mapping
CREATE OR REPLACE FUNCTION ai_procurement_gl_mapping(
    transaction_data JSONB,
    org_config JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
    amount NUMERIC;
    vendor_id UUID;
    item_type TEXT;
    gl_entries JSONB;
BEGIN
    amount := (transaction_data->>'total_amount')::NUMERIC;
    vendor_id := (transaction_data->>'vendor_id')::UUID;
    item_type := COALESCE(transaction_data->>'item_type', 'materials');
    
    -- Standard Goods Receipt: DR Inventory, CR Accounts Payable
    gl_entries := jsonb_build_object(
        'journal_entries', jsonb_build_array(
            jsonb_build_object(
                'account_code', CASE item_type 
                    WHEN 'raw_materials' THEN '1330000'
                    WHEN 'finished_goods' THEN '1350000' 
                    ELSE '1320000'
                END,
                'account_name', CASE item_type
                    WHEN 'raw_materials' THEN 'Raw Materials Inventory'
                    WHEN 'finished_goods' THEN 'Finished Goods Inventory'
                    ELSE 'General Inventory'
                END,
                'debit_amount', amount,
                'credit_amount', 0,
                'description', 'Goods Receipt - ' || COALESCE(transaction_data->>'reference_number', 'GR')
            ),
            jsonb_build_object(
                'account_code', '2100000',
                'account_name', 'Accounts Payable',
                'debit_amount', 0,
                'credit_amount', amount,
                'description', 'Goods Receipt - AP Accrual'
            )
        ),
        'balance_check', amount, -- Total debits should equal credits
        'posting_rules', jsonb_build_object(
            'auto_post', true,
            'requires_approval', false,
            'source_document', 'goods_receipt'
        )
    );
    
    RETURN gl_entries;
END;
$$ LANGUAGE plpgsql;

-- Sales: Invoice GL Mapping
CREATE OR REPLACE FUNCTION ai_sales_gl_mapping(
    transaction_data JSONB,
    org_config JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
    net_amount NUMERIC;
    tax_amount NUMERIC;
    total_amount NUMERIC;
    customer_id UUID;
    gl_entries JSONB;
BEGIN
    net_amount := (transaction_data->>'net_amount')::NUMERIC;
    tax_amount := COALESCE((transaction_data->>'tax_amount')::NUMERIC, 0);
    total_amount := net_amount + tax_amount;
    customer_id := (transaction_data->>'customer_id')::UUID;
    
    -- Standard Sales Invoice: DR Accounts Receivable, CR Sales Revenue, CR Tax Payable
    gl_entries := jsonb_build_object(
        'journal_entries', jsonb_build_array(
            jsonb_build_object(
                'account_code', '1200000',
                'account_name', 'Accounts Receivable',
                'debit_amount', total_amount,
                'credit_amount', 0,
                'description', 'Sales Invoice - ' || COALESCE(transaction_data->>'invoice_number', 'INV')
            ),
            jsonb_build_object(
                'account_code', '4110000', 
                'account_name', 'Sales Revenue',
                'debit_amount', 0,
                'credit_amount', net_amount,
                'description', 'Sales Revenue Recognition'
            )
        ) || CASE WHEN tax_amount > 0 THEN
            jsonb_build_array(
                jsonb_build_object(
                    'account_code', '2250000',
                    'account_name', 'Sales Tax Payable',
                    'debit_amount', 0,
                    'credit_amount', tax_amount,
                    'description', 'Sales Tax Collection'
                )
            )
        ELSE '[]'::JSONB END,
        'balance_check', total_amount,
        'posting_rules', jsonb_build_object(
            'auto_post', true,
            'requires_approval', false,
            'source_document', 'sales_invoice'
        )
    );
    
    RETURN gl_entries;
END;
$$ LANGUAGE plpgsql;

-- HR: Payroll GL Mapping
CREATE OR REPLACE FUNCTION ai_payroll_gl_mapping(
    transaction_data JSONB,
    org_config JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
    gross_payroll NUMERIC;
    federal_tax NUMERIC;
    state_tax NUMERIC;
    fica_tax NUMERIC;
    health_insurance NUMERIC;
    retirement_401k NUMERIC;
    net_pay NUMERIC;
    gl_entries JSONB;
BEGIN
    gross_payroll := (transaction_data->>'gross_payroll')::NUMERIC;
    federal_tax := COALESCE((transaction_data->'tax_withholdings'->>'federal')::NUMERIC, gross_payroll * 0.15);
    state_tax := COALESCE((transaction_data->'tax_withholdings'->>'state')::NUMERIC, gross_payroll * 0.05);
    fica_tax := COALESCE((transaction_data->'tax_withholdings'->>'fica')::NUMERIC, gross_payroll * 0.0765);
    health_insurance := COALESCE((transaction_data->'benefit_deductions'->>'health')::NUMERIC, 0);
    retirement_401k := COALESCE((transaction_data->'benefit_deductions'->>'401k')::NUMERIC, 0);
    
    net_pay := gross_payroll - federal_tax - state_tax - fica_tax - health_insurance - retirement_401k;
    
    -- Complex Payroll Journal Entry
    gl_entries := jsonb_build_object(
        'journal_entries', jsonb_build_array(
            -- DR: Wage Expense
            jsonb_build_object(
                'account_code', '5200000',
                'account_name', 'Wages Expense',
                'debit_amount', gross_payroll,
                'credit_amount', 0,
                'description', 'Payroll Expense'
            ),
            -- DR: Employer FICA Expense
            jsonb_build_object(
                'account_code', '5210000',
                'account_name', 'Employer Payroll Tax Expense',
                'debit_amount', fica_tax,
                'credit_amount', 0,
                'description', 'Employer FICA Tax'
            ),
            -- CR: Federal Tax Withholding
            jsonb_build_object(
                'account_code', '2300000',
                'account_name', 'Federal Tax Withholding Payable',
                'debit_amount', 0,
                'credit_amount', federal_tax,
                'description', 'Federal Tax Withholding'
            ),
            -- CR: State Tax Withholding
            jsonb_build_object(
                'account_code', '2310000',
                'account_name', 'State Tax Withholding Payable',
                'debit_amount', 0,
                'credit_amount', state_tax,
                'description', 'State Tax Withholding'
            ),
            -- CR: FICA Tax Payable (Employee + Employer)
            jsonb_build_object(
                'account_code', '2320000',
                'account_name', 'FICA Tax Payable',
                'debit_amount', 0,
                'credit_amount', fica_tax * 2, -- Employee + Employer portion
                'description', 'FICA Tax Payable'
            ),
            -- CR: Health Insurance Payable
            jsonb_build_object(
                'account_code', '2330000',
                'account_name', 'Health Insurance Payable',
                'debit_amount', 0,
                'credit_amount', health_insurance,
                'description', 'Health Insurance Deduction'
            ),
            -- CR: 401k Contributions Payable
            jsonb_build_object(
                'account_code', '2340000',
                'account_name', '401k Contributions Payable',
                'debit_amount', 0,
                'credit_amount', retirement_401k,
                'description', '401k Employee Contribution'
            ),
            -- CR: Accrued Payroll (Net Pay)
            jsonb_build_object(
                'account_code', '2100000',
                'account_name', 'Accrued Payroll',
                'debit_amount', 0,
                'credit_amount', net_pay,
                'description', 'Net Payroll Payable'
            )
        ),
        'balance_check', gross_payroll + fica_tax, -- Total debits
        'posting_rules', jsonb_build_object(
            'auto_post', true,
            'requires_approval', false,
            'source_document', 'payroll_run'
        )
    );
    
    RETURN gl_entries;
END;
$$ LANGUAGE plpgsql;

-- Inventory: Adjustment GL Mapping
CREATE OR REPLACE FUNCTION ai_inventory_gl_mapping(
    transaction_data JSONB,
    org_config JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
    adjustment_value NUMERIC;
    adjustment_type TEXT;
    reason TEXT;
    gl_entries JSONB;
BEGIN
    adjustment_value := (transaction_data->>'total_value_change')::NUMERIC;
    adjustment_type := transaction_data->>'adjustment_type';
    reason := COALESCE(transaction_data->>'reason', 'Inventory Adjustment');
    
    -- Inventory Adjustment Logic
    IF adjustment_value > 0 THEN
        -- Positive adjustment (increase inventory)
        gl_entries := jsonb_build_object(
            'journal_entries', jsonb_build_array(
                jsonb_build_object(
                    'account_code', '1330000',
                    'account_name', 'Finished Goods Inventory',
                    'debit_amount', adjustment_value,
                    'credit_amount', 0,
                    'description', 'Inventory Adjustment - ' || reason
                ),
                jsonb_build_object(
                    'account_code', '4900000',
                    'account_name', 'Other Income',
                    'debit_amount', 0,
                    'credit_amount', adjustment_value,
                    'description', 'Inventory Adjustment Gain'
                )
            )
        );
    ELSE
        -- Negative adjustment (decrease inventory)
        gl_entries := jsonb_build_object(
            'journal_entries', jsonb_build_array(
                jsonb_build_object(
                    'account_code', CASE adjustment_type
                        WHEN 'shrinkage' THEN '5180000'
                        WHEN 'damage' THEN '5190000'
                        WHEN 'obsolescence' THEN '5195000'
                        ELSE '5180000'
                    END,
                    'account_name', CASE adjustment_type
                        WHEN 'shrinkage' THEN 'Inventory Shrinkage Expense'
                        WHEN 'damage' THEN 'Inventory Damage Expense'
                        WHEN 'obsolescence' THEN 'Inventory Obsolescence Expense'
                        ELSE 'Inventory Adjustment Expense'
                    END,
                    'debit_amount', ABS(adjustment_value),
                    'credit_amount', 0,
                    'description', 'Inventory Adjustment - ' || reason
                ),
                jsonb_build_object(
                    'account_code', '1330000',
                    'account_name', 'Finished Goods Inventory', 
                    'debit_amount', 0,
                    'credit_amount', ABS(adjustment_value),
                    'description', 'Inventory Reduction'
                )
            )
        );
    END IF;
    
    gl_entries := gl_entries || jsonb_build_object(
        'balance_check', ABS(adjustment_value),
        'posting_rules', jsonb_build_object(
            'auto_post', true,
            'requires_approval', ABS(adjustment_value) > 10000, -- Large adjustments need approval
            'source_document', 'inventory_adjustment'
        )
    );
    
    RETURN gl_entries;
END;
$$ LANGUAGE plpgsql;

-- Generic GL Mapping (Fallback)
CREATE OR REPLACE FUNCTION ai_generic_gl_mapping(
    transaction_data JSONB,
    org_config JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
    amount NUMERIC;
    transaction_type TEXT;
    gl_entries JSONB;
BEGIN
    amount := COALESCE((transaction_data->>'total_amount')::NUMERIC, 0);
    transaction_type := COALESCE(transaction_data->>'transaction_type', 'general');
    
    -- Simple two-sided entry for unknown transactions
    gl_entries := jsonb_build_object(
        'journal_entries', jsonb_build_array(
            jsonb_build_object(
                'account_code', '1000000',
                'account_name', 'Suspense Account - Debit',
                'debit_amount', amount,
                'credit_amount', 0,
                'description', 'Unclassified Transaction - ' || transaction_type
            ),
            jsonb_build_object(
                'account_code', '2900000',
                'account_name', 'Suspense Account - Credit',
                'debit_amount', 0,
                'credit_amount', amount,
                'description', 'Unclassified Transaction Offset'
            )
        ),
        'balance_check', amount,
        'posting_rules', jsonb_build_object(
            'auto_post', false,
            'requires_approval', true,
            'source_document', 'unknown_transaction'
        )
    );
    
    RETURN gl_entries;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATIC JOURNAL ENTRY CREATION
-- ============================================================================

-- Create journal entries from AI GL mapping
CREATE OR REPLACE FUNCTION create_ai_journal_entries(
    transaction_id UUID,
    gl_mapping JSONB,
    confidence_score FLOAT
) RETURNS BOOLEAN AS $$
DECLARE
    entry JSONB;
    transaction_record RECORD;
    line_id UUID;
    total_debits NUMERIC := 0;
    total_credits NUMERIC := 0;
BEGIN
    -- Get transaction details
    SELECT * INTO transaction_record 
    FROM universal_transactions 
    WHERE id = transaction_id;
    
    -- Create journal entries from GL mapping
    FOR entry IN SELECT * FROM jsonb_array_elements(gl_mapping->'journal_entries')
    LOOP
        line_id := gen_random_uuid();
        
        INSERT INTO universal_transaction_lines (
            id,
            organization_id,
            transaction_id,
            line_number,
            account_code,
            account_name,
            debit_amount,
            credit_amount,
            description,
            line_type,
            ai_generated,
            ai_confidence_score,
            created_at,
            created_by
        ) VALUES (
            line_id,
            transaction_record.organization_id,
            transaction_id,
            (SELECT COALESCE(MAX(line_number), 0) + 10 
             FROM universal_transaction_lines 
             WHERE transaction_id = transaction_id),
            entry->>'account_code',
            entry->>'account_name',
            COALESCE((entry->>'debit_amount')::NUMERIC, 0),
            COALESCE((entry->>'credit_amount')::NUMERIC, 0),
            entry->>'description',
            'ai_generated',
            true,
            confidence_score,
            NOW(),
            'ai-system'::UUID -- System user ID
        );
        
        total_debits := total_debits + COALESCE((entry->>'debit_amount')::NUMERIC, 0);
        total_credits := total_credits + COALESCE((entry->>'credit_amount')::NUMERIC, 0);
    END LOOP;
    
    -- Verify balanced entry
    IF ABS(total_debits - total_credits) > 0.01 THEN
        RAISE EXCEPTION 'Unbalanced journal entry: Debits % Credits %', total_debits, total_credits;
        RETURN FALSE;
    END IF;
    
    -- Update transaction with posting details
    UPDATE universal_transactions 
    SET 
        total_debit_amount = total_debits,
        total_credit_amount = total_credits,
        ai_confidence_score = confidence_score,
        ai_generated_at = NOW()
    WHERE id = transaction_id;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false
        RAISE WARNING 'Failed to create AI journal entries for transaction %: %', transaction_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- REAL-TIME AI POSTING TRIGGER
-- ============================================================================

-- Main AI auto-posting trigger function
CREATE OR REPLACE FUNCTION ai_auto_posting_trigger()
RETURNS TRIGGER AS $$
DECLARE
    ai_result RECORD;
    posting_success BOOLEAN;
BEGIN
    -- Only process transactions with Smart Codes and amounts
    IF NEW.smart_code IS NOT NULL AND NEW.total_amount IS NOT NULL AND NEW.total_amount != 0 THEN
        
        -- Get AI classification and GL mapping
        SELECT gl_mapping, confidence 
        INTO ai_result
        FROM ai_classify_transaction(
            NEW.smart_code,
            COALESCE(NEW.transaction_metadata, '{}'::JSONB) || 
            jsonb_build_object('total_amount', NEW.total_amount),
            NEW.organization_id
        );
        
        -- Auto-post based on confidence level
        IF ai_result.confidence >= 0.85 THEN
            -- High confidence - auto-post immediately
            SELECT create_ai_journal_entries(
                NEW.id, 
                ai_result.gl_mapping,
                ai_result.confidence
            ) INTO posting_success;
            
            IF posting_success THEN
                NEW.posting_status := 'auto_posted';
                NEW.ai_confidence_score := ai_result.confidence;
                NEW.gl_posted_at := NOW();
            ELSE
                NEW.posting_status := 'posting_failed';
                NEW.ai_confidence_score := ai_result.confidence;
            END IF;
            
        ELSIF ai_result.confidence >= 0.60 THEN
            -- Medium confidence - queue for review
            NEW.posting_status := 'pending_review';
            NEW.ai_confidence_score := ai_result.confidence;
            NEW.ai_suggested_mapping := ai_result.gl_mapping;
            
        ELSE
            -- Low confidence - manual posting required
            NEW.posting_status := 'manual_required';
            NEW.ai_confidence_score := ai_result.confidence;
            NEW.ai_suggested_mapping := ai_result.gl_mapping;
        END IF;
        
    ELSE
        -- No Smart Code or amount - manual processing
        NEW.posting_status := 'manual_required';
        NEW.ai_confidence_score := 0.0;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail transaction
        NEW.posting_status := 'ai_error';
        NEW.ai_error_message := SQLERRM;
        RAISE WARNING 'AI posting trigger error for transaction %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach AI trigger to universal_transactions
DROP TRIGGER IF EXISTS ai_auto_posting_trigger ON universal_transactions;
CREATE TRIGGER ai_auto_posting_trigger
    BEFORE INSERT ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION ai_auto_posting_trigger();

-- ============================================================================
-- AI LEARNING AND IMPROVEMENT SYSTEM
-- ============================================================================

-- AI model improvement function (runs daily)
CREATE OR REPLACE FUNCTION ai_improve_posting_accuracy()
RETURNS VOID AS $$
DECLARE
    pattern_record RECORD;
    feedback_record RECORD;
    new_success_rate FLOAT;
BEGIN
    -- Update pattern success rates based on user feedback
    FOR feedback_record IN 
        SELECT 
            pattern_id,
            COUNT(*) as total_feedback,
            SUM(CASE WHEN feedback_type = 'approved' THEN 1 ELSE 0 END) as approved_count
        FROM ai_posting_feedback 
        WHERE created_at > NOW() - INTERVAL '7 days'
        AND pattern_id IS NOT NULL
        GROUP BY pattern_id
        HAVING COUNT(*) >= 5
    LOOP
        new_success_rate := feedback_record.approved_count::FLOAT / feedback_record.total_feedback::FLOAT;
        
        UPDATE ai_transaction_patterns 
        SET 
            success_rate = (success_rate * 0.7) + (new_success_rate * 0.3), -- Weighted average
            usage_count = usage_count + feedback_record.total_feedback,
            updated_at = NOW()
        WHERE id = feedback_record.pattern_id;
    END LOOP;
    
    -- Remove patterns with consistently poor performance
    DELETE FROM ai_transaction_patterns 
    WHERE success_rate < 0.3 AND usage_count > 20;
    
    -- Archive old feedback
    DELETE FROM ai_posting_feedback 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RAISE NOTICE 'AI model improvement completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule daily AI improvement (requires pg_cron)
SELECT cron.schedule('ai-model-improvement', '0 2 * * *', 'SELECT ai_improve_posting_accuracy();');

-- ============================================================================
-- AI REPORTING AND ANALYTICS FUNCTIONS
-- ============================================================================

-- Get AI posting performance metrics
CREATE OR REPLACE FUNCTION get_ai_posting_metrics(
    p_organization_id UUID,
    p_days_back INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    metrics JSONB;
    total_transactions INTEGER;
    auto_posted INTEGER;
    pending_review INTEGER;
    manual_required INTEGER;
    avg_confidence FLOAT;
BEGIN
    -- Calculate AI posting statistics
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN posting_status = 'auto_posted' THEN 1 ELSE 0 END) as auto_posted,
        SUM(CASE WHEN posting_status = 'pending_review' THEN 1 ELSE 0 END) as pending_review,
        SUM(CASE WHEN posting_status = 'manual_required' THEN 1 ELSE 0 END) as manual_required,
        AVG(COALESCE(ai_confidence_score, 0)) as avg_confidence
    INTO total_transactions, auto_posted, pending_review, manual_required, avg_confidence
    FROM universal_transactions 
    WHERE organization_id = p_organization_id
    AND created_at > NOW() - (p_days_back || ' days')::INTERVAL;
    
    metrics := jsonb_build_object(
        'period_days', p_days_back,
        'total_transactions', COALESCE(total_transactions, 0),
        'auto_posted_count', COALESCE(auto_posted, 0),
        'pending_review_count', COALESCE(pending_review, 0),
        'manual_required_count', COALESCE(manual_required, 0),
        'auto_posting_rate', 
            CASE WHEN total_transactions > 0 
            THEN ROUND((auto_posted::FLOAT / total_transactions::FLOAT) * 100, 2)
            ELSE 0 END,
        'average_confidence_score', ROUND(COALESCE(avg_confidence, 0), 3),
        'ai_effectiveness', 
            CASE WHEN total_transactions > 0
            THEN ROUND(((auto_posted + pending_review)::FLOAT / total_transactions::FLOAT) * 100, 2)
            ELSE 0 END
    );
    
    RETURN metrics;
END;
$$ LANGUAGE plpgsql;

-- Get Smart Code performance analysis
CREATE OR REPLACE FUNCTION get_smart_code_performance(
    p_organization_id UUID,
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE(
    smart_code TEXT,
    transaction_count INTEGER,
    auto_posted_count INTEGER,
    auto_posting_rate FLOAT,
    avg_confidence FLOAT,
    most_common_accounts JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.smart_code,
        COUNT(*)::INTEGER as transaction_count,
        SUM(CASE WHEN t.posting_status = 'auto_posted' THEN 1 ELSE 0 END)::INTEGER as auto_posted_count,
        ROUND(
            (SUM(CASE WHEN t.posting_status = 'auto_posted' THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT) * 100, 
            2
        ) as auto_posting_rate,
        ROUND(AVG(COALESCE(t.ai_confidence_score, 0)), 3) as avg_confidence,
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'account_code', tl.account_code,
                'account_name', tl.account_name
            )
        ) as most_common_accounts
    FROM universal_transactions t
    LEFT JOIN universal_transaction_lines tl ON tl.transaction_id = t.id AND tl.ai_generated = true
    WHERE t.organization_id = p_organization_id
    AND t.smart_code IS NOT NULL
    AND t.created_at > NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY t.smart_code
    HAVING COUNT(*) >= 5
    ORDER BY auto_posting_rate DESC, transaction_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INSTALLATION AND SETUP FUNCTIONS
-- ============================================================================

-- Setup AI finance integration for an organization
CREATE OR REPLACE FUNCTION setup_ai_finance_integration(
    p_organization_id UUID
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    pattern_count INTEGER;
BEGIN
    -- Initialize basic AI patterns for common Smart Codes
    INSERT INTO ai_transaction_patterns (
        organization_id, smart_code, transaction_pattern, gl_mapping, confidence_score
    ) VALUES
    (p_organization_id, 'HERA.PROC.GR.AUTO.V1', 
     '{"type": "goods_receipt"}'::JSONB,
     '{"journal_entries": [{"account_code": "1330000", "debit_amount": 0}, {"account_code": "2100000", "credit_amount": 0}]}'::JSONB,
     0.80),
    (p_organization_id, 'HERA.SALES.INV.AUTO.V1',
     '{"type": "sales_invoice"}'::JSONB,
     '{"journal_entries": [{"account_code": "1200000", "debit_amount": 0}, {"account_code": "4110000", "credit_amount": 0}]}'::JSONB,
     0.80),
    (p_organization_id, 'HERA.HR.PAYROLL.AUTO.V1',
     '{"type": "payroll"}'::JSONB,
     '{"journal_entries": [{"account_code": "5200000", "debit_amount": 0}, {"account_code": "2100000", "credit_amount": 0}]}'::JSONB,
     0.75)
    ON CONFLICT (organization_id, smart_code) DO NOTHING;
    
    GET DIAGNOSTICS pattern_count = ROW_COUNT;
    
    result := jsonb_build_object(
        'organization_id', p_organization_id,
        'ai_patterns_created', pattern_count,
        'setup_completed_at', NOW(),
        'status', 'success'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS AND METADATA
-- ============================================================================

COMMENT ON TABLE ai_transaction_patterns IS 'AI learning patterns for automatic GL posting based on Smart Codes and transaction characteristics';
COMMENT ON TABLE ai_posting_feedback IS 'User feedback on AI-generated GL postings for continuous learning';
COMMENT ON FUNCTION ai_classify_transaction IS 'Core AI function that analyzes transactions and suggests GL account mappings';
COMMENT ON FUNCTION ai_auto_posting_trigger IS 'Real-time trigger that automatically creates journal entries using AI classification';
COMMENT ON FUNCTION get_ai_posting_metrics IS 'Analytics function providing AI performance metrics for organizations';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ai_transaction_patterns TO authenticated;
GRANT SELECT, INSERT ON ai_posting_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION ai_classify_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_posting_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION setup_ai_finance_integration TO authenticated;