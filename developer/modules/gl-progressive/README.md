# GL-Progressive Module Developer Guide

## 🧬 HERA DNA Module: General Ledger Progressive

### **Business Process Overview**
This module handles the complete GL workflow from Chart of Accounts management to journal entries with AI-powered digital accountant features and automatic balancing validation.

## 📊 Universal Schema Mapping

### **Core Entities Mapping**

#### **1. GL Accounts → `core_entities`**
```sql
-- GL Account Entity
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    entity_subcategory,
    status,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Cash in Bank',
    '1100',
    'asset',
    'current_asset',
    'active',
    '{"account_type": "asset", "normal_balance": "debit", "is_control_account": true}'
);
```

#### **2. GL Account Properties → `core_dynamic_data`**
```sql
-- Normal Balance
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
    '{gl_account_entity_id}',
    'normal_balance',
    'text',
    'Normal Balance',
    'debit',
    'account_properties'
);

-- Current Balance
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
    '{gl_account_entity_id}',
    'current_balance',
    'number',
    'Current Balance',
    25000.00,
    'financial_metrics'
);

-- Account Description
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{gl_account_entity_id}',
    'account_description',
    'text',
    'Main operating bank account for daily transactions',
    'account_properties'
);
```

#### **3. Journal Entries → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    total_amount,
    currency,
    status,
    workflow_state,
    description,
    metadata,
    ai_insights
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'journal_entry',
    'JE-20241210-001',
    '2024-12-10',
    'JE-20241210-001',
    1500.00,
    'USD',
    'posted',
    'completed',
    'Sales transaction - cash receipt',
    '{"auto_generated": false, "balanced": true, "entry_count": 2}',
    '[{"type":"validation","message":"Journal entry is balanced and ready for posting","confidence":99}]'
);
```

#### **4. Journal Entry Lines → `universal_transaction_lines`**
```sql
INSERT INTO universal_transaction_lines (
    transaction_id,
    organization_id,
    line_description,
    line_order,
    quantity,
    unit_price,
    line_amount,
    gl_account_code,
    notes,
    metadata
) VALUES 
-- Debit Entry
(
    '{journal_transaction_id}',
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Cash received from sales',
    1,
    1,
    1500.00,
    1500.00,
    '1100',
    'Debit: Cash in Bank',
    '{"entry_type": "debit", "account_name": "Cash in Bank"}'
),
-- Credit Entry
(
    '{journal_transaction_id}',
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Revenue from sales',
    2,
    1,
    1500.00,
    1500.00,
    '4000',
    'Credit: Sales Revenue',
    '{"entry_type": "credit", "account_name": "Sales Revenue"}'
);
```

#### **5. GL Account Hierarchies → `core_relationships`**
```sql
INSERT INTO core_relationships (
    organization_id,
    source_entity_id,     -- Parent Account
    target_entity_id,     -- Child Account
    relationship_type,
    relationship_label,
    is_active,
    workflow_state,
    relationship_data
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{parent_account_entity_id}',  -- 1000 - Assets
    '{child_account_entity_id}',   -- 1100 - Cash in Bank
    'account_hierarchy',
    'Parent-Child Account Relationship',
    true,
    'active',
    '{"hierarchy_level": 2, "rollup_enabled": true, "consolidation": true}'
);
```

## 🔧 Business Rules & Validations

### **GL Account Validation**
```sql
-- GL Account validation
CREATE OR REPLACE FUNCTION validate_gl_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure GL account has required fields
    IF NEW.entity_type = 'gl_account' THEN
        -- Check for required account code format (numeric)
        IF NEW.entity_code !~ '^[0-9]{4,6}$' THEN
            RAISE EXCEPTION 'GL Account code must be 4-6 digits. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure account code is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'gl_account'
            AND entity_code = NEW.entity_code
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'GL Account code "%" already exists in organization', NEW.entity_code;
        END IF;
        
        -- Validate account type
        IF NEW.entity_category NOT IN ('asset', 'liability', 'equity', 'revenue', 'expense') THEN
            RAISE EXCEPTION 'Invalid account type. Must be: asset, liability, equity, revenue, or expense';
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'active');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_gl_account_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'gl_account')
    EXECUTE FUNCTION validate_gl_account();
```

### **Journal Entry Validation**
```sql
CREATE OR REPLACE FUNCTION validate_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
    debit_total DECIMAL(15,2) := 0;
    credit_total DECIMAL(15,2) := 0;
    line_record RECORD;
