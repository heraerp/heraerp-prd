-- =====================================================
-- HERA Budgets-Progressive Module Universal Schema
-- Generated from Progressive Prototype Analysis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BUDGET PERIODS SCHEMA
-- =====================================================

-- Sample budget periods
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    entity_subcategory,
    status,
    effective_date,
    metadata,
    ai_classification,
    ai_confidence,
    created_at,
    updated_at
) VALUES 
-- Annual Operating Budget 2024
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_period',
    'Annual Operating Budget 2024',
    'BP2024',
    'budget',
    'operating_budget',
    'approved',
    '2024-01-01'::date,
    '{"period_type": "annual", "start_date": "2024-01-01", "end_date": "2024-12-31", "budget_type": "operating", "approval_date": "2023-12-15", "approved_by": "CFO"}',
    'annual_operating_budget',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Q1 2024 Quarterly Budget
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_period',
    'Q1 2024 Quarterly Budget',
    'BP2024Q1',
    'budget',
    'quarterly_budget',
    'completed',
    '2024-01-01'::date,
    '{"period_type": "quarterly", "start_date": "2024-01-01", "end_date": "2024-03-31", "budget_type": "operating", "parent_budget": "BP2024", "actual_vs_budget": "completed"}',
    'quarterly_budget',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Capital Budget 2024
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_period',
    'Capital Expenditure Budget 2024',
    'CAPEX2024',
    'budget',
    'capital_budget',
    'approved',
    '2024-01-01'::date,
    '{"period_type": "annual", "start_date": "2024-01-01", "end_date": "2024-12-31", "budget_type": "capital", "approval_threshold": 50000, "board_approval": true}',
    'capital_budget',
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Draft Budget 2025
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_period',
    'Draft Operating Budget 2025',
    'BP2025DRAFT',
    'budget',
    'operating_budget',
    'draft',
    '2025-01-01'::date,
    '{"period_type": "annual", "start_date": "2025-01-01", "end_date": "2025-12-31", "budget_type": "operating", "draft_version": "v1.2", "target_growth": 0.12}',
    'draft_budget',
    0.85,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- BUDGET DYNAMIC DATA (Properties)
-- =====================================================

