# AR-Progressive Module Developer Guide

## 🧬 HERA DNA Module: Accounts Receivable Progressive

### **Business Process Overview**
This module handles the complete AR workflow from customer management to collections with AI-powered insights, credit risk assessment, and payment optimization.

## 📊 Universal Schema Mapping

### **Core Entities Mapping**

#### **1. Customers → `core_entities`**
```sql
-- Customer Entity
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
    'customer',
    'TechCorp Solutions',
    'C001',
    'client',
    'active',
    '{"business_size": "enterprise", "industry": "technology", "country": "USA", "state": "CA"}'
);
```

#### **2. Customer Properties → `core_dynamic_data`**
```sql
-- Credit Limit
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_value_number,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{customer_entity_id}',
    'credit_limit',
    'number',
    'Credit Limit',
    75000,
    'financial_metrics'
);

-- Payment Terms
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{customer_entity_id}',
    'payment_terms',
    'text',
    'NET30',
    'payment_terms'
);

-- Credit Score
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_number,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{customer_entity_id}',
    'credit_score',
    'number',
    850,
    'financial_metrics'
);
```

#### **3. AR Invoices → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    due_date,
    source_entity_id,  -- Links to customer
    total_amount,
    tax_amount,
    currency,
    status,
    workflow_state,
    ai_risk_score,
    ai_insights,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'ar_invoice',
    'INV-2024-5678',
    '2024-12-05',
    '2024-12-20',
    '{customer_entity_id}',
    8500.00,
    850.00,
    'USD',
    'sent',
    'awaiting_payment',
    25,
    '[{"type":"collection_optimization","message":"Customer typically pays in 18 days. Follow up on day 15.","confidence":88}]',
    '{"early_payment_discount": true, "credit_check_status": "approved", "collection_priority": "medium"}'
);
```

#### **4. Invoice Line Items → `universal_transaction_lines`**
```sql
INSERT INTO universal_transaction_lines (
    transaction_id,
    organization_id,
    line_description,
    line_order,
    quantity,
    unit_price,
    line_amount,
    tax_amount,
    gl_account_code,
    cost_center,
    department
) VALUES (
    '{invoice_transaction_id}',
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Professional Services - Q4 Consulting',
    1,
    120,
    70.00,
    8400.00,
    840.00,
    '4000',
    'CONS001',
    'Consulting'
);
```

#### **5. Customer-Invoice Relationships → `core_relationships`**
```sql
INSERT INTO core_relationships (
    organization_id,
    source_entity_id,     -- Customer
    target_entity_id,     -- Invoice (stored as entity for tracking)
    relationship_type,
    relationship_label,
    is_active,
    workflow_state,
    relationship_data
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{customer_entity_id}',
    '{invoice_entity_id}',
    'customer_invoice',
    'Customer Invoice Relationship',
    true,
    'active',
    '{"payment_terms": "NET30", "credit_limit": 75000, "current_balance": 8500, "days_outstanding": 5}'
);
```

## 🔧 Business Rules & Validations

### **Customer Validation Rules**
```sql
-- Customer validation
CREATE OR REPLACE FUNCTION validate_ar_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure customer has required fields
    IF NEW.entity_type = 'customer' THEN
        -- Check for required customer code format
        IF NEW.entity_code !~ '^C[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Customer code must follow format C001, C002, etc.';
        END IF;
        
        -- Ensure customer name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'customer'
            AND entity_name = NEW.entity_name
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Customer name must be unique within organization';
        END IF;
        
        -- Set default status
        NEW.status := COALESCE(NEW.status, 'active');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ar_customer_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION validate_ar_customer();
```

### **AR Invoice Validation**
```sql
CREATE OR REPLACE FUNCTION validate_ar_invoice()
RETURNS TRIGGER AS $$
DECLARE
    customer_credit_limit DECIMAL(15,2);
    customer_current_balance DECIMAL(15,2);
