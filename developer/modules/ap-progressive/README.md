# AP-Progressive Module Developer Guide

## 🧬 HERA DNA Module: Accounts Payable Progressive

### **Business Process Overview**
This module handles the complete AP workflow from vendor management to payment processing with AI-powered fraud detection and payment optimization.

## 📊 Universal Schema Mapping

### **Core Entities Mapping**

#### **1. Vendors → `core_entities`**
```sql
-- Vendor Entity
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
    'vendor',
    'Office Supply Plus',
    'V001',
    'supplier',
    'active',
    '{"business_size": "medium", "industry": "office_supplies"}'
);
```

#### **2. Vendor Properties → `core_dynamic_data`**
```sql
-- Risk Score
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
    '{vendor_entity_id}',
    'risk_score',
    'number',
    'Vendor Risk Score',
    18,
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
    '{vendor_entity_id}',
    'payment_terms',
    'text',
    'NET30',
    'payment_terms'
);

-- Early Payment Discount
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_number,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{vendor_entity_id}',
    'early_payment_discount',
    'number',
    2.5,
    'payment_terms'
);
```

#### **3. AP Invoices → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    due_date,
    source_entity_id,  -- Links to vendor
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
    'ap_invoice',
    'OSP-2024-3456',
    '2024-12-05',
    '2024-12-20',
    '{vendor_entity_id}',
    3500.00,
    350.00,
    'USD',
    'pending',
    'awaiting_approval',
    18,
    '[{"type":"payment_optimization","message":"Pay by Dec 11 for 2.5% discount","confidence":96}]',
    '{"early_payment_eligible": true, "duplicate_check": "clean"}'
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
    'Office Supplies - Paper',
    1,
    50,
    25.00,
    1250.00,
    125.00,
    '6100',
    'ADM001',
    'Administration'
);
```

#### **5. Vendor-Invoice Relationships → `core_relationships`**
```sql
INSERT INTO core_relationships (
    organization_id,
    source_entity_id,     -- Vendor
    target_entity_id,     -- Invoice (stored as entity for tracking)
    relationship_type,
    relationship_label,
    is_active,
    workflow_state,
    relationship_data
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{vendor_entity_id}',
    '{invoice_entity_id}',
    'vendor_invoice',
    'Vendor Invoice Relationship',
    true,
    'active',
    '{"payment_terms": "NET30", "credit_limit": 50000, "current_balance": 3500}'
);
```

## 🔧 Business Rules & Validations

### **Validation Rules**
```sql
-- Vendor validation
CREATE OR REPLACE FUNCTION validate_vendor_entity()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure vendor has required fields
    IF NEW.entity_type = 'vendor' THEN
        -- Check for required vendor code format
        IF NEW.entity_code !~ '^V[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Vendor code must follow format V001, V002, etc.';
        END IF;
        
        -- Ensure vendor name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'vendor'
            AND entity_name = NEW.entity_name
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Vendor name must be unique within organization';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_vendor_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    EXECUTE FUNCTION validate_vendor_entity();
```

### **AP Invoice Validation**
```sql
CREATE OR REPLACE FUNCTION validate_ap_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate AP invoice transactions
    IF NEW.transaction_type = 'ap_invoice' THEN
        -- Ensure invoice has vendor
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'AP invoice must have a vendor (source_entity_id)';
        END IF;
        
        -- Validate vendor exists and is active
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.source_entity_id 
            AND entity_type = 'vendor'
            AND status = 'active'
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid or inactive vendor for AP invoice';
        END IF;
        
        -- Ensure due date is after invoice date
        IF NEW.due_date <= NEW.transaction_date THEN
            RAISE EXCEPTION 'Due date must be after invoice date';
        END IF;
        
        -- Validate amount is positive
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Invoice amount must be positive';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ap_invoice_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_ap_invoice();
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

-- Vendor access policy
CREATE POLICY vendor_access_policy ON core_entities
    FOR ALL 
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND entity_type = 'vendor'
    );

-- AP invoice access policy  
CREATE POLICY ap_invoice_access_policy ON universal_transactions
    FOR ALL
    TO authenticated  
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND transaction_type = 'ap_invoice'
    );

-- Vendor dynamic data policy
CREATE POLICY vendor_dynamic_data_policy ON core_dynamic_data
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM core_entities ce
            WHERE ce.id = core_dynamic_data.entity_id
            AND ce.entity_type = 'vendor'
            AND ce.organization_id = core_dynamic_data.organization_id
        )
    );