-- Get budget period IDs for dynamic data insertion
WITH budget_period_ids AS (
    SELECT id, entity_code 
    FROM core_entities 
    WHERE entity_type = 'budget_period' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- Annual Budget 2024 (BP2024) properties
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_description,
    field_category,
    field_value,
    field_value_number,
    field_value_boolean,
    display_order,
    is_required,
    is_searchable,
    validation_rules,
    ai_confidence,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    bp.id,
    'budget_version',
    'text',
    'Budget Version',
    'Version number of the budget for tracking changes',
    'budget_details',
    'v2.1',
    NULL,
    NULL,
    1,
    true,
    true,
    '{"format": "v#.#"}',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    bp.id,
    'approval_status',
    'text',
    'Approval Status',
    'Current approval status of the budget',
    'workflow_status',
    'approved',
    NULL,
    NULL,
    2,
    true,
    true,
    '{"enum": ["draft", "pending_approval", "approved", "rejected", "revision_required"]}',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    bp.id,
    'variance_threshold',
    'number',
    'Variance Threshold %',
    'Percentage threshold for flagging significant variances',
    'monitoring_settings',
    '10.0',
    10.0,
    NULL,
    3,
    false,
    false,
    '{"min": 1, "max": 50, "step": 0.1}',
    0.92,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    bp.id,
    'total_budget_amount',
    'number',
    'Total Budget Amount',
    'Total approved budget amount for this period',
    'financial_metrics',
    '2750000.00',
    2750000.00,
    NULL,
    4,
    false,
    true,
    '{"currency": "USD", "min": 0}',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    bp.id,
    'target_growth_rate',
    'number',
    'Target Growth Rate %',
    'Expected growth rate compared to previous period',
    'planning_assumptions',
    '15.0',
    15.0,
    NULL,
    5,
    false,
    false,
    '{"min": -50, "max": 100, "step": 0.1}',
    0.88,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024';

-- Q1 2024 Budget properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id, 
    'budget_version', 'text', 'Budget Version', 'budget_details', 'v1.0', NULL, NULL,
    1, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024Q1'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id,
    'approval_status', 'text', 'Approval Status', 'workflow_status', 'approved', NULL, NULL,
    2, true, true, 0.98, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024Q1'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id,
    'actual_performance', 'text', 'Actual Performance', 'performance_metrics', 'exceeded', NULL, NULL,
    6, false, true, 0.94, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024Q1'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id,
    'variance_summary', 'text', 'Variance Summary', 'performance_metrics', 'Overall favorable: +8.2%', NULL, NULL,
    7, false, true, 0.90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2024Q1';

-- Draft Budget 2025 properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id, 
    'budget_version', 'text', 'Budget Version', 'budget_details', 'v1.2', NULL, NULL,
    1, true, true, 0.95, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2025DRAFT'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id,
    'approval_status', 'text', 'Approval Status', 'workflow_status', 'draft', NULL, NULL,
    2, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2025DRAFT'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', bp.id,
    'planning_assumptions', 'text', 'Planning Assumptions', 'planning_assumptions', 'Market growth 12%, inflation 3.2%, new product launch Q2', NULL, NULL,
    8, false, true, 0.85, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_period_ids bp WHERE bp.entity_code = 'BP2025DRAFT';

-- =====================================================
-- BUDGET LINES (Universal Transactions)
-- =====================================================

-- Get IDs for budget lines creation
WITH budget_gl_ids AS (
    SELECT 
        bp.id as budget_id,
        bp.entity_code as budget_code,
        gla.id as gl_account_id,
        gla.entity_code as account_code,
        gla.entity_name as account_name
    FROM core_entities bp
    CROSS JOIN core_entities gla
    WHERE bp.entity_type = 'budget_period' 
    AND gla.entity_type = 'gl_account'
    AND bp.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND gla.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- Sample budget lines for Annual Budget 2024
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    source_entity_id,
    target_entity_id,
    total_amount,
    currency,
    status,
    workflow_state,
    description,
    notes,
    metadata,
    ai_insights,
    ai_risk_score,
    ai_anomaly_score,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_line',
    'BL-2024-4000',
    '2024-01-01'::date,
    'BUDGET-2024-SALES-REVENUE',
    bgi.budget_id,
    bgi.gl_account_id,
    500000.00,
    'USD',
    'approved',
    'active',
    'Annual Sales Revenue Budget 2024',
    'Based on 15% growth from 2023 actuals with new client acquisitions factored',
    '{"account_code": "4000", "budget_type": "revenue", "growth_rate": 0.15, "monthly_distribution": "seasonal", "seasonality_factor": [0.08, 0.08, 0.09, 0.085, 0.09, 0.095, 0.08, 0.075, 0.085, 0.09, 0.08, 0.085]}',
    '[
        {
            "type": "forecast_accuracy",
            "message": "Budget based on 15% growth assumption. Historical accuracy of similar forecasts: 94%",
            "confidence": 91,
            "priority": "medium"
        },
        {
            "type": "market_analysis",
            "message": "Market growth trends support aggressive revenue targets. Monitor competitive landscape.",
            "confidence": 87,
            "priority": "medium"
        }
    ]',
    15,
    5,
    'budget_manager',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_gl_ids bgi 
WHERE bgi.budget_code = 'BP2024' AND bgi.account_code = '4000'

UNION ALL

SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'budget_line', 'BL-2024-5000',
    '2024-01-01'::date, 'BUDGET-2024-COGS', bgi.budget_id, bgi.gl_account_id, -200000.00, 'USD',
    'approved', 'active', 'Annual Cost of Goods Sold Budget 2024',
    'Estimated at 40% of revenue with supply chain optimization initiatives',
    '{"account_code": "5000", "budget_type": "expense", "cost_ratio": 0.40, "optimization_target": 0.02}',
    '[
        {
            "type": "cost_optimization",
            "message": "Target 2% cost reduction through supply chain optimization. Track supplier negotiations.",
            "confidence": 82,
            "priority": "high"
        }
    ]',
    20, 8, 'budget_manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_gl_ids bgi WHERE bgi.budget_code = 'BP2024' AND bgi.account_code = '5000'

UNION ALL

SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'budget_line', 'BL-2024-6000',
    '2024-01-01'::date, 'BUDGET-2024-OPEX', bgi.budget_id, bgi.gl_account_id, -180000.00, 'USD',
    'approved', 'active', 'Annual Operating Expenses Budget 2024',
    'General operating expenses including salaries, rent, utilities, and administrative costs',
    '{"account_code": "6000", "budget_type": "expense", "cost_control_measures": ["headcount_freeze", "vendor_renegotiation"]}',
    '[
        {
            "type": "expense_control",
            "message": "Operating expenses budgeted conservatively. Implement cost control measures as planned.",
            "confidence": 89,
            "priority": "medium"
        }
    ]',
    25, 12, 'budget_manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_gl_ids bgi WHERE bgi.budget_code = 'BP2024' AND bgi.account_code = '6000';

-- Q1 2024 Budget Lines (Quarterly breakdown)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, target_entity_id, total_amount, currency,
    status, workflow_state, description, ai_insights, ai_risk_score, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'budget_line', 'BL-Q1-2024-4000',
    '2024-01-01'::date, 'BUDGET-Q1-2024-SALES', bgi.budget_id, bgi.gl_account_id, 125000.00, 'USD',
    'approved', 'completed', 'Q1 2024 Sales Revenue Budget',
    '[
        {
            "type": "quarterly_performance",
            "message": "Q1 traditionally slower due to seasonality. Target conservative with upside potential.",
            "confidence": 93,
            "priority": "low"
        }
    ]',
    10, '{"account_code": "4000", "quarterly_target": 125000, "actual_achieved": 133500, "variance": 8500}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_gl_ids bgi WHERE bgi.budget_code = 'BP2024Q1' AND bgi.account_code = '4000'

UNION ALL

SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'budget_line', 'BL-Q1-2024-5000',
    '2024-01-01'::date, 'BUDGET-Q1-2024-COGS', bgi.budget_id, bgi.gl_account_id, -50000.00, 'USD',
    'approved', 'completed', 'Q1 2024 Cost of Goods Sold Budget',
    '[{"type": "cost_performance", "message": "COGS came in under budget due to supplier negotiations. Favorable variance.", "confidence": 95}]',
    8, '{"account_code": "5000", "quarterly_target": 50000, "actual_achieved": 48200, "variance": -1800}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM budget_gl_ids bgi WHERE bgi.budget_code = 'BP2024Q1' AND bgi.account_code = '5000';

-- =====================================================
-- BUDGET VARIANCE TRANSACTIONS
-- =====================================================

-- Variance analysis transactions for Q1 2024
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    source_entity_id, -- References the budget line transaction
    total_amount,     -- Variance amount (positive = favorable for revenue, negative = unfavorable)
    currency,
    status,
    workflow_state,
    description,
    notes,
    metadata,
    ai_insights,
    ai_risk_score,
    ai_anomaly_score,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_variance',
    'VAR-Q1-2024-4000',
    '2024-03-31'::date,
    'VARIANCE-Q1-SALES-FAV',
    bl.id, -- Revenue budget line
    8500.00, -- Favorable variance
    'USD',
    'calculated',
    'analyzed',
    'Q1 2024 Sales Revenue Variance - Favorable',
    'Revenue exceeded budget by $8,500 (6.8%) due to new client acquisitions and higher than expected project values',
    '{"variance_type": "favorable", "variance_percentage": 6.8, "budget_amount": 125000.00, "actual_amount": 133500.00, "primary_drivers": ["new_clients", "higher_project_values"], "trend_projection": "positive"}',
    '[
        {
            "type": "variance_analysis",
            "message": "Revenue exceeded budget by 6.8% due to new client acquisitions. Trend likely to continue through Q2.",
            "confidence": 88,
            "priority": "medium",
            "impact": "positive",
            "recommended_action": "Consider revising annual revenue targets upward"
        },
        {
            "type": "trend_prediction",
            "message": "New client pipeline suggests sustained revenue growth. Monitor client retention and project pipeline.",
            "confidence": 85,
            "priority": "medium"
        }
    ]',
    12,
    3,
    'variance_analyzer',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM universal_transactions bl 
WHERE bl.transaction_number = 'BL-Q1-2024-4000'
AND bl.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'

UNION ALL

SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'budget_variance', 'VAR-Q1-2024-5000',
    '2024-03-31'::date, 'VARIANCE-Q1-COGS-FAV', bl.id, 1800.00, 'USD',
    'calculated', 'analyzed', 'Q1 2024 COGS Variance - Favorable',
    'Cost of goods sold came in $1,800 (3.6%) under budget due to successful supplier negotiations',
    '{"variance_type": "favorable", "variance_percentage": -3.6, "budget_amount": 50000.00, "actual_amount": 48200.00, "primary_drivers": ["supplier_negotiations", "bulk_purchasing"], "cost_savings": 1800}',
    '[
        {
            "type": "cost_performance",
            "message": "COGS favorable variance due to supplier negotiations. Savings sustainable for remainder of year.",
            "confidence": 92,
            "priority": "medium",
            "annual_impact": 7200
        }
    ]',
    8, 2, 'variance_analyzer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM universal_transactions bl WHERE bl.transaction_number = 'BL-Q1-2024-5000'
AND bl.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- BUDGET FORECASTS
-- =====================================================

-- Forecast transactions for remaining quarters
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    source_entity_id,
    target_entity_id,
    total_amount,
    currency,
    status,
    workflow_state,
    description,
    notes,
    metadata,
    ai_insights,
    ai_risk_score,
    ai_anomaly_score,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_forecast',
    'FCST-2024-Q2Q4-4000',
    CURRENT_DATE,
    'FORECAST-2024-REVENUE-REVISED',
    bp.id, -- Annual budget
    gla.id, -- Sales revenue account
    540000.00, -- Revised forecast for Q2-Q4 (up from original 375000)
    'USD',
    'active',
    'forecasted',
    'Revised Revenue Forecast Q2-Q4 2024 based on Q1 performance',
    'Upward revision based on Q1 outperformance and strong pipeline. Conservative estimate with 90% confidence interval.',
    '{"forecast_period": "Q2-Q4", "revision_reason": "Q1_outperformance", "confidence_interval": {"low": 520000, "high": 565000}, "probability_distribution": "normal", "key_assumptions": ["client_retention_95%", "new_client_acquisition_target", "no_major_economic_downturn"]}',
    '[
        {
            "type": "forecast_revision",
            "message": "Forecast revised upward based on Q1 outperformance. Full year revenue projection: $673,500 vs budget $500,000.",
            "confidence": 87,
            "priority": "high",
            "full_year_impact": 173500
        },
        {
            "type": "risk_assessment",
            "message": "Key risks: economic downturn (15% probability), client concentration (medium risk), competitive pressure (low risk).",
            "confidence": 82,
            "priority": "medium"
        }
    ]',
    18,
    7,
    'forecast_analyst',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities bp, core_entities gla
WHERE bp.entity_code = 'BP2024' AND gla.entity_code = '4000'
AND bp.entity_type = 'budget_period' AND gla.entity_type = 'gl_account'
AND bp.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
AND gla.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- BUDGET-ACCOUNT RELATIONSHIPS
-- =====================================================

-- Create relationships between budget periods and GL accounts
WITH budget_account_relationships AS (
    SELECT DISTINCT
        bp.id as budget_id,
        gla.id as account_id,
        bp.entity_name as budget_name,
        gla.entity_name as account_name,
        bp.entity_code as budget_code,
        gla.entity_code as account_code
    FROM core_entities bp
    JOIN universal_transactions bt ON bp.id = bt.source_entity_id
    JOIN core_entities gla ON bt.target_entity_id = gla.id
    WHERE bp.entity_type = 'budget_period'
    AND gla.entity_type = 'gl_account'
    AND bt.transaction_type = 'budget_line'
    AND bp.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_label,
    relationship_strength,
    is_bidirectional,
    is_active,
    workflow_state,
    relationship_data,
    effective_date,
    ai_discovered,
    ai_confidence,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    bar.budget_id,
    bar.account_id,
    'budget_account',
    'Budget-Account Relationship: ' || bar.budget_name || ' -> ' || bar.account_name,
    0.95,
    false,
    true,
    'active',
    JSON_BUILD_OBJECT(
        'budget_code', bar.budget_code,
        'account_code', bar.account_code,
        'variance_monitoring', true,
        'threshold_percentage', 10.0,
        'automated_alerts', true
    ),
    CURRENT_DATE,
    false,
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM budget_account_relationships bar;

-- =====================================================
-- VALIDATION TRIGGERS AND FUNCTIONS
-- =====================================================

-- Budget period validation function
CREATE OR REPLACE FUNCTION validate_budget_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate budget period entity
    IF NEW.entity_type = 'budget_period' THEN
        -- Check budget period code format
        IF NEW.entity_code !~ '^(BP|CAPEX)[0-9]{4}[A-Z0-9]*$' THEN
            RAISE EXCEPTION 'Budget period code must follow format BP2024, BP2024Q1, CAPEX2024, etc. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure budget period name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'budget_period'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Budget period name "%" already exists in organization', NEW.entity_name;
        END IF;
        
        -- Validate budget category
        IF NEW.entity_category != 'budget' THEN
            RAISE EXCEPTION 'Budget periods must be classified as budget category';
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'draft');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create budget period validation trigger
DROP TRIGGER IF EXISTS validate_budget_period_trigger ON core_entities;
CREATE TRIGGER validate_budget_period_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'budget_period')
    EXECUTE FUNCTION validate_budget_period();