BEGIN
    -- Validate AR invoice transactions
    IF NEW.transaction_type = 'ar_invoice' THEN
        -- Ensure invoice has customer
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'AR invoice must have a customer (source_entity_id)';
        END IF;
        
        -- Validate customer exists and is active
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.source_entity_id 
            AND entity_type = 'customer'
            AND status = 'active'
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid or inactive customer for AR invoice';
        END IF;
        
        -- Credit limit check
        SELECT 
            COALESCE(
                (SELECT field_value_number FROM core_dynamic_data 
                 WHERE entity_id = NEW.source_entity_id AND field_name = 'credit_limit'), 
                0
            ),
            COALESCE(
                (SELECT SUM(total_amount) FROM universal_transactions 
                 WHERE source_entity_id = NEW.source_entity_id 
                 AND transaction_type = 'ar_invoice' 
                 AND status IN ('sent', 'overdue')
                 AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)), 
                0
            )
        INTO customer_credit_limit, customer_current_balance;
        
        IF (customer_current_balance + NEW.total_amount) > customer_credit_limit THEN
            RAISE EXCEPTION 'Invoice would exceed customer credit limit. Limit: %, Current: %, New: %', 
                customer_credit_limit, customer_current_balance, NEW.total_amount;
        END IF;
        
        -- Ensure due date is after invoice date
        IF NEW.due_date <= NEW.transaction_date THEN
            RAISE EXCEPTION 'Due date must be after invoice date';
        END IF;
        
        -- Validate amount is positive
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Invoice amount must be positive';
        END IF;
        
        -- Set defaults
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'draft');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'created');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ar_invoice_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_ar_invoice();
```

## 🔐 Row Level Security (RLS)

### **Multi-Tenant Security**
```sql
-- Enable RLS on all tables
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE universal_transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;

-- Customer access policy
CREATE POLICY customer_access_policy ON core_entities
    FOR ALL 
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND entity_type = 'customer'
    );

-- AR invoice access policy  
CREATE POLICY ar_invoice_access_policy ON universal_transactions
    FOR ALL
    TO authenticated  
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND transaction_type = 'ar_invoice'
    );

-- Customer dynamic data policy
CREATE POLICY customer_dynamic_data_policy ON core_dynamic_data
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM core_entities ce
            WHERE ce.id = core_dynamic_data.entity_id
            AND ce.entity_type = 'customer'
            AND ce.organization_id = core_dynamic_data.organization_id
        )
    );
```

## 🎯 Smart Codes for AR Module

### **AR Transaction Smart Codes**
```sql
-- AR Smart Code mapping
INSERT INTO smart_code_registry (
    smart_code,
    description,
    business_logic,
    gl_mapping,
    validation_rules
) VALUES 
(
    'HERA.AR.CUSTOMER.CREATE.v1',
    'Create new customer entity with credit assessment',
    '{
        "entity_type": "customer",
        "required_fields": ["entity_name", "entity_code"],
        "validation": "customer_code_format",
        "credit_check": true,
        "auto_generate": ["entity_code"]
    }',
    '{}',
    '["unique_customer_name", "valid_customer_code", "credit_limit_positive"]'
),
(
    'HERA.AR.INVOICE.CREATE.v1', 
    'Create AR invoice with automatic GL posting and credit checks',
    '{
        "transaction_type": "ar_invoice",
        "auto_post_gl": true,
        "credit_limit_check": true,
        "duplicate_check": true,
        "aging_tracking": true
    }',
    '{
        "debit_account": "1200_accounts_receivable",
        "credit_account": "4000_sales_revenue"
    }',
    '["customer_exists", "positive_amount", "valid_due_date", "credit_limit_ok"]'
),
(
    'HERA.AR.PAYMENT.RECEIVE.v1',
    'Process customer payment with aging update',
    '{
        "transaction_type": "ar_payment", 
        "auto_post_gl": true,
        "aging_update": true,
        "credit_score_impact": true
    }',
    '{
        "debit_account": "1100_cash_in_bank",
        "credit_account": "1200_accounts_receivable"
    }',
    '["invoice_exists", "payment_amount_valid", "customer_active"]'
),
(
    'HERA.AR.CREDIT.MEMO.v1',
    'Process credit memo with automatic adjustments',
    '{
        "transaction_type": "credit_memo",
        "auto_post_gl": true,
        "customer_balance_update": true,
        "reason_tracking": true
    }',
    '{
        "debit_account": "4000_sales_returns",
        "credit_account": "1200_accounts_receivable"
    }',
    '["valid_reason", "positive_amount", "customer_exists"]'
);
```

## 🔄 Progressive to Universal Migration

### **Migration Process**
```bash
# Step 1: Analyze progressive AR data patterns
npm run analyze-progressive-data --module=ar-progressive