BEGIN
    -- Validate journal entry transactions
    IF NEW.transaction_type = 'journal_entry' THEN
        -- Ensure journal entry has reference number
        IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
            RAISE EXCEPTION 'Journal entry must have a reference number';
        END IF;
        
        -- Check for duplicate reference numbers
        IF EXISTS (
            SELECT 1 FROM universal_transactions 
            WHERE organization_id = NEW.organization_id 
            AND transaction_type = 'journal_entry'
            AND reference_number = NEW.reference_number
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Journal entry reference number "%" already exists', NEW.reference_number;
        END IF;
        
        -- Validate amount is positive
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Journal entry total amount must be positive';
        END IF;
        
        -- Set default values
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'posted');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'completed');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_journal_entry_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'journal_entry')
    EXECUTE FUNCTION validate_journal_entry();
```

### **Journal Entry Balance Validation** 
```sql
CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
    debit_total DECIMAL(15,2) := 0;
    credit_total DECIMAL(15,2) := 0;
    transaction_type_val VARCHAR;
BEGIN
    -- Get transaction type
    SELECT ut.transaction_type INTO transaction_type_val
    FROM universal_transactions ut
    WHERE ut.id = NEW.transaction_id;
    
    -- Only validate journal entries
    IF transaction_type_val = 'journal_entry' THEN
        -- Calculate total debits and credits for this journal entry
        SELECT 
            COALESCE(SUM(CASE WHEN utl.notes LIKE 'Debit:%' THEN utl.line_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN utl.notes LIKE 'Credit:%' THEN utl.line_amount ELSE 0 END), 0)
        INTO debit_total, credit_total
        FROM universal_transaction_lines utl
        WHERE utl.transaction_id = NEW.transaction_id;
        
        -- Include current line being inserted/updated
        IF NEW.notes LIKE 'Debit:%' THEN
            debit_total := debit_total + NEW.line_amount;
        ELSIF NEW.notes LIKE 'Credit:%' THEN
            credit_total := credit_total + NEW.line_amount;
        END IF;
        
        -- Validate balance (allow small rounding differences)
        IF ABS(debit_total - credit_total) > 0.01 THEN
            RAISE EXCEPTION 'Journal entry must balance. Debits: %, Credits: %', debit_total, credit_total;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would run after all lines are inserted
-- In practice, we validate balance in the application layer
```

## 🔐 Row Level Security (RLS)

### **Multi-Tenant Security**
```sql
-- GL Account access policy
CREATE POLICY gl_account_access_policy ON core_entities
    FOR ALL 
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND entity_type = 'gl_account'
    );

-- Journal entry access policy  
CREATE POLICY journal_entry_access_policy ON universal_transactions
    FOR ALL
    TO authenticated  
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND transaction_type = 'journal_entry'
    );

-- GL account dynamic data policy
CREATE POLICY gl_account_dynamic_data_policy ON core_dynamic_data
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM core_entities ce
            WHERE ce.id = core_dynamic_data.entity_id
            AND ce.entity_type = 'gl_account'
            AND ce.organization_id = core_dynamic_data.organization_id
        )
    );

-- Journal entry lines access policy
CREATE POLICY journal_entry_lines_access_policy ON universal_transaction_lines
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM universal_transactions ut
            WHERE ut.id = universal_transaction_lines.transaction_id
            AND ut.transaction_type = 'journal_entry'
            AND ut.organization_id = universal_transaction_lines.organization_id
        )
    );
```

## 🎯 Smart Codes for GL Module

### **GL Transaction Smart Codes**
```sql
-- GL Smart Code mapping
INSERT INTO smart_code_registry (
    smart_code,
    description,
    business_logic,
    gl_mapping,
    validation_rules
) VALUES 
(
    'HERA.GL.ACCOUNT.CREATE.v1',
    'Create new GL account with validation',
    '{
        "entity_type": "gl_account",
        "required_fields": ["entity_name", "entity_code", "entity_category"],
        "validation": "gl_account_code_format",
        "auto_generate": ["entity_code"]
    }',
    '{}',
    '["unique_account_code", "valid_account_type", "numeric_code_format"]'
),
(
    'HERA.GL.JOURNAL.CREATE.v1', 
    'Create journal entry with automatic balancing validation',
    '{
        "transaction_type": "journal_entry",
        "auto_balance_check": true,
        "duplicate_check": true,
        "reference_generation": true
    }',
    '{
        "supports_multiple_accounts": true,
        "balance_validation": "mandatory"
    }',
    '["balanced_entries", "valid_accounts", "positive_amounts", "unique_reference"]'
),
(
    'HERA.GL.BALANCE.CALCULATE.v1',
    'Calculate account balances with rollup to parent accounts',
    '{
        "calculation_type": "account_balance",
        "rollup_enabled": true,
        "period_support": true,
        "real_time": true
    }',
    '{
        "debit_accounts": ["asset", "expense"],
        "credit_accounts": ["liability", "equity", "revenue"]
    }',
    '["account_exists", "valid_date_range", "numeric_amounts"]'
),
(
    'HERA.GL.COA.SETUP.v1',
    'Setup complete Chart of Accounts with industry templates',
    '{
        "setup_type": "chart_of_accounts",
        "template_support": true,
        "industry_specific": true,
        "hierarchy_creation": true
    }',
    '{
        "account_ranges": {
            "assets": "1000-1999",
            "liabilities": "2000-2999",
            "equity": "3000-3999",
            "revenue": "4000-4999",
            "expenses": "5000-9999"
        }
    }',
    '["valid_account_structure", "no_duplicate_codes", "proper_hierarchy"]'
);
```

## 🔄 Progressive to Universal Migration

### **Migration Process**
```bash
# Step 1: Analyze progressive GL data patterns
npm run analyze-progressive-data --module=gl-progressive