-- Budget line validation function
CREATE OR REPLACE FUNCTION validate_budget_line()
RETURNS TRIGGER AS $$
DECLARE
    budget_period_exists boolean := false;
    gl_account_exists boolean := false;
BEGIN
    -- Validate budget line transactions
    IF NEW.transaction_type = 'budget_line' THEN
        -- Ensure budget line has budget period
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'Budget line must have a budget period (source_entity_id)';
        END IF;
        
        -- Ensure budget line has GL account
        IF NEW.target_entity_id IS NULL THEN
            RAISE EXCEPTION 'Budget line must have a GL account (target_entity_id)';
        END IF;
        
        -- Validate budget period exists and is active
        SELECT 
            EXISTS(SELECT 1 FROM core_entities 
                  WHERE id = NEW.source_entity_id 
                  AND entity_type = 'budget_period'
                  AND status IN ('draft', 'active', 'approved')
                  AND organization_id = NEW.organization_id)
        INTO budget_period_exists;
        
        IF NOT budget_period_exists THEN
            RAISE EXCEPTION 'Invalid or inactive budget period for budget line';
        END IF;
        
        -- Validate GL account exists
        SELECT 
            EXISTS(SELECT 1 FROM core_entities 
                  WHERE id = NEW.target_entity_id 
                  AND entity_type = 'gl_account'
                  AND status = 'active'
                  AND organization_id = NEW.organization_id)
        INTO gl_account_exists;
        
        IF NOT gl_account_exists THEN
            RAISE EXCEPTION 'Invalid or inactive GL account for budget line';
        END IF;
        
        -- Amount validation (can be negative for expense accounts)
        IF NEW.total_amount = 0 THEN
            RAISE EXCEPTION 'Budget line amount cannot be zero';
        END IF;
        
        -- Set defaults
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'draft');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'created');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create budget line validation trigger
DROP TRIGGER IF EXISTS validate_budget_line_trigger ON universal_transactions;
CREATE TRIGGER validate_budget_line_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'budget_line')
    EXECUTE FUNCTION validate_budget_line();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Budget period lookup optimization
CREATE INDEX IF NOT EXISTS idx_budget_periods_by_org 
ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'budget_period';