# Step 2: Generate universal schema from patterns  
npm run generate-universal-mapping --source=ar-progressive

# Step 3: Migrate data to universal tables
npm run migrate-to-universal --module=ar-progressive --dry-run
npm run migrate-to-universal --module=ar-progressive --execute

# Step 4: Update UI to use Universal API
npm run update-api-endpoints --module=ar-progressive --target=universal
```

## 📋 Developer Checklist

### **Schema Validation**
- [ ] All customers mapped to `core_entities` with `entity_type='customer'`
- [ ] Customer properties stored in `core_dynamic_data`
- [ ] AR invoices stored in `universal_transactions` with `transaction_type='ar_invoice'`
- [ ] Invoice line items in `universal_transaction_lines`
- [ ] Customer-invoice relationships in `core_relationships`

### **Business Rules**
- [ ] Customer validation triggers implemented
- [ ] AR invoice validation triggers implemented
- [ ] Credit limit checking rules
- [ ] Payment terms validation
- [ ] Aging calculation logic

### **Security**
- [ ] RLS policies for multi-tenant isolation
- [ ] Organization-specific access controls
- [ ] User role-based permissions
- [ ] Audit trail for all AR transactions

### **API Integration**
- [ ] All CRUD operations use `/api/v1/universal`
- [ ] Proper organization_id filtering
- [ ] Error handling and validation
- [ ] Smart code integration for business logic

## 🚀 Performance Considerations

### **Indexing Strategy**
```sql
-- Customer lookup optimization
CREATE INDEX idx_customers_by_org ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'customer';

-- AR invoice queries
CREATE INDEX idx_ar_invoices_by_org ON universal_transactions (organization_id, transaction_type, status, due_date)
WHERE transaction_type = 'ar_invoice';

-- Customer dynamic data lookup
CREATE INDEX idx_customer_dynamic_data ON core_dynamic_data (organization_id, entity_id, field_name);

-- Aging analysis optimization
CREATE INDEX idx_ar_invoices_aging ON universal_transactions (organization_id, transaction_type, due_date, status)
WHERE transaction_type = 'ar_invoice' AND status IN ('sent', 'overdue');
```

### **Query Optimization**
```sql
-- Optimized aging analysis query
SELECT 
    ce.entity_name as customer_name,
    ce.entity_code as customer_code,
    ut.transaction_number as invoice_number,
    ut.transaction_date as invoice_date,
    ut.due_date,
    ut.total_amount,
    ut.total_amount - COALESCE(payments.paid_amount, 0) as outstanding_amount,
    CURRENT_DATE - ut.due_date as days_overdue,
    CASE 
        WHEN CURRENT_DATE <= ut.due_date THEN 'Current'
        WHEN CURRENT_DATE - ut.due_date <= 30 THEN '1-30 Days'
        WHEN CURRENT_DATE - ut.due_date <= 60 THEN '31-60 Days'
        WHEN CURRENT_DATE - ut.due_date <= 90 THEN '61-90 Days'
        ELSE '90+ Days'
    END as aging_bucket
FROM core_entities ce
JOIN universal_transactions ut ON ce.id = ut.source_entity_id
LEFT JOIN (
    SELECT 
        source_entity_id,
        SUM(total_amount) as paid_amount
    FROM universal_transactions
    WHERE transaction_type = 'ar_payment'
    AND organization_id = $1
    GROUP BY source_entity_id
) payments ON ce.id = payments.source_entity_id
WHERE ce.organization_id = $1 
AND ce.entity_type = 'customer'
AND ut.transaction_type = 'ar_invoice'
AND ut.status IN ('sent', 'overdue')
ORDER BY days_overdue DESC, outstanding_amount DESC;
```

## 💡 Best Practices

1. **Always use Universal API** - Don't create AR-specific endpoints
2. **Leverage Smart Codes** - Use `HERA.AR.*` codes for business logic
3. **Multi-tenant First** - Always include organization_id
4. **AI-Native Design** - Use built-in AI fields for collection insights
5. **Progressive Enhancement** - Start with prototype, evolve to universal
6. **Credit Management** - Always validate credit limits before invoicing
7. **Aging Tracking** - Maintain real-time aging analysis for collections

This AR module demonstrates the complete HERA DNA → Universal Schema pipeline with comprehensive receivables management! 🚀