# Step 2: Generate universal schema from GL patterns  
npm run generate-universal-mapping --source=gl-progressive

# Step 3: Migrate GL data to universal tables
npm run migrate-to-universal --module=gl-progressive --dry-run
npm run migrate-to-universal --module=gl-progressive --execute

# Step 4: Update GL UI to use Universal API
npm run update-api-endpoints --module=gl-progressive --target=universal
```

## 📋 Developer Checklist

### **Schema Validation**
- [ ] All GL accounts mapped to `core_entities` with `entity_type='gl_account'`
- [ ] Account properties stored in `core_dynamic_data`
- [ ] Journal entries stored in `universal_transactions` with `transaction_type='journal_entry'`
- [ ] Journal entry lines in `universal_transaction_lines`
- [ ] Account hierarchies in `core_relationships`

### **Business Rules**
- [ ] GL account validation triggers implemented
- [ ] Journal entry validation triggers implemented
- [ ] Balance validation for journal entries
- [ ] Duplicate reference number detection
- [ ] Account code format validation

### **Security**
- [ ] RLS policies for multi-tenant isolation
- [ ] Organization-specific access controls
- [ ] User role-based permissions for GL transactions
- [ ] Audit trail for all GL postings

### **API Integration**
- [ ] All CRUD operations use `/api/v1/universal`
- [ ] Proper organization_id filtering
- [ ] Error handling and validation
- [ ] Smart code integration for GL business logic

## 🚀 Performance Considerations

### **Indexing Strategy**
```sql
-- GL Account lookup optimization
CREATE INDEX idx_gl_accounts_by_org ON core_entities (organization_id, entity_type, entity_code) 
WHERE entity_type = 'gl_account';

-- Journal entry queries
CREATE INDEX idx_journal_entries_by_org ON universal_transactions (organization_id, transaction_type, transaction_date)
WHERE transaction_type = 'journal_entry';

-- GL account dynamic data lookup
CREATE INDEX idx_gl_account_dynamic_data ON core_dynamic_data (organization_id, entity_id, field_name)
WHERE field_name IN ('normal_balance', 'current_balance', 'account_description');

-- Journal entry lines by GL account
CREATE INDEX idx_journal_lines_by_gl_account ON universal_transaction_lines (organization_id, gl_account_code, created_at);
```

### **Query Optimization**
```sql
-- Optimized trial balance query
SELECT 
    ce.entity_code as account_code,
    ce.entity_name as account_name,
    ce.entity_category as account_type,
    dd.field_value as normal_balance,
    COALESCE(
        SUM(CASE WHEN utl.notes LIKE 'Debit:%' THEN utl.line_amount ELSE 0 END) -
        SUM(CASE WHEN utl.notes LIKE 'Credit:%' THEN utl.line_amount ELSE 0 END),
        0
    ) as current_balance
FROM core_entities ce
LEFT JOIN core_dynamic_data dd ON ce.id = dd.entity_id AND dd.field_name = 'normal_balance'
LEFT JOIN universal_transaction_lines utl ON ce.entity_code = utl.gl_account_code
LEFT JOIN universal_transactions ut ON utl.transaction_id = ut.id
WHERE ce.organization_id = $1 
AND ce.entity_type = 'gl_account'
AND ce.status = 'active'
AND (ut.transaction_type = 'journal_entry' OR ut.id IS NULL)
AND (ut.status = 'posted' OR ut.id IS NULL)
AND (ut.transaction_date <= $2 OR ut.id IS NULL)
GROUP BY ce.id, ce.entity_code, ce.entity_name, ce.entity_category, dd.field_value
ORDER BY ce.entity_code;
```

## 💡 Best Practices

1. **Always use Universal API** - Don't create GL-specific endpoints
2. **Leverage Smart Codes** - Use `HERA.GL.*` codes for business logic
3. **Multi-tenant First** - Always include organization_id
4. **AI-Native Design** - Use built-in AI fields for digital accountant insights
5. **Progressive Enhancement** - Start with prototype, evolve to universal
6. **Balance Validation** - Always validate debits = credits before posting
7. **Audit Trail** - Track all GL changes with full transaction history

This GL module demonstrates the complete HERA DNA → Universal Schema pipeline with comprehensive accounting workflows! 🚀