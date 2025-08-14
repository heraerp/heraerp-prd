# Budgets-Progressive Module Developer Guide

## 🧬 HERA DNA Module: Budgeting & Planning Progressive

### **Business Process Overview**
This module handles comprehensive budgeting and financial planning including budget creation, variance analysis, forecasting, and scenario planning with AI-powered insights and recommendations.

## 📊 Universal Schema Mapping

### **Core Entities Mapping**

#### **1. Budget Periods → `core_entities`**
```sql
-- Budget Period Entity
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    status,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_period',
    'Annual Budget 2024 - Operating Budget',
    'BP2024',
    'budget',
    'active',
    '{"period_type": "annual", "start_date": "2024-01-01", "end_date": "2024-12-31", "budget_type": "operating", "approval_status": "approved"}'
);
```

#### **2. Budget Line Items → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    source_entity_id,  -- Links to budget period
    target_entity_id,  -- Links to GL account
    total_amount,
    currency,
    status,
    workflow_state,
    description,
    ai_insights,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_line',
    'BL-2024-4000-Q1',
    '2024-01-01',
    '{budget_period_entity_id}',
    '{gl_account_entity_id}', -- Sales Revenue account
    125000.00,
    'USD',
    'approved',
    'active',
    'Q1 Sales Revenue Budget - 2024',
    '[{"type":"forecast_accuracy","message":"Budget based on 15% growth from prior year actuals. Historical accuracy: 94%","confidence":91}]',
    '{"period": "Q1", "account_code": "4000", "budget_type": "revenue", "growth_rate": 0.15}'
);
```

#### **3. Budget Properties → `core_dynamic_data`**
```sql
-- Budget Version
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{budget_period_entity_id}',
    'budget_version',
    'text',
    'Budget Version',
    'v2.1',
    'budget_details'
);

-- Approval Status
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{budget_period_entity_id}',
    'approval_status',
    'text',
    'approved',
    'workflow_status'
);
```

#### **4. Variance Analysis → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    source_entity_id,  -- Links to budget line
    total_amount,      -- Variance amount
    currency,
    status,
    description,
    ai_insights,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'budget_variance',
    'VAR-2024-Q1-4000',
    '2024-03-31',
    '{budget_line_transaction_id}',
    8500.00,  -- Favorable variance
    'USD',
    'calculated',
    'Q1 Sales Revenue Variance - Favorable',
    '[{"type":"variance_analysis","message":"Revenue exceeded budget by 6.8% due to new client acquisitions. Trend likely to continue.","confidence":88}]',
    '{"variance_type": "favorable", "variance_percentage": 6.8, "budget_amount": 125000.00, "actual_amount": 133500.00}'
);
```

#### **5. Budget-Account Relationships → `core_relationships`**
```sql
INSERT INTO core_relationships (
    organization_id,
    source_entity_id,     -- Budget Period
    target_entity_id,     -- GL Account
    relationship_type,
    relationship_label,
    is_active,
    workflow_state,
    relationship_data
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{budget_period_entity_id}',
    '{gl_account_entity_id}',
    'budget_account',
    'Budget-Account Relationship',
    true,
    'active',
    '{"budget_amount": 500000.00, "variance_threshold": 10.0, "monitoring_enabled": true}'
);
```

## 🔧 Business Rules & Validations

### **Budget Period Validation Rules**
```sql
-- Budget period validation
CREATE OR REPLACE FUNCTION validate_budget_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure budget period has required fields
    IF NEW.entity_type = 'budget_period' THEN
        -- Check for required budget code format
        IF NEW.entity_code !~ '^BP[0-9]{4}[A-Z]*$' THEN
            RAISE EXCEPTION 'Budget period code must follow format BP2024, BP2024Q1, etc.';
        END IF;
        
        -- Ensure budget period name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'budget_period'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Budget period name must be unique within organization';
        END IF;
        
        -- Validate budget category
        IF NEW.entity_category != 'budget' THEN
            RAISE EXCEPTION 'Budget periods must be classified as budget category';
        END IF;
        
        -- Set default status
        NEW.status := COALESCE(NEW.status, 'draft');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_budget_period_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'budget_period')
    EXECUTE FUNCTION validate_budget_period();
```