```

## 🎯 Smart Codes for AP Module

### **AP Transaction Smart Codes**
```sql
-- AP Smart Code mapping
INSERT INTO smart_code_registry (
    smart_code,
    description,
    business_logic,
    gl_mapping,
    validation_rules
) VALUES 
(
    'HERA.AP.VENDOR.CREATE.v1',
    'Create new vendor entity with validation',
    '{
        "entity_type": "vendor",
        "required_fields": ["entity_name", "entity_code"],
        "validation": "vendor_code_format",
        "auto_generate": ["entity_code"]
    }',
    '{}',
    '["unique_vendor_name", "valid_vendor_code"]'
),
(
    'HERA.AP.INVOICE.CREATE.v1', 
    'Create AP invoice with automatic GL posting',
    '{
        "transaction_type": "ap_invoice",
        "auto_post_gl": true,
        "fraud_check": true,
        "duplicate_check": true
    }',
    '{
        "debit_account": "expense_account_from_line_items",
        "credit_account": "2000_accounts_payable"
    }',
    '["vendor_exists", "positive_amount", "valid_due_date"]'
),
(
    'HERA.AP.PAYMENT.CREATE.v1',
    'Process vendor payment with cash flow impact',
    '{
        "transaction_type": "ap_payment", 
        "auto_post_gl": true,
        "cash_flow_update": true
    }',
    '{
        "debit_account": "2000_accounts_payable",
        "credit_account": "1100_cash_in_bank"
    }',
    '["sufficient_cash_balance", "invoice_exists", "payment_amount_valid"]'
);
```

## 🔄 Progressive to Universal Migration

### **Migration Process**
```bash
# Step 1: Analyze progressive data patterns
npm run analyze-progressive-data --module=ap-progressive

# Step 2: Generate universal schema from patterns  
npm run generate-universal-mapping --source=ap-progressive

# Step 3: Migrate data to universal tables
npm run migrate-to-universal --module=ap-progressive --dry-run
npm run migrate-to-universal --module=ap-progressive --execute

# Step 4: Update UI to use Universal API
npm run update-api-endpoints --module=ap-progressive --target=universal
```

## 📋 Developer Checklist

### **Schema Validation**
- [ ] All vendor data mapped to `core_entities` with `entity_type='vendor'`
- [ ] Vendor properties stored in `core_dynamic_data`
- [ ] AP invoices stored in `universal_transactions` with `transaction_type='ap_invoice'`
- [ ] Invoice line items in `universal_transaction_lines`
- [ ] Vendor-invoice relationships in `core_relationships`

### **Business Rules**
- [ ] Vendor validation triggers implemented
- [ ] AP invoice validation triggers implemented
- [ ] Duplicate invoice detection rules
- [ ] Payment terms validation
- [ ] Credit limit checking

### **Security**
- [ ] RLS policies for multi-tenant isolation
- [ ] Organization-specific access controls
- [ ] User role-based permissions
- [ ] Audit trail for all AP transactions

### **API Integration**
- [ ] All CRUD operations use `/api/v1/universal`
- [ ] Proper organization_id filtering
- [ ] Error handling and validation
- [ ] Smart code integration for business logic

## 🚀 Performance Considerations

### **Indexing Strategy**
```sql
-- Vendor lookup optimization
CREATE INDEX idx_vendors_by_org ON core_entities (organization_id, entity_type) 
WHERE entity_type = 'vendor';

-- AP invoice queries
CREATE INDEX idx_ap_invoices_by_org ON universal_transactions (organization_id, transaction_type, status)
WHERE transaction_type = 'ap_invoice';

-- Vendor dynamic data lookup
CREATE INDEX idx_vendor_dynamic_data ON core_dynamic_data (organization_id, entity_id, field_name);
```

### **Query Optimization**
```sql
-- Optimized vendor with invoices query
SELECT 
    ve.entity_name as vendor_name,
    ve.entity_code as vendor_code,
    COUNT(ut.id) as invoice_count,
    SUM(ut.total_amount) as total_outstanding
FROM core_entities ve
LEFT JOIN universal_transactions ut ON ve.id = ut.source_entity_id
WHERE ve.organization_id = $1 
AND ve.entity_type = 'vendor'
AND ve.status = 'active'
AND (ut.transaction_type = 'ap_invoice' OR ut.id IS NULL)
AND (ut.status != 'paid' OR ut.id IS NULL)
GROUP BY ve.id, ve.entity_name, ve.entity_code
ORDER BY total_outstanding DESC;
```

## 💡 Best Practices

1. **Always use Universal API** - Don't create AP-specific endpoints
2. **Leverage Smart Codes** - Use `HERA.AP.*` codes for business logic
3. **Multi-tenant First** - Always include organization_id
4. **AI-Native Design** - Use built-in AI fields for insights
5. **Progressive Enhancement** - Start with prototype, evolve to universal

This AP module demonstrates the complete HERA DNA → Universal Schema pipeline! 🚀