-- Budget line queries optimization
CREATE INDEX IF NOT EXISTS idx_budget_lines_by_period 
ON universal_transactions (organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'budget_line';

-- Budget variance analysis optimization
CREATE INDEX IF NOT EXISTS idx_budget_variance_by_line 
ON universal_transactions (organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'budget_variance';

-- Budget forecast queries
CREATE INDEX IF NOT EXISTS idx_budget_forecasts_by_period 
ON universal_transactions (organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'budget_forecast';

-- Budget dynamic data lookup optimization
CREATE INDEX IF NOT EXISTS idx_budget_dynamic_data 
ON core_dynamic_data (organization_id, entity_id, field_name, field_type)
WHERE field_name IN ('budget_version', 'approval_status', 'variance_threshold', 'total_budget_amount');

-- Budget-account relationships
CREATE INDEX IF NOT EXISTS idx_budget_account_relationships 
ON core_relationships (organization_id, relationship_type, source_entity_id, target_entity_id)
WHERE relationship_type = 'budget_account';

-- Budget transaction comprehensive lookup
CREATE INDEX IF NOT EXISTS idx_budget_transactions_comprehensive 
ON universal_transactions (organization_id, transaction_type, status, transaction_date, total_amount)
WHERE transaction_type IN ('budget_line', 'budget_variance', 'budget_forecast');

-- =====================================================
-- SAMPLE DATA SUMMARY
-- =====================================================

-- Summary of created budgeting data
DO $$
DECLARE
    budget_period_count integer;
    budget_line_count integer;
    variance_count integer;
    forecast_count integer;
    relationship_count integer;
    dynamic_data_count integer;
    total_budgeted_revenue DECIMAL(15,2);
    total_budgeted_expenses DECIMAL(15,2);
    total_favorable_variances DECIMAL(15,2);
    q1_performance_rating VARCHAR(20);
BEGIN
    SELECT COUNT(*) INTO budget_period_count 
    FROM core_entities 
    WHERE entity_type = 'budget_period' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO budget_line_count 
    FROM universal_transactions 
    WHERE transaction_type = 'budget_line' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO variance_count 
    FROM universal_transactions 
    WHERE transaction_type = 'budget_variance' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO forecast_count 
    FROM universal_transactions 
    WHERE transaction_type = 'budget_forecast' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO relationship_count 
    FROM core_relationships 
    WHERE relationship_type = 'budget_account' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO dynamic_data_count 
    FROM core_dynamic_data cdd
    JOIN core_entities ce ON cdd.entity_id = ce.id
    WHERE ce.entity_type = 'budget_period'
    AND cdd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    -- Calculate budget performance metrics
    SELECT 
        COALESCE(SUM(CASE WHEN ut.total_amount > 0 THEN ut.total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ut.total_amount < 0 THEN ABS(ut.total_amount) ELSE 0 END), 0)
    INTO total_budgeted_revenue, total_budgeted_expenses
    FROM universal_transactions ut
    JOIN core_entities bp ON ut.source_entity_id = bp.id
    WHERE ut.transaction_type = 'budget_line'
    AND ut.status = 'approved'
    AND bp.entity_code = 'BP2024'
    AND ut.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT 
        COALESCE(SUM(total_amount), 0)
    INTO total_favorable_variances
    FROM universal_transactions
    WHERE transaction_type = 'budget_variance'
    AND total_amount > 0
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    -- Determine Q1 performance rating
    IF total_favorable_variances > 8000 THEN
        q1_performance_rating := 'EXCEEDS EXPECTATIONS';
    ELSIF total_favorable_variances > 5000 THEN
        q1_performance_rating := 'MEETS EXPECTATIONS';
    ELSIF total_favorable_variances > 0 THEN
        q1_performance_rating := 'BELOW EXPECTATIONS';
    ELSE
        q1_performance_rating := 'NEEDS IMPROVEMENT';
    END IF;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'HERA Budgets-Progressive Module Schema Created Successfully';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Budget Periods Created: %', budget_period_count;
    RAISE NOTICE 'Budget Lines Created: %', budget_line_count;
    RAISE NOTICE 'Variance Analyses: %', variance_count;
    RAISE NOTICE 'Forecasts Generated: %', forecast_count;
    RAISE NOTICE 'Budget-Account Relationships: %', relationship_count;
    RAISE NOTICE 'Dynamic Data Fields: %', dynamic_data_count;
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE 'Financial Summary (2024 Annual Budget):';
    RAISE NOTICE 'Total Budgeted Revenue: $%', total_budgeted_revenue;
    RAISE NOTICE 'Total Budgeted Expenses: $%', total_budgeted_expenses;
    RAISE NOTICE 'Budgeted Net Income: $%', total_budgeted_revenue - total_budgeted_expenses;
    RAISE NOTICE 'Q1 Favorable Variances: $%', total_favorable_variances;
    RAISE NOTICE 'Q1 Performance Rating: %', q1_performance_rating;
    RAISE NOTICE 'Budget Variance Threshold: 10.0%% (configurable)';
    RAISE NOTICE '====================================================';
END
$$;