### **Budget Line Validation**
```sql
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
        
        -- Amount validation (can be negative for some accounts)
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

CREATE TRIGGER validate_budget_line_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'budget_line')
    EXECUTE FUNCTION validate_budget_line();
```

## 🔐 Row Level Security (RLS)

### **Multi-Tenant Security**
```sql
-- Budget period access policy
CREATE POLICY budget_period_access_policy ON core_entities
    FOR ALL 
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND entity_type = 'budget_period'
    );

-- Budget transaction access policy  
CREATE POLICY budget_transaction_access_policy ON universal_transactions
    FOR ALL
    TO authenticated  
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND transaction_type IN ('budget_line', 'budget_variance', 'budget_forecast')
    );

-- Budget dynamic data policy
CREATE POLICY budget_dynamic_data_policy ON core_dynamic_data
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM core_entities ce
            WHERE ce.id = core_dynamic_data.entity_id
            AND ce.entity_type = 'budget_period'
            AND ce.organization_id = core_dynamic_data.organization_id
        )
    );
```

## 🎯 Smart Codes for Budget Module

### **Budget Transaction Smart Codes**
```sql
-- Budget Smart Code mapping
INSERT INTO smart_code_registry (
    smart_code,
    description,
    business_logic,
    gl_mapping,
    validation_rules
) VALUES 
(
    'HERA.BUDGET.PERIOD.CREATE.v1',
    'Create new budget period with validation and setup',
    '{
        "entity_type": "budget_period",
        "required_fields": ["entity_name", "entity_code"],
        "validation": "budget_period_format",
        "approval_workflow": true,
        "auto_generate": ["entity_code"]
    }',
    '{}',
    '["unique_period_name", "valid_period_code", "date_range_valid"]'
),
(
    'HERA.BUDGET.LINE.CREATE.v1', 
    'Create budget line with GL account mapping',
    '{
        "transaction_type": "budget_line",
        "gl_account_required": true,
        "variance_tracking": true,
        "approval_workflow": true
    }',
    '{
        "supports_all_gl_accounts": true,
        "variance_calculation": "automatic"
    }',
    '["budget_period_exists", "gl_account_valid", "amount_not_zero"]'
),
(
    'HERA.BUDGET.VARIANCE.CALCULATE.v1',
    'Calculate budget variance with AI analysis',
    '{
        "transaction_type": "budget_variance", 
        "auto_calculate": true,
        "ai_analysis": true,
        "trend_prediction": true
    }',
    '{}',
    '["budget_line_exists", "actual_data_available", "period_valid"]'
),
(
    'HERA.BUDGET.FORECAST.GENERATE.v1',
    'Generate budget forecast with scenario analysis',
    '{
        "transaction_type": "budget_forecast",
        "scenario_analysis": true,
        "confidence_intervals": true,
        "sensitivity_analysis": true
    }',
    '{}',
    '["historical_data_sufficient", "forecast_period_valid", "assumptions_documented"]'
);
```

## 🔄 Progressive to Universal Migration

### **Migration Process**
```bash
# Step 1: Analyze progressive budgeting data patterns
npm run analyze-progressive-data --module=budgets-progressive

# Step 2: Generate universal schema from patterns  
npm run generate-universal-mapping --source=budgets-progressive

# Step 3: Migrate data to universal tables
npm run migrate-to-universal --module=budgets-progressive --dry-run
npm run migrate-to-universal --module=budgets-progressive --execute

# Step 4: Update UI to use Universal API
npm run update-api-endpoints --module=budgets-progressive --target=universal
```

## 📋 Developer Checklist

### **Schema Validation**
- [ ] All budget periods mapped to `core_entities` with `entity_type='budget_period'`
- [ ] Budget details stored in `core_dynamic_data`
- [ ] Budget lines stored in `universal_transactions` with `transaction_type='budget_line'`
- [ ] Variance analysis in `universal_transactions` with `transaction_type='budget_variance'`
- [ ] Budget-account relationships in `core_relationships`

### **Business Rules**
- [ ] Budget period validation triggers implemented
- [ ] Budget line validation with GL account checks
- [ ] Variance calculation automation
- [ ] Approval workflow integration
- [ ] Budget version control

### **Security**
- [ ] RLS policies for multi-tenant isolation
- [ ] Organization-specific access controls
- [ ] User role-based permissions for budget operations
- [ ] Audit trail for all budget transactions

### **API Integration**
- [ ] All CRUD operations use `/api/v1/universal`
- [ ] Proper organization_id filtering
- [ ] Real-time variance calculations
- [ ] Budget approval workflows

## 🚀 Performance Considerations

### **Indexing Strategy**
```sql
-- Budget period lookup optimization
CREATE INDEX idx_budget_periods_by_org ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'budget_period';

-- Budget line queries
CREATE INDEX idx_budget_lines_by_period ON universal_transactions 
(organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'budget_line';

-- Budget variance analysis optimization
CREATE INDEX idx_budget_variance_by_line ON universal_transactions 
(organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'budget_variance';

-- Budget dynamic data lookup
CREATE INDEX idx_budget_dynamic_data ON core_dynamic_data 
(organization_id, entity_id, field_name)
WHERE field_name IN ('budget_version', 'approval_status', 'variance_threshold');
```

### **Query Optimization**
```sql
-- Optimized budget vs actual analysis query
SELECT 
    bp.entity_name as budget_period,
    bp.entity_code as budget_code,
    gla.entity_code as account_code,
    gla.entity_name as account_name,
    bl.total_amount as budget_amount,
    COALESCE(actuals.actual_amount, 0) as actual_amount,
    bl.total_amount - COALESCE(actuals.actual_amount, 0) as variance_amount,
    CASE 
        WHEN bl.total_amount != 0 THEN 
            ROUND(((COALESCE(actuals.actual_amount, 0) - bl.total_amount) / ABS(bl.total_amount)) * 100, 1)
        ELSE 0 
    END as variance_percentage,
    CASE
        WHEN gla.entity_category IN ('revenue') THEN
            CASE WHEN COALESCE(actuals.actual_amount, 0) > bl.total_amount THEN 'Favorable' ELSE 'Unfavorable' END
        WHEN gla.entity_category IN ('expense') THEN
            CASE WHEN COALESCE(actuals.actual_amount, 0) < bl.total_amount THEN 'Favorable' ELSE 'Unfavorable' END
        ELSE 'Neutral'
    END as variance_type
FROM core_entities bp
JOIN universal_transactions bl ON bp.id = bl.source_entity_id
JOIN core_entities gla ON bl.target_entity_id = gla.id
LEFT JOIN (
    SELECT 
        utl.gl_account_code,
        SUM(CASE 
            WHEN ut.transaction_type IN ('journal_entry') AND utl.notes LIKE 'Debit:%' THEN utl.line_amount
            WHEN ut.transaction_type IN ('journal_entry') AND utl.notes LIKE 'Credit:%' THEN -utl.line_amount
            ELSE 0 
        END) as actual_amount
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.organization_id = $1
    AND ut.status = 'posted'
    AND ut.transaction_date >= $2
    AND ut.transaction_date <= $3
    GROUP BY utl.gl_account_code
) actuals ON gla.entity_code = actuals.gl_account_code
WHERE bp.organization_id = $1 
AND bp.entity_type = 'budget_period'
AND bl.transaction_type = 'budget_line'
AND bl.status = 'approved'
ORDER BY gla.entity_code;
```

## 💡 Best Practices

1. **Always use Universal API** - Don't create budget-specific endpoints
2. **Leverage Smart Codes** - Use `HERA.BUDGET.*` codes for business logic
3. **Multi-tenant First** - Always include organization_id
4. **AI-Native Design** - Use AI for variance analysis and forecasting
5. **Version Control** - Maintain budget version history
6. **Approval Workflows** - Implement proper budget approval processes
7. **Real-time Variance** - Provide real-time budget vs actual analysis
8. **Scenario Planning** - Support multiple budget scenarios and what-if analysis

This Budgets module demonstrates the complete HERA DNA → Universal Schema pipeline with comprehensive budgeting and planning workflows! 